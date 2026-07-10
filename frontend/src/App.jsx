import { useEffect, useState, useCallback } from 'react';
import { StatusBar } from './components.jsx';
import { api } from './api.js';
import {
  PinScreen, AdminDashboard, AdminPayments, AdminExpenses, AdminAnalysis,
  PaymentSheet, ExpenseSheet,
} from './screens/Admin.jsx';
import { PublicDashboard, PublicTrack, ProofViewer } from './screens/Public.jsx';

const isAdminRoute = () =>
  location.pathname.replace(/\/$/, '').endsWith('/admin') || location.hash.includes('admin');

export default function App() {
  const [admin, setAdmin] = useState(isAdminRoute());
  const [authed, setAuthed] = useState(false);
  const [screen, setScreen] = useState('dashboard');
  const [sheet, setSheet] = useState(null);     // 'payment' | 'expense' | null
  const [proof, setProof] = useState(null);     // expense | null
  const [data, setData] = useState(null);

  const reload = useCallback(async () => {
    const [summary, payments, expenses, budgets] = await Promise.all([
      api.summary(), api.payments(), api.expenses(), api.budgets(),
    ]);
    setData({ summary, payments, expenses, budgets });
  }, []);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    const onHash = () => { setAdmin(isAdminRoute()); setAuthed(false); setScreen('dashboard'); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const nav = (s) => { setScreen(s); setSheet(null); };

  async function addPayment(p) {
    await api.addPayment(p); await reload();
    setSheet(null); setScreen('payments');
  }
  async function addExpense(e) {
    await api.addExpense(e); await reload();
    setSheet(null); setScreen('expenses');
  }

  const dark = !!proof;
  let content;

  if (!data) {
    content = <div className="bd" />;
  } else if (admin && !authed) {
    content = <PinScreen onSubmit={async (pin) => {
      const ok = await api.verifyPin(pin);
      if (ok) setAuthed(true);
      return ok;
    }} />;
  } else if (proof) {
    content = <ProofViewer expense={proof} onClose={() => setProof(null)} />;
  } else if (sheet === 'payment') {
    content = <PaymentSheet onClose={() => setSheet(null)} onAdd={addPayment} />;
  } else if (sheet === 'expense') {
    content = <ExpenseSheet onClose={() => setSheet(null)} onAdd={addExpense} />;
  } else if (admin) {
    content =
      screen === 'payments' ? <AdminPayments payments={data.payments} contributors={data.summary.contributors} onNav={nav} onOpenSheet={setSheet} />
    : screen === 'expenses' ? <AdminExpenses budgets={data.budgets} expenses={data.expenses} onNav={nav} onOpenSheet={setSheet} />
    : screen === 'analysis' ? <AdminAnalysis summary={data.summary} budgets={data.budgets} onNav={nav} />
    : <AdminDashboard summary={data.summary} onNav={nav} onLogout={() => setAuthed(false)} />;
  } else {
    content =
      screen === 'track' ? <PublicTrack expenses={data.expenses} onNav={nav} onProof={setProof} />
    : <PublicDashboard summary={data.summary} onNav={nav} />;
  }

  return (
    <div className="fr" style={dark ? { background: '#0c1017' } : undefined}>
      <StatusBar dark={dark} />
      {content}
    </div>
  );
}
