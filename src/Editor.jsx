import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import { SocketIOProvider, randomColor } from "./yjsProvider.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function makeBlockId() {
  return `blk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function Editor({ docId, onBack }) {
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const [blocks, setBlocks] = useState([]);
  const [status, setStatus] = useState("connecting");
  const [peers, setPeers] = useState({});
  const [focusedBlockId, setFocusedBlockId] = useState(null);

  const userName = useMemo(() => `Guest-${Math.floor(Math.random() * 900 + 100)}`, []);
  const userColor = useMemo(() => randomColor(), []);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new SocketIOProvider(docId, ydoc, { userName, userColor });
    ydocRef.current = ydoc;
    providerRef.current = provider;

    const yBlocks = ydoc.getArray("blocks");

    const syncBlocksToState = () => {
      setBlocks(
        yBlocks.toArray().map((m) => ({
          id: m.get("id"),
          type: m.get("type"),
          content: m.get("content") || "",
        }))
      );
    };

    yBlocks.observeDeep(syncBlocksToState);
    syncBlocksToState();

    provider.on("statusChange", setStatus);
    provider.on("awarenessChange", (states) => setPeers({ ...states }));

    return () => {
      yBlocks.unobserveDeep(syncBlocksToState);
      provider.destroy();
      ydoc.destroy();
    };
  }, [docId, userName, userColor]);

  const addBlock = (type) => {
    const yBlocks = ydocRef.current.getArray("blocks");
    const map = new Y.Map();
    map.set("id", makeBlockId());
    map.set("type", type);
    map.set("content", type === "code" ? "// code block" : "");
    ydocRef.current.transact(() => yBlocks.push([map]));
  };

  const removeBlock = (id) => {
    const yBlocks = ydocRef.current.getArray("blocks");
    ydocRef.current.transact(() => {
      const idx = yBlocks.toArray().findIndex((m) => m.get("id") === id);
      if (idx !== -1) yBlocks.delete(idx, 1);
    });
  };

  const updateBlockContent = (id, content) => {
    const yBlocks = ydocRef.current.getArray("blocks");
    const target = yBlocks.toArray().find((m) => m.get("id") === id);
    if (target) {
      ydocRef.current.transact(() => target.set("content", content));
    }
  };

  const handleFocus = (blockId) => {
    setFocusedBlockId(blockId);
    providerRef.current.setLocalAwareness({ name: userName, color: userColor, blockId });
  };

  const handleBlur = () => {
    setFocusedBlockId(null);
    providerRef.current.setLocalAwareness({ name: userName, color: userColor, blockId: null });
  };

  const editorsByBlock = useMemo(() => {
    const map = {};
    Object.values(peers).forEach((p) => {
      if (p && p.blockId) {
        map[p.blockId] = map[p.blockId] || [];
        map[p.blockId].push(p);
      }
    });
    return map;
  }, [peers]);

  const exportHtml = () => {
    window.open(`${API_URL}/api/documents/${docId}/export`, "_blank");
  };

  return (
    <div className="shell">
      <header className="editor-header">
        <button className="back-btn" onClick={onBack}>
          ← Documents
        </button>
        <div className="status-pill" data-status={status}>
          <span className="dot" /> {status}
        </div>
        <div className="presence-row">
          {Object.values(peers).map((p, i) => (
            <span key={i} className="presence-chip" style={{ background: p.color }}>
              {p.name}
            </span>
          ))}
        </div>
        <button className="export-btn" onClick={exportHtml}>
          Export HTML
        </button>
      </header>

      <main className="editor-main">
        {blocks.length === 0 && (
          <p className="muted" style={{ marginTop: 24 }}>
            Empty document. Add a block below to start writing.
          </p>
        )}

        {blocks.map((block) => {
          const activeEditors = (editorsByBlock[block.id] || []).filter(
            (p) => p.name !== userName || block.id !== focusedBlockId
          );
          return (
            <div key={block.id} className="block-wrap">
              {activeEditors.length > 0 && (
                <div className="editing-indicator">
                  {activeEditors.map((p, i) => (
                    <span key={i} className="editing-chip" style={{ borderColor: p.color, color: p.color }}>
                      ● {p.name} editing
                    </span>
                  ))}
                </div>
              )}
              <div className={`block block-${block.type}`}>
                <span className="block-type-tag">{block.type}</span>
                <textarea
                  value={block.content}
                  onChange={(e) => updateBlockContent(block.id, e.target.value)}
                  onFocus={() => handleFocus(block.id)}
                  onBlur={handleBlur}
                  placeholder={block.type === "code" ? "// write code…" : "Type here…"}
                  rows={block.type === "code" ? 6 : 3}
                />
                <button className="remove-btn" onClick={() => removeBlock(block.id)} title="Delete block">
                  ✕
                </button>
              </div>
            </div>
          );
        })}

        <div className="add-block-row">
          <button onClick={() => addBlock("paragraph")}>+ Paragraph</button>
          <button onClick={() => addBlock("heading")}>+ Heading</button>
          <button onClick={() => addBlock("code")}>+ Code block</button>
        </div>
      </main>
    </div>
  );
}
