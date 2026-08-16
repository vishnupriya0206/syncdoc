import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, DocIcon, ShareIcon, StarIcon, TrashIcon, FolderIcon, PlusIcon, MoonIcon, SunIcon } from './icons.jsx';
import Avatar from './Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: HomeIcon, path: '/' },
  { key: 'all', label: 'All Documents', icon: DocIcon, path: '/?scope=all' },
  { key: 'shared', label: 'Shared with me', icon: ShareIcon, path: '/?scope=shared' },
  { key: 'starred', label: 'Starred', icon: StarIcon, path: '/?scope=starred' },
  { key: 'trash', label: 'Trash', icon: TrashIcon, path: '/?scope=trash' },
];

const FOLDERS = ['College', 'Work', 'Personal', 'Ideas'];

export default function Sidebar({ activeNav = 'dashboard', recentDocs = [], activeDocId, onNewDocument, dark, onToggleDark }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <aside className="w-[260px] shrink-0 h-screen sticky top-0 flex flex-col bg-white dark:bg-ink-900 border-r border-slate-100 dark:border-white/5">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white">
          <DocIcon width={18} height={18} stroke="white" />
        </div>
        <div>
          <div className="font-extrabold text-[17px] leading-tight text-ink-900 dark:text-white">SyncDoc</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">Collaborate in real time</div>
        </div>
      </div>

      {/* New document */}
      <div className="px-4 mb-4">
        <button
          onClick={onNewDocument}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white text-sm font-semibold py-2.5 shadow-panel hover:opacity-95 transition"
        >
          <PlusIcon width={16} height={16} /> New Document
        </button>
      </div>

      {/* Nav */}
      <nav className="px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = activeNav === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium transition text-left ${
                active
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-700/20 dark:text-brand-100'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              <Icon width={17} height={17} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Recent documents */}
      <div className="px-4 mt-6">
        <div className="text-[10.5px] font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">RECENT DOCUMENTS</div>
        <div className="flex flex-col">
          {recentDocs.slice(0, 6).map((doc) => (
            <button
              key={doc.id}
              onClick={() => navigate(`/editor/${doc.id}`)}
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[13px] truncate text-left ${
                activeDocId === doc.id
                  ? 'bg-brand-50 text-brand-700 font-semibold dark:bg-brand-700/20 dark:text-brand-100'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              <DocIcon width={15} height={15} className="shrink-0" />
              <span className="truncate">{doc.title}</span>
            </button>
          ))}
          {recentDocs.length === 0 && <div className="text-[12px] text-slate-400 px-2 py-1">No documents yet</div>}
        </div>
        <button onClick={() => navigate('/?scope=all')} className="text-[12px] text-brand-600 font-medium mt-1 px-2 hover:underline">
          View all
        </button>
      </div>

      {/* Folders */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[10.5px] font-bold tracking-wider text-slate-400 dark:text-slate-500">FOLDERS</div>
          <PlusIcon width={14} height={14} className="text-slate-400" />
        </div>
        <div className="flex flex-col">
          {FOLDERS.map((f) => (
            <div key={f} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
              <FolderIcon width={15} height={15} />
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* User + dark mode */}
      <div className="px-4 pb-5 pt-3 border-t border-slate-100 dark:border-white/5 mt-3">
        <div className="flex items-center gap-2.5 py-2 cursor-pointer group" onClick={logout} title="Click to sign out">
          <Avatar name={user?.name || '?'} color={user?.avatarColor} size={34} />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-ink-900 dark:text-white truncate">{user?.name}</div>
            <div className="text-[11.5px] text-slate-400 truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={onToggleDark}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 mt-1"
        >
          {dark ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  );
}
