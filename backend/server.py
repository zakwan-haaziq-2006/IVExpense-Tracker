"""IV Expense Tracker backend — FastAPI + SQLite (stdlib sqlite3, no ORM).

Real relational tables: payments, expenses, budgets, and a single-row summary.
Summary is stored (not derived) because the seeded totals intentionally exceed
the visible seed rows; mutations bump it the same way the frontend mock did.
Single-user college trip tracker — no locking / concurrency machinery.
"""
import json
import os
import sqlite3
import sys
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Load local environment variables from .env
load_dotenv()

DB = Path(__file__).with_name("data.db")
DIST = Path(__file__).parent.parent / "frontend" / "dist"
PIN = os.environ.get("IV_PIN", "2006")

SEED_SUMMARY = {
    "received": 0, "spent": 0, "contributors": 0,
    "inHand": 0, "inAccount": 0,
    "categoryPct": [],
}
SEED_PAYMENTS = []
SEED_EXPENSES = []
# One budget row per category so the Expenses screen shows tracking bars and
# add-expense's UPDATE budgets ... WHERE name = category actually hits a row.
# ponytail: placeholder targets — there's no edit-budget UI, tune here if amounts differ.
SEED_BUDGETS = [
    {"name": "Food",          "spent": 0, "target": 15000},
    {"name": "Transport",     "spent": 0, "target": 30000},
    {"name": "Accommodation", "spent": 0, "target": 40000},
    {"name": "Entry Fees",    "spent": 0, "target": 8000},
    {"name": "Misc",          "spent": 0, "target": 7000},
]


# Initialize a global connection pool
db_pool = None


class ConnectionWrapper:
    def __init__(self, conn, is_pg, pool=None):
        self.conn = conn
        self.is_pg = is_pg
        self.pool = pool
        if is_pg:
            from psycopg2.extras import RealDictCursor
            self.cursor = conn.cursor(cursor_factory=RealDictCursor)
        else:
            self.cursor = conn.cursor()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.conn.rollback()
        else:
            self.conn.commit()
        self.cursor.close()
        if self.pool:
            self.pool.putconn(self.conn)
        else:
            self.conn.close()

    def execute(self, query, params=None):
        if self.is_pg:
            query = query.replace("?", "%s")
        if params is None:
            self.cursor.execute(query)
        else:
            self.cursor.execute(query, params)
        return self

    def executescript(self, script):
        if self.is_pg:
            # Replace AUTOINCREMENT with serial/identity for PG compatibility
            pg_script = script.replace("seq INTEGER PRIMARY KEY AUTOINCREMENT", "seq SERIAL PRIMARY KEY")
            self.cursor.execute(pg_script)
        else:
            self.conn.executescript(script)
        return self

    def fetchone(self):
        return self.cursor.fetchone()

    def fetchall(self):
        return self.cursor.fetchall()


def conn():
    # If we are testing (detected by DB path or test name), fallback to local SQLite
    is_test = "test" in str(DB).lower() or tempfile.gettempdir() in str(DB)
    
    url = os.environ.get("DATABASE_URL")
    if url:
        url = url.strip()
        # Handle cases where "DATABASE_URL=..." was pasted
        if url.startswith("DATABASE_URL="):
            url = url.replace("DATABASE_URL=", "", 1).strip()
        # Strip potential surrounding quotes
        if url.startswith('"') and url.endswith('"'):
            url = url[1:-1].strip()
        elif url.startswith("'") and url.endswith("'"):
            url = url[1:-1].strip()

    if url and not is_test:
        global db_pool
        import psycopg2
        from psycopg2.pool import ThreadedConnectionPool
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        
        if db_pool is None:
            db_pool = ThreadedConnectionPool(1, 10, url)
            
        try:
            c = db_pool.getconn()
            # Test connection with a quick query
            with c.cursor() as cur:
                cur.execute("SELECT 1")
            return ConnectionWrapper(c, is_pg=True, pool=db_pool)
        except (psycopg2.OperationalError, psycopg2.InterfaceError):
            # Connection is dead. Try to close it, discard it, and open a new one
            try:
                db_pool.putconn(c, close=True)
            except Exception:
                pass
            c = psycopg2.connect(url)
            return ConnectionWrapper(c, is_pg=True, pool=None)
    else:
        c = sqlite3.connect(DB)
        c.row_factory = sqlite3.Row
        return ConnectionWrapper(c, is_pg=False)




