import { useState } from 'react';
import { Ms, NavBar, Donut, Legend, ADMIN_NAV } from '../components.jsx';
import { CATS, MODES, AV_COLORS, rupee, initials, fmtDate, fmtTime } from '../lib.js';

const gradientHero = {
  background: 'linear-gradient(150deg,#2f6fed,#1b45c4)', color: '#fff',
};

// ---- a1 PIN gate ----
export function PinScreen({ onSubmit }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  async function push(k) {
    setError(false);
    if (k === 'back') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      const ok = await onSubmit(next);
      if (!ok) { setError(true); setPin(''); }
    }
  }

  const keys = ['1','2','3','4','5','6','7','8','9','','0','back'];
  return (
    <div className="bd" style={{ alignItems: 'center', textAlign: 'center', justifyContent: 'center', gap: 0 }}>
      <div style={{ width: 56, height: 56, borderRadius: 18, background: '#eff4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Ms size={28} style={{ color: '#2563eb' }}>lock</Ms>
      </div>
      <div className="ti" style={{ marginTop: 22 }}>Admin access</div>
      <div style={{ color: '#667085', fontSize: 14, marginTop: 6 }}>Enter your 4-digit PIN</div>
      <div style={{ display: 'flex', gap: 16, margin: '28px 0 14px' }}>
        {[0,1,2,3].map(i => (
          <span key={i} style={{ width: 13, height: 13, borderRadius: '50%', background: i < pin.length ? '#2563eb' : '#e4e7ec' }} />
        ))}
      </div>
      <div style={{ color: '#f04438', fontSize: 13, fontWeight: 500, height: 16 }}>{error ? 'Incorrect PIN. Try again.' : ''}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,56px)', gap: 12, marginTop: 22 }}>
        {keys.map((k, i) => k === '' ? <div key={i} />
          : k === 'back'
            ? <button key={i} className="pin-key" style={{ background: 'none', color: '#98a2b3' }} onClick={() => push('back')}><Ms>backspace</Ms></button>
            : <button key={i} className="pin-key" onClick={() => push(k)}>{k}</button>)}
      </div>
    </div>
  );
}

