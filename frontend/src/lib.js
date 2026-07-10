// constants + formatters shared across screens

export const CATS = {
  Food:          { color: '#14b8a6' },
  Transport:     { color: '#2563eb' },
  Accommodation: { color: '#7b6cf0' },
  'Entry Fees':  { color: '#f79009' },
  Misc:          { color: '#94a3b8' },
};
export const MODES = ['UPI', 'Cash', 'Bank Transfer'];
export const AV_COLORS = [['#eef2ff', '#4f6bed'], ['#e9f7ef', '#12b76a'], ['#f3effc', '#7b52d6']];

export const rupee = n => '₹' + Math.round(n).toLocaleString('en-IN');
export const initials = name => name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function fmtDate(iso) {
  const d = iso ? new Date(iso + 'T00:00:00') : new Date();
  return d.getDate() + ' ' + MON[d.getMonth()];
}
export function fmtTime(hm) {
  if (!hm) return '';
  let [h, m] = hm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}