def init():
    with conn() as c:
        c.executescript("""
            CREATE TABLE IF NOT EXISTS summary (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                received REAL, spent REAL, contributors INTEGER,
                in_hand REAL, in_account REAL, category_pct TEXT);
            CREATE TABLE IF NOT EXISTS payments (
                seq INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT, mode TEXT, date TEXT, amount REAL);
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY, seq INTEGER,
                reason TEXT, category TEXT, date TEXT, time TEXT, amount REAL, proof INTEGER);
            CREATE TABLE IF NOT EXISTS budgets (
                name TEXT PRIMARY KEY, spent REAL, target REAL);
        """)
        if c.execute("SELECT 1 FROM summary").fetchone():
            return
        s = SEED_SUMMARY
        c.execute("INSERT INTO summary VALUES (1,?,?,?,?,?,?)",
                  (s["received"], s["spent"], s["contributors"], s["inHand"],
                   s["inAccount"], json.dumps(s["categoryPct"])))
        # insert reversed so ORDER BY seq DESC yields the seed display order (newest first)
        for p in reversed(SEED_PAYMENTS):
            c.execute("INSERT INTO payments (name,mode,date,amount) VALUES (?,?,?,?)",
                      (p["name"], p["mode"], p["date"], p["amount"]))
        for i, e in enumerate(reversed(SEED_EXPENSES)):
            c.execute("INSERT INTO expenses (id,seq,reason,category,date,time,amount,proof) VALUES (?,?,?,?,?,?,?,?)",
                      (e["id"], i, e["reason"], e["category"], e["date"], e["time"], e["amount"], int(e["proof"])))
        for b in SEED_BUDGETS:
            c.execute("INSERT INTO budgets VALUES (?,?,?)", (b["name"], b["spent"], b["target"]))


class Payment(BaseModel):
    name: str
    amount: float
    mode: str
    date: str


class Expense(BaseModel):
    id: int
    reason: str
    amount: float
    category: str
    date: str
    time: str = ""
    proof: bool = False


class Pin(BaseModel):
    pin: str


app = FastAPI(title="IV Expense Tracker")

# Enable CORS for frontend deployment (Vercel) and local development
origins = ["http://localhost:5173", "http://localhost:3000"]
frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)
else:
    origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True if "*" not in origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/api/all")
def get_all():
    with conn() as c:
        # 1. Summary
        r = c.execute("SELECT * FROM summary WHERE id = 1").fetchone()
        rows = c.execute("SELECT category, SUM(amount) AS amt FROM expenses GROUP BY category").fetchall()
        total = sum(row["amt"] for row in rows)
        cat_pct = sorted(([row["category"], round(row["amt"] / total * 100)] for row in rows),
                         key=lambda x: -x[1]) if total else []
        summary_data = {"received": r["received"], "spent": r["spent"], "contributors": r["contributors"],
                        "inHand": r["in_hand"], "inAccount": r["in_account"], "categoryPct": cat_pct}
        
        # 2. Payments
        p_rows = c.execute("SELECT name,mode,date,amount FROM payments ORDER BY seq DESC").fetchall()
        payments_data = [dict(p) for p in p_rows]
        
        # 3. Expenses
        e_rows = c.execute("SELECT id,reason,category,date,time,amount,proof FROM expenses ORDER BY seq DESC").fetchall()
        expenses_data = [{**dict(e), "proof": bool(e["proof"])} for e in e_rows]
        
        # 4. Budgets
        b_rows = c.execute("SELECT name,spent,target FROM budgets").fetchall()
        budgets_data = [dict(b) for b in b_rows]
        
    return {
        "summary": summary_data,
        "payments": payments_data,
        "expenses": expenses_data,
        "budgets": budgets_data
    }