// ---- a2 Dashboard ----
export function AdminDashboard({ summary: s, onNav, onLogout }) {
  const remaining = s.received - s.spent;
  const wallet = (icon, label, val) => (
    <div style={{ flex: 1, background: 'rgba(255,255,255,.14)', borderRadius: 14, padding: '10px 12px' }}>
      <div style={{ fontSize: 11, opacity: .8, display: 'flex', alignItems: 'center', gap: 5 }}><Ms size={14}>{icon}</Ms>{label}</div>
      <div className="n" style={{ fontSize: 17, marginTop: 3 }}>{rupee(val)}</div>
    </div>
  );
  const stat = (color, icon, label, val) => (
    <div className="c" style={{ flex: 1, padding: 15 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color }}><Ms size={16}>{icon}</Ms><span className="ov" style={{ color: '#98a2b3' }}>{label}</span></div>
      <div className="n" style={{ fontSize: 22, marginTop: 8 }}>{rupee(val)}</div>
    </div>
  );
  return (<>
    <div className="bd">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <div><div className="ov">Industrial Visit 2026</div><div className="ti" style={{ marginTop: 2 }}>Overview</div></div>
        <button onClick={onLogout} style={{ width: 38, height: 38, borderRadius: 12, background: '#f6f7f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#667085' }}><Ms size={21}>logout</Ms></button>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {stat('#12b76a', 'south_west', 'Received', s.received)}
        {stat('#f04438', 'north_east', 'Spent', s.spent)}
      </div>
      <div style={{ ...gradientHero, borderRadius: 24, padding: '18px 18px 16px', boxShadow: '0 18px 34px -18px rgba(37,99,235,.75)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="ov" style={{ color: 'rgba(255,255,255,.72)' }}>Amount Remaining</span><Ms size={22} style={{ opacity: .85 }}>expand_more</Ms></div>
        <div className="n" style={{ fontSize: 33, marginTop: 4 }}>{rupee(remaining)}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          {wallet('payments', 'In Hand', s.inHand)}
          {wallet('account_balance', 'In Account', s.inAccount)}
        </div>
      </div>
      <div className="c" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 13, background: '#eff4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}><Ms size={22}>groups</Ms></div>
          <div><div className="ov" style={{ color: '#98a2b3' }}>Contributors</div><div style={{ fontSize: 13, color: '#667085', marginTop: 1 }}>paid so far</div></div>
        </div>
        <div className="n" style={{ fontSize: 30, color: '#2563eb' }}>{s.contributors}</div>
      </div>
    </div>
    <NavBar items={ADMIN_NAV} active="dashboard" onNav={onNav} />
  </>);
}

// ---- a3 Payments ----
export function AdminPayments({ payments, contributors, onNav, onOpenSheet }) {
  return (<>
    <div className="bd">
      <div style={{ marginTop: 2 }}><div className="ov">{contributors} contributors</div><div className="ti" style={{ marginTop: 2 }}>Payments</div></div>
      <div className="c" style={{ padding: '4px 14px' }}>
        {payments.map((p, i) => {
          const [bg, fg] = AV_COLORS[i % AV_COLORS.length];
          return (
            <div className="row" key={i}>
              <div className="av" style={{ background: bg, color: fg }}>{initials(p.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span className="dot" style={{ background: fg }} />
                  <span style={{ fontSize: 12, color: '#667085' }}>{p.mode === 'Bank Transfer' ? 'Bank' : p.mode} · {p.date}</span>
                </div>
              </div>
              <div className="n" style={{ fontSize: 15 }}>{rupee(p.amount)}</div>
            </div>
          );
        })}
      </div>
    </div>
    <button className="fab" onClick={() => onOpenSheet('payment')}><Ms>add</Ms></button>
    <NavBar items={ADMIN_NAV} active="payments" onNav={onNav} />
  </>);
}

const ExpenseCard = ({ e }) => (
  <div className="c" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
    <div className="thumb"><Ms size={20}>description</Ms></div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{e.reason}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
        <span className="dot" style={{ background: CATS[e.category].color }} />
        <span style={{ fontSize: 12, color: '#667085' }}>{e.category} · {e.date}{e.time ? ' · ' + e.time : ''}</span>
      </div>
    </div>
    <div className="n" style={{ fontSize: 15 }}>{rupee(e.amount)}</div>
  </div>
);

// ---- a5 Expenses ----
export function AdminExpenses({ budgets, expenses, onNav, onOpenSheet }) {
  return (<>
    <div className="bd" style={{ gap: 12 }}>
      <div style={{ marginTop: 2 }}><div className="ov">Budgets &amp; log</div><div className="ti" style={{ marginTop: 2 }}>Expenses</div></div>
      <div className="c" style={{ padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {budgets.map(b => {
            const pct = Math.min(100, Math.round(b.spent / b.target * 100));
            const over = b.spent > b.target;
            const color = over ? '#f04438' : pct >= 90 ? '#f79009' : '#2563eb';
            return (
              <div key={b.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{b.name}</span>
                  <span style={{ fontSize: 12, color: over ? '#f04438' : '#667085', fontWeight: over ? 600 : 400 }}>
                    {rupee(b.spent)} / {b.target.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="trk"><div className="fill" style={{ width: pct + '%', background: color }} /></div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="ov" style={{ marginTop: 2 }}>Recent</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {expenses.slice(0, 2).map(e => <ExpenseCard key={e.id} e={e} />)}
      </div>
    </div>
    <button className="fab" onClick={() => onOpenSheet('expense')}><Ms>add</Ms></button>
    <NavBar items={ADMIN_NAV} active="expenses" onNav={onNav} />
  </>);
}

// ---- a7 Analysis ----
export function AdminAnalysis({ summary: s, budgets, onNav }) {
  const over = budgets.filter(b => b.spent > b.target);
  const bars = [22, 40, 100, 66, 46, 82];
  const barColors = ['#dbe4fb', '#b9caf6', '#2563eb', '#7ea0e8', '#b9caf6', '#4f7ee4'];
  const days = ['20', '21', '24', '25', '26', '27 Jun'];
  return (<>
    <div className="bd" style={{ gap: 12 }}>
      <div style={{ marginTop: 2 }}><div className="ov">Total spent {rupee(s.spent)}</div><div className="ti" style={{ marginTop: 2 }}>Analysis</div></div>
      <div className="c">
        <div className="ov" style={{ marginBottom: 12 }}>By category</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><Donut size={104} pct={s.categoryPct} /><Legend pct={s.categoryPct} /></div>
      </div>
      <div className="c">
        <div className="ov" style={{ marginBottom: 12 }}>Spend over time</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9, height: 70 }}>
          {bars.map((h, i) => <div key={i} style={{ flex: 1, height: h + '%', background: barColors[i], borderRadius: '5px 5px 0 0' }} />)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#98a2b3', marginTop: 8 }}>
          {days.map(d => <span key={d}>{d}</span>)}
        </div>
      </div>
      {over.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fef3f2', borderRadius: 16, padding: '12px 14px' }}>
          <Ms size={20} style={{ color: '#f04438' }}>warning</Ms>
          <div style={{ fontSize: 13, color: '#b42318' }}><b>{over[0].name}</b> is over target by {rupee(over[0].spent - over[0].target)}</div>
        </div>
      )}
    </div>
    <NavBar items={ADMIN_NAV} active="analysis" onNav={onNav} />
  </>);
}

// ---- a4 Add payment sheet ----
export function PaymentSheet({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [mode, setMode] = useState('UPI');

  function submit() {
    const amt = parseFloat(amount);
    if (!name.trim() || !amt) return;               // trust boundary: require name + amount
    onAdd({ name: name.trim(), amount: amt, mode, date: fmtDate(date) });
  }
  return (
    <div className="bd sheet-bd" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="grabber" />
        <div className="ti" style={{ fontSize: 19 }}>New payment</div>
        <div className="field"><label className="ov">Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Contributor name" /></div>
        <div className="field"><label className="ov">Amount paid</label><input type="number" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} placeholder="₹ 0" /></div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}><label className="ov">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {MODES.map(m => <button key={m} className={'chip' + (m === mode ? ' on' : '')} onClick={() => setMode(m)}>{m}</button>)}
        </div>
        <button className="btn" onClick={submit}>Add payment</button>
      </div>
    </div>
  );
}

// ---- a6 Add expense sheet ----
export function ExpenseSheet({ onClose, onAdd }) {
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [proofName, setProofName] = useState('');

  function submit() {
    const amt = parseFloat(amount);
    if (!reason.trim() || !amt) return;
    onAdd({ id: Date.now(), reason: reason.trim(), amount: amt, category, date: fmtDate(date), time: fmtTime(time), proof: !!proofName });
  }
  return (
    <div className="bd sheet-bd" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="grabber" />
        <div className="ti" style={{ fontSize: 19 }}>New expense</div>
        <div className="field"><label className="ov">Reason</label><input value={reason} onChange={e => setReason(e.target.value)} placeholder="What was it for?" /></div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}><label className="ov">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>{Object.keys(CATS).map(c => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="field" style={{ flex: 1 }}><label className="ov">Amount</label><input type="number" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} placeholder="₹ 0" /></div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}><label className="ov">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div className="field" style={{ flex: 1 }}><label className="ov">Time</label><input type="time" value={time} onChange={e => setTime(e.target.value)} /></div>
        </div>
        <div className="field"><label className="ov">Proof</label>
          <label className="tap" style={{ height: 64, border: '1.5px dashed #cdd3dd', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#98a2b3', fontSize: 13, fontWeight: 500, background: '#fafbfc' }}>
            <Ms size={20}>add_a_photo</Ms>{proofName || 'Attach image / file'}
            <input type="file" accept="image/*" className="hidden" onChange={e => setProofName(e.target.files[0]?.name || '')} />
          </label>
        </div>
        <button className="btn" onClick={submit}>Add expense</button>
      </div>
    </div>
  );
}
