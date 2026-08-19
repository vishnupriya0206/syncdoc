import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { DocIcon, MailIcon } from '../components/icons.jsx';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = mode === 'login' ? await api.login(email, password) : await api.register(name, email, password);
      login(res.token, res.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white mb-3 shadow-panel">
            <DocIcon width={22} height={22} stroke="white" />
          </div>
          <div className="font-extrabold text-xl text-ink-900">SyncDoc</div>
          <div className="text-slate-500 text-sm">Collaborate in real time</div>
        </div>

        <div className="bg-white rounded-2xl shadow-panel border border-slate-100 p-6">
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6 text-sm font-medium">
            <button
              className={`flex-1 py-1.5 rounded-md transition ${mode === 'login' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500'}`}
              onClick={() => setMode('login')}
            >
              Sign in
            </button>
            <button
              className={`flex-1 py-1.5 rounded-md transition ${mode === 'register' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500'}`}
              onClick={() => setMode('register')}
            >
              Create account
            </button>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            {mode === 'register' && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
                className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
              />
            )}
            <div className="relative">
              <MailIcon width={16} height={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                type="email"
                required
                className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              required
              minLength={6}
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
            />
            {error && <div className="text-xs text-red-500">{error}</div>}
            <button
              disabled={busy}
              className="mt-1 bg-gradient-to-r from-brand-500 to-brand-700 text-white text-sm font-semibold rounded-lg py-2.5 shadow-panel hover:opacity-95 transition disabled:opacity-60"
            >
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          Collaborators are invited straight to their email — no separate signup needed for them to view an invite link.
        </p>
      </div>
    </div>
  );
}