@app.get("/api/summary")
def summary():
    with conn() as c:
        r = c.execute("SELECT * FROM summary WHERE id = 1").fetchone()
        rows = c.execute("SELECT category, SUM(amount) AS amt FROM expenses GROUP BY category").fetchall()
    # categoryPct is derived live from expenses (never stored) so the donut can't drift
    total = sum(row["amt"] for row in rows)
    cat_pct = sorted(([row["category"], round(row["amt"] / total * 100)] for row in rows),
                     key=lambda x: -x[1]) if total else []
    return {"received": r["received"], "spent": r["spent"], "contributors": r["contributors"],
            "inHand": r["in_hand"], "inAccount": r["in_account"], "categoryPct": cat_pct}


@app.get("/api/payments")
def payments():
    with conn() as c:
        rows = c.execute("SELECT name,mode,date,amount FROM payments ORDER BY seq DESC").fetchall()
    return [dict(r) for r in rows]


@app.get("/api/expenses")
def expenses():
    with conn() as c:
        rows = c.execute("SELECT id,reason,category,date,time,amount,proof FROM expenses ORDER BY seq DESC").fetchall()
    return [{**dict(r), "proof": bool(r["proof"])} for r in rows]


@app.get("/api/budgets")
def budgets():
    with conn() as c:
        rows = c.execute("SELECT name,spent,target FROM budgets").fetchall()
    return [dict(r) for r in rows]


@app.post("/api/verify-pin")
def verify_pin(body: Pin):
    return body.pin == PIN


@app.post("/api/payments")
def add_payment(p: Payment):
    if not p.name.strip() or not p.amount:
        raise HTTPException(400, "name and amount required")
    with conn() as c:
        c.execute("INSERT INTO payments (name,mode,date,amount) VALUES (?,?,?,?)",
                  (p.name.strip(), p.mode, p.date, p.amount))
        col = "in_hand" if p.mode == "Cash" else "in_account"
        c.execute(f"UPDATE summary SET received = received + ?, contributors = contributors + 1, "
                  f"{col} = {col} + ? WHERE id = 1", (p.amount, p.amount))
    return p.model_dump()


@app.post("/api/expenses")
def add_expense(e: Expense):
    if not e.reason.strip() or not e.amount:
        raise HTTPException(400, "reason and amount required")
    with conn() as c:
        seq = c.execute("SELECT COALESCE(MAX(seq), -1) + 1 AS n FROM expenses").fetchone()["n"]
        c.execute("INSERT INTO expenses (id,seq,reason,category,date,time,amount,proof) VALUES (?,?,?,?,?,?,?,?)",
                  (e.id, seq, e.reason.strip(), e.category, e.date, e.time, e.amount, int(e.proof)))
        c.execute("UPDATE summary SET spent = spent + ? WHERE id = 1", (e.amount,))
        c.execute("UPDATE budgets SET spent = spent + ? WHERE name = ?", (e.amount, e.category))
        # outflow drains account first, then hand (mirrors the mock — no wallet field on the form)
        s = c.execute("SELECT in_hand, in_account FROM summary WHERE id = 1").fetchone()
        if s["in_account"] >= e.amount:
            c.execute("UPDATE summary SET in_account = in_account - ? WHERE id = 1", (e.amount,))
        else:
            c.execute("UPDATE summary SET in_hand = in_hand - ?, in_account = 0 WHERE id = 1",
                      (e.amount - s["in_account"],))
    return e.model_dump()


init()

# Serve the built frontend if it exists (prod). In dev, vite serves it and proxies /api here.
if DIST.exists():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="dist")
