import React from 'react';
import Avatar from './Avatar.jsx';
import { PlusIcon, DocIcon } from './icons.jsx';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CollaboratorsPanel({ collaborators, presence, history, onInviteClick }) {
  const typingUsers = presence.filter((p) => p.typing);

  return (
    <aside className="w-[280px] shrink-0 border-l border-slate-100 dark:border-white/5 px-4 py-5 flex flex-col gap-6 overflow-y-auto">
      {/* Collaborators */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[13.5px] text-ink-900 dark:text-white">Collaborators</h3>
          <button onClick={onInviteClick} className="flex items-center gap-1 text-brand-600 text-xs font-semibold hover:underline">
            <PlusIcon width={13} height={13} /> Invite
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {collaborators.map((c) => (
            <div key={c.id || c.email} className="flex items-center gap-2.5">
              <Avatar name={c.name || c.email} color={c.avatarColor} size={30} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-ink-900 dark:text-white truncate">{c.name || c.email}</div>
              </div>
              <span className="text-[11px] text-slate-400 capitalize">{c.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Activity */}
      <div className="bg-slate-50 dark:bg-white/5 rounded-xl px-3.5 py-3">
        <h3 className="font-bold text-[13.5px] text-ink-900 dark:text-white mb-1">Live Activity</h3>
        <div className="flex items-center gap-1.5 text-[12.5px] text-emerald-600 font-medium">
          <span>←</span> {presence.length > 0 ? 'Everyone is active' : 'No one else is here'}
        </div>
      </div>

      {/* Typing Now */}
      <div className="bg-slate-50 dark:bg-white/5 rounded-xl px-3.5 py-3">
        <h3 className="font-bold text-[13.5px] text-ink-900 dark:text-white mb-2">Typing Now</h3>
        {typingUsers.length === 0 ? (
          <div className="text-[12.5px] text-slate-400">No one is typing</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {typingUsers.map((u) => (
              <div key={u.socketId} className="flex items-center gap-2 text-[12.5px] text-ink-900 dark:text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> {u.name} is typing…
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document History */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-[13.5px] text-ink-900 dark:text-white">Document History</h3>
          <button className="text-brand-600 text-xs font-semibold hover:underline">View all</button>
        </div>
        <div className="flex flex-col gap-3">
          {history.length === 0 && <div className="text-[12.5px] text-slate-400">No edits yet</div>}
          {history.slice(0, 6).map((h, idx) => (
            <div key={idx} className="flex gap-2.5 text-[12.5px]">
              <DocIcon width={14} height={14} className="text-slate-300 mt-0.5 shrink-0" />
              <div>
                <div className="text-slate-400">{timeAgo(h.editedAt)}</div>
                <div className="text-ink-900 dark:text-white">Edited by {h.editedByName}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
