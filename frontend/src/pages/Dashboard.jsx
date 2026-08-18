import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import { DocIcon, StarIcon, PlusIcon } from '../components/icons.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const SCOPE_TITLES = {
  all: 'All Documents',
  shared: 'Shared with me',
  starred: 'Starred',
  trash: 'Trash',
};

export default function Dashboard() {
  const { token } = useAuth();
  const [params] = useSearchParams();
  const scope = params.get('scope') || '';
  const [docs, setDocs] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    setLoading(true);
    api.listDocuments(token, scope).then((r) => setDocs(r.documents)).finally(() => setLoading(false));
    api.listDocuments(token, '').then((r) => setRecent(r.documents));
  }, [token, scope]);

  async function newDocument() {
    const res = await api.createDocument(token, 'Untitled Document');
    navigate(`/editor/${res.document.id}`);
  }

  async function toggleStar(doc) {
    await api.updateDocument(token, doc.id, { starred: !doc.starred });
    setDocs((d) => d.map((x) => (x.id === doc.id ? { ...x, starred: !x.starred } : x)));
  }

  return (
    <div className="flex bg-slate-50 dark:bg-ink-800 min-h-screen">
      <Sidebar activeNav={scope || 'dashboard'} recentDocs={recent} onNewDocument={newDocument} dark={dark} onToggleDark={() => setDark((d) => !d)} />

      <main className="flex-1 px-10 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-ink-900 dark:text-white">{SCOPE_TITLES[scope] || 'Your Documents'}</h1>
            <p className="text-slate-400 text-sm mt-1">Pick up where you left off, or start something new.</p>
          </div>
          <button
            onClick={newDocument}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white text-sm font-semibold px-4 py-2.5 shadow-panel hover:opacity-95"
          >
            <PlusIcon width={16} height={16} /> New Document
          </button>
        </div>

        {loading ? (
          <div className="text-slate-400 text-sm">Loading documents…</div>
        ) : docs.length === 0 ? (
          <div className="border border-dashed border-slate-200 dark:border-white/10 rounded-2xl py-20 flex flex-col items-center text-center">
            <DocIcon width={32} height={32} className="text-slate-300 mb-3" />
            <div className="font-semibold text-ink-900 dark:text-white">Nothing here yet</div>
            <div className="text-slate-400 text-sm mt-1">Create a document to start collaborating in real time.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => navigate(`/editor/${doc.id}`)}
                className="cursor-pointer bg-white dark:bg-ink-900 border border-slate-100 dark:border-white/5 rounded-2xl p-5 shadow-panel hover:shadow-md transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-700/20 flex items-center justify-center text-brand-600">
                    <DocIcon width={17} height={17} />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(doc);
                    }}
                    className={doc.starred ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}
                  >
                    <StarIcon width={17} height={17} fill={doc.starred ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="font-semibold text-ink-900 dark:text-white mt-3 truncate">{doc.title}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {doc.isOwner ? 'Owned by you' : `Shared by ${doc.owner?.name || 'a collaborator'}`} · {new Date(doc.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
