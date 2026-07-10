// Data layer — talks to the FastAPI backend. Dev: vite proxies /api → :8000.

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const get = (path) => fetch(API_BASE + '/api' + path).then(r => r.json());
const post = (path, body) =>
  fetch(API_BASE + '/api' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json());


export const api = {
  summary:  () => get('/summary'),
  payments: () => get('/payments'),
  expenses: () => get('/expenses'),
  budgets:  () => get('/budgets'),
  verifyPin: (pin) => post('/verify-pin', { pin }),
  addPayment: (p) => post('/payments', p),
  addExpense: (e) => post('/expenses', e),
};
