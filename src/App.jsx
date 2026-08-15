import React, { useEffect, useState } from "react";
import Editor from "./Editor.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function App() {
  const [docs, setDocs] = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");

  const loadDocs = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/api/documents`);
    const data = await res.json();
    setDocs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const createDoc = async (e) => {
    e.preventDefault();
    const name = newName.trim() || "Untitled Document";
    const res = await fetch(`${API_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const doc = await res.json();
    setNewName("");
    await loadDocs();
    setActiveDocId(doc.docId);
  };

  if (activeDocId) {
    return <Editor docId={activeDocId} onBack={() => setActiveDocId(null)} />;
  }

  return (
    <div className="shell">
      <header className="shell-header">
        <div className="logo">
          <span className="logo-mark">◆</span> SyncDoc
        </div>
        <span className="tagline">Collaborative documents with CRDT conflict resolution</span>
      </header>

      <main className="doc-list-wrap">
        <form className="new-doc-form" onSubmit={createDoc}>
          <input
            type="text"
            placeholder="New document name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit">+ New document</button>
        </form>

        {loading ? (
          <p className="muted">Loading documents…</p>
        ) : docs.length === 0 ? (
          <p className="muted">No documents yet. Create one above to get started.</p>
        ) : (
          <ul className="doc-list">
            {docs.map((d) => (
              <li key={d.docId} className="doc-list-item" onClick={() => setActiveDocId(d.docId)}>
                <div className="doc-list-name">{d.name}</div>
                <div className="doc-list-meta">
                  {d.docId} · updated {new Date(d.updatedAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
