import { CATS } from './lib.js';

export const Ms = ({ children, size, style }) => (
  <span className="ms" style={{ fontSize: size, ...style }}>{children}</span>
);

export const ADMIN_NAV = [
  { id: 'dashboard', icon: 'grid_view', label: 'Dashboard' },
  { id: 'payments',  icon: 'account_balance_wallet', label: 'Payments' },
  { id: 'expenses',  icon: 'receipt_long', label: 'Expenses' },
  { id: 'analysis',  icon: 'monitoring', label: 'Analysis' },
];
export const PUBLIC_NAV = [
  { id: 'dashboard', icon: 'grid_view', label: 'Dashboard' },
  { id: 'track',     icon: 'receipt_long', label: 'Track' },
];

export const NavBar = ({ items, active, onNav }) => (
  <div className="nav">
    {items.map(i => (
      <button key={i.id} className={'ni' + (i.id === active ? ' on' : '')} onClick={() => onNav(i.id)}>
        <Ms>{i.icon}</Ms>{i.label}
      </button>
    ))}
  </div>
);

export function Donut({ size, pct }) {
  let acc = 0;
  const stops = [];
  for (const [name, p] of pct) { stops.push(`${CATS[name].color} ${acc}% ${acc + p}%`); acc += p; }
  stops.push(`#dfe3ea ${acc}% 100%`);
  const hole = size - 44;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flex: 'none',
      background: `conic-gradient(${stops.join(',')})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: hole, height: hole, borderRadius: '50%', background: '#fff' }} />
    </div>
  );
}

export const Legend = ({ pct }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
    {pct.map(([name, p]) => (
      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span className="dot" style={{ background: CATS[name].color }} />{name}
        <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{p}%</span>
      </div>
    ))}
  </div>
);
