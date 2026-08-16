import React, { useState } from 'react';
import { XIcon, MailIcon } from './icons.jsx';

export default function InviteModal({ open, onClose, onInvite, docTitle }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editing');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      await onInvite(email, role);
      setStatus(`Invite sent to ${email}`);
      setEmail('');
    } catch (err) {
      setStatus(err.message || 'Could not send invite');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-ink-900 dark:text-white">Share "{docTitle}"</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XIcon width={18} height={18} />
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-4">Invite someone by email to collaborate on this document in real time.</p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="relative">
            <MailIcon width={16} height={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="colleague@email.com"
              className="w-full border border-slate-200 dark:border-white/10 dark:bg-ink-800 dark:text-white rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div className="flex gap-2 text-sm">
            {['editing', 'viewing'].map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium capitalize ${
                  role === r ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 dark:border-white/10'
                }`}
              >
                Can {r === 'editing' ? 'edit' : 'view'}
              </button>
            ))}
          </div>
          {status && <div className="text-xs text-emerald-600">{status}</div>}
          <button
            disabled={busy}
            className="bg-gradient-to-r from-brand-500 to-brand-700 text-white text-sm font-semibold rounded-lg py-2.5 shadow-panel disabled:opacity-60"
          >
            {busy ? 'Sending…' : 'Send invite'}
          </button>
        </form>
      </div>
    </div>
  );
}
