import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import { QuillBinding } from 'y-quill';
import * as Y from 'yjs';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';
import 'quill/dist/quill.core.css';
import 'quill-cursors/css';

import Sidebar from '../components/Sidebar.jsx';
import Toolbar from '../components/Toolbar.jsx';
import CollaboratorsPanel from '../components/CollaboratorsPanel.jsx';
import InviteModal from '../components/InviteModal.jsx';
import Avatar from '../components/Avatar.jsx';
import { StarIcon, ShareIcon, CheckIcon } from '../components/icons.jsx';
import { api } from '../lib/api.js';
import { createCollabSocket } from '../lib/socket.js';
import { useAuth } from '../context/AuthContext.jsx';

Quill.register('modules/cursors', QuillCursors);
const Font = Quill.import('formats/font');
Font.whitelist = ['inter', 'serif', 'monospace'];
Quill.register(Font, true);
const Size = Quill.import('attributors/style/size');
Size.whitelist = ['12px', '14px', '16px', '18px', '24px', '32px'];
Quill.register(Size, true);

function b64ToUint8(b64) {
  return new Uint8Array(atob(b64).split('').map((c) => c.charCodeAt(0)));
}
function uint8ToB64(arr) {
  let binary = '';
  arr.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export default function Editor() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const editorContainerRef = useRef(null);
  const quillRef = useRef(null);
  const ydocRef = useRef(null);
  const awarenessRef = useRef(null);
  const socketRef = useRef(null);
  const bindingRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const snapshotTimeoutRef = useRef(null);

  const [title, setTitle] = useState('Untitled Document');
  const [starred, setStarred] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [recent, setRecent] = useState([]);
  const [history, setHistory] = useState([]);
  const [presence, setPresence] = useState([]);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [saved, setSaved] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    api.listDocuments(token, '').then((r) => setRecent(r.documents));
  }, [token]);

  const emitSnapshot = useCallback(() => {
    const quill = quillRef.current;
    const socket = socketRef.current;
    if (!quill || !socket) return;
    const text = quill.getText();
    const words = text.trim().length ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(text.length > 0 ? text.length - 1 : 0);
    setSaved(false);
    clearTimeout(snapshotTimeoutRef.current);
    snapshotTimeoutRef.current = setTimeout(() => {
      socket.emit('content-snapshot', {
        documentId: id,
        html: quill.root.innerHTML,
        text,
        wordCount: words,
        charCount: text.length > 0 ? text.length - 1 : 0,
      });
      setSaved(true);
    }, 900);
  }, [id]);

  // ---- Setup: fetch doc meta, then wire Quill + Yjs + Socket.io ----
  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const { document: doc } = await api.getDocument(token, id);
      if (cancelled) return;
      setTitle(doc.title);
      setStarred(doc.starred);
      setCollaborators([
        { id: doc.owner._id, name: doc.owner.name, avatarColor: doc.owner.avatarColor, role: 'owner' },
        ...doc.collaborators.filter((c) => c.id && c.id !== doc.owner._id),
      ]);
      setHistory(doc.history || []);

      const ydoc = new Y.Doc();
      const awareness = new Awareness(ydoc);
      awareness.setLocalStateField('user', { name: user.name, color: user.avatarColor });
      ydocRef.current = ydoc;
      awarenessRef.current = awareness;

      const quill = new Quill(editorContainerRef.current, {
        theme: undefined,
        modules: { cursors: true, history: { userOnly: true } },
      });
      quillRef.current = quill;

      const socket = createCollabSocket();
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join-document', { documentId: id, token });
      });

      socket.on('sync-init', ({ state }) => {
        Y.applyUpdate(ydoc, b64ToUint8(state), 'remote-socket');
        const yText = ydoc.getText('quill');
        bindingRef.current = new QuillBinding(yText, quill, awareness);
        setReady(true);
      });

      socket.on('history-init', (h) => setHistory(h));
      socket.on('history-entry', (entry) => setHistory((prev) => [entry, ...prev].slice(0, 20)));
      socket.on('presence-update', (list) => setPresence(list));

      socket.on('yjs-update', ({ update }) => {
        Y.applyUpdate(ydoc, b64ToUint8(update), 'remote-socket');
      });

      socket.on('awareness-update', ({ update }) => {
        applyAwarenessUpdate(awareness, b64ToUint8(update), 'remote');
      });

      ydoc.on('update', (update, origin) => {
        if (origin === 'remote-socket') return;
        socket.emit('yjs-update', { documentId: id, update: uint8ToB64(update) });
        emitSnapshot();
      });

      awareness.on('update', ({ added, updated, removed }, origin) => {
        if (origin === 'remote') return;
        const changed = added.concat(updated, removed);
        const update = encodeAwarenessUpdate(awareness, changed);
        socket.emit('awareness-update', { documentId: id, update: uint8ToB64(update) });
      });

      quill.on('selection-change', (range) => {
        if (!range) return;
        clearTimeout(typingTimeoutRef.current);
        socket.emit('typing', { documentId: id, isTyping: true });
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('typing', { documentId: id, isTyping: false });
        }, 1200);
      });
    }

    setup();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      bindingRef.current?.destroy?.();
      quillRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  async function saveTitle() {
    await api.updateDocument(token, id, { title });
  }

  async function toggleStar() {
    const next = !starred;
    setStarred(next);
    await api.updateDocument(token, id, { starred: next });
  }

  async function invite(email, role) {
    await api.inviteCollaborator(token, id, email, role);
    const { document: doc } = await api.getDocument(token, id);
    setCollaborators([
      { id: doc.owner._id, name: doc.owner.name, avatarColor: doc.owner.avatarColor, role: 'owner' },
      ...doc.collaborators.filter((c) => c.id && c.id !== doc.owner._id),
    ]);
  }

  async function newDocument() {
    const res = await api.createDocument(token, 'Untitled Document');
    navigate(`/editor/${res.document.id}`);
  }

  const activePeople = presence; // includes self via server
  const visibleAvatars = activePeople.slice(0, 4);
  const overflow = activePeople.length - visibleAvatars.length;

  return (
    <div className="flex bg-slate-50 dark:bg-ink-800 min-h-screen">
      <Sidebar activeNav="dashboard" recentDocs={recent} activeDocId={id} onNewDocument={newDocument} dark={dark} onToggleDark={() => setDark((d) => !d)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-ink-900">
          <div className="flex items-center gap-2.5 min-w-0">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              className="text-lg font-extrabold text-ink-900 dark:text-white bg-transparent outline-none border-b border-transparent focus:border-brand-300 min-w-[80px]"
            />
            <button onClick={toggleStar} className={starred ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}>
              <StarIcon width={17} height={17} fill={starred ? 'currentColor' : 'none'} />
            </button>
            <span className="text-xs text-slate-400 hidden sm:inline">Last edited just now</span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center -space-x-2">
              {visibleAvatars.map((p) => (
                <Avatar key={p.socketId} name={p.name} color={p.avatarColor} size={30} ring />
              ))}
              {overflow > 0 && (
                <div className="w-[30px] h-[30px] rounded-full bg-slate-200 dark:bg-white/10 ring-2 ring-white dark:ring-ink-900 flex items-center justify-center text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  +{overflow}
                </div>
              )}
            </div>
            <span className="text-xs text-slate-400 hidden md:inline">{activePeople.length} people editing</span>
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-brand-700 text-white text-sm font-semibold px-3.5 py-2 shadow-panel hover:opacity-95"
            >
              <ShareIcon width={15} height={15} stroke="white" /> Share
            </button>
            <Avatar name={user?.name || '?'} color={user?.avatarColor} size={32} ring />
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <Toolbar quillRef={quillRef} />
            <div className="flex-1 overflow-y-auto px-10 py-8 bg-white dark:bg-ink-900">
              <div className="max-w-3xl mx-auto relative">
                {!ready && <div className="text-slate-400 text-sm">Loading document…</div>}
                <div ref={editorContainerRef} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-2.5 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-ink-900 text-xs text-slate-400">
              <div>
                Words: {wordCount} &nbsp;&nbsp; Characters: {charCount}
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  {saved ? (
                    <>
                      Saved <CheckIcon width={13} height={13} />
                    </>
                  ) : (
                    'Saving…'
                  )}
                </span>
                <span>All changes are synced</span>
              </div>
            </div>
          </div>

          <CollaboratorsPanel collaborators={collaborators} presence={presence} history={history} onInviteClick={() => setInviteOpen(true)} />
        </div>
      </div>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={invite} docTitle={title} />
    </div>
  );
}
