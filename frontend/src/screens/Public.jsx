import { Ms, NavBar, Donut, Legend, PUBLIC_NAV } from '../components.jsx';
import { CATS, rupee } from '../lib.js';

// ---- b1 Public dashboard ----
export function PublicDashboard({ summary: s, onNav }) {
  const remaining = s.received - s.spent;
  const share = Math.round(s.spent / s.contributors);
  const pct3 = s.categoryPct.slice(0, 3);
  return (<>
    <div className="bd">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <div><div className="ov">Industrial Visit 2026</div><div className="ti" style={{ marginTop: 2 }}>Trip expenses</div></div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#667085', background: '#f6f7f9', padding: '6px 10px', borderRadius: 20 }}>
          <Ms size={14}>visibility</Ms>View only
        </span>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="c" style={{ flex: 1, padding: 15 }}><div className="ov" style={{ color: '#98a2b3' }}>Spent so far</div><div className="n" style={{ fontSize: 21, marginTop: 8 }}>{rupee(s.spent)}</div></div>
        <div className="c" style={{ flex: 1, padding: 15 }}><div className="ov" style={{ color: '#98a2b3' }}>Remaining</div><div className="n" style={{ fontSize: 21, marginTop: 8 }}>{rupee(remaining)}</div></div>
      </div>
      <div style={{ background: 'linear-gradient(150deg,#2f6fed,#1b45c4)', borderRadius: 22, padding: '16px 18px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 16px 30px -18px rgba(37,99,235,.7)' }}>
        <div><div className="ov" style={{ color: 'rgba(255,255,255,.72)' }}>Your share</div><div style={{ fontSize: 12, opacity: .82, marginTop: 2 }}>spent ÷ {s.contributors} people</div></div>
        <div className="n" style={{ fontSize: 26 }}>{rupee(share)}</div>
      </div>
      <div className="c">
        <div className="ov" style={{ marginBottom: 12 }}>By category</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><Donut size={96} pct={pct3} /><Legend pct={pct3} /></div>
      </div>
    </div>
    <NavBar items={PUBLIC_NAV} active="dashboard" onNav={onNav} />
  </>);
}

// ---- b2 Track (read-only) ----
export function PublicTrack({ expenses, onNav, onProof }) {
  return (<>
    <div className="bd">
      <div style={{ marginTop: 2 }}><div className="ov">{expenses.length} entries · tap for proof</div><div className="ti" style={{ marginTop: 2 }}>Track expenses</div></div>
      <div className="c" style={{ padding: '4px 14px' }}>
        {expenses.map(e => (
          <div key={e.id} className={'row' + (e.proof ? ' tap' : '')} onClick={e.proof ? () => onProof(e) : undefined}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{e.reason}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span className="dot" style={{ background: CATS[e.category].color }} />
                <span style={{ fontSize: 12, color: '#667085' }}>{e.category} · {e.date}{e.time ? ' · ' + e.time : ''}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {e.proof && <Ms size={17} style={{ color: '#2563eb' }}>attachment</Ms>}
              <div className="n" style={{ fontSize: 15 }}>{rupee(e.amount)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <NavBar items={PUBLIC_NAV} active="track" onNav={onNav} />
  </>);
}

// ---- b3 Proof lightbox ----
export function ProofViewer({ expense: e, onClose }) {
  return (
    <div className="bd" style={{ alignItems: 'center', justifyContent: 'center', gap: 18, padding: 18 }}>
      <button onClick={onClose} style={{ alignSelf: 'flex-end', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ms size={20}>close</Ms></button>
      <div style={{ width: '100%', height: 344, borderRadius: 16, background: '#eef0f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b0b7c3' }}><Ms size={56}>receipt_long</Ms></div>
      <div style={{ textAlign: 'center', color: '#e4e7ec' }}>
        <div style={{ fontWeight: 600 }}>{e.reason}</div>
        <div style={{ fontSize: 12, color: '#98a2b3', marginTop: 3 }}>{e.category} · {rupee(e.amount)} · {e.date}{e.time ? ', ' + e.time : ''}</div>
      </div>
    </div>
  );
}
