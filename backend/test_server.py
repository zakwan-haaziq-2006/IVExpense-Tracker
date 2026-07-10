"""Smallest check that the mutation logic stays faithful. Run: python test_server.py"""
import os
import tempfile
from pathlib import Path

# isolated temp DB before importing server
os.environ["IV_PIN"] = "1234"
_tmp = Path(tempfile.mkdtemp()) / "test.db"
import server
server.DB = _tmp
server.init()

s0 = server.summary()
assert s0["received"] == 0 and server.payments() == [] and server.expenses() == []
assert server.verify_pin(server.Pin(pin="1234")) is True
assert server.verify_pin(server.Pin(pin="0000")) is False

# cash payment -> received, contributors, inHand all bump; lands at top
server.add_payment(server.Payment(name="Test User", amount=1000, mode="Cash", date="1 Jul"))
s1 = server.summary()
assert s1["received"] == 1000
assert s1["contributors"] == 1
assert s1["inHand"] == 1000
assert server.payments()[0]["name"] == "Test User"

# expense drains account first (0 here) then hand; spent bumps; newest on top
server.add_expense(server.Expense(id=99, reason="Snack", amount=500, category="Food", date="1 Jul"))
s2 = server.summary()
assert s2["spent"] == 500
assert s2["inAccount"] == 0
assert s2["inHand"] == 500  # 1000 hand - 500, account was empty
assert server.expenses()[0]["id"] == 99

print("ok")
