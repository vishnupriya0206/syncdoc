const mongoose = require('mongoose');
const Y = require('yjs');
const { verifyToken } = require('../middleware/auth');
const Document = require('../models/Document');
const User = require('../models/User');
const { sanitizeHtml } = require('../utils/sanitize');

// In-memory room state: documentId -> { ydoc, users: Map(socketId -> presence), saveTimer }
const rooms = new Map();

function getRoom(documentId) {
  if (!rooms.has(documentId)) {
    rooms.set(documentId, { ydoc: new Y.Doc(), users: new Map(), saveTimer: null, historyTimer: null });
  }
  return rooms.get(documentId);
}

function b64ToUint8(b64) {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}
function uint8ToB64(arr) {
  return Buffer.from(arr).toString('base64');
}

function schedulePersist(documentId, editedBy, editedByName) {
  const room = getRoom(documentId);
  clearTimeout(room.saveTimer);
  room.saveTimer = setTimeout(async () => {
    try {
      const state = Y.encodeStateAsUpdate(room.ydoc);
      await Document.findByIdAndUpdate(documentId, { ydocState: uint8ToB64(state) });
    } catch (err) {
      console.error('Failed to persist Yjs state', err);
    }
  }, 1500);
}

function presenceList(room) {
  return Array.from(room.users.values());
}

function initCollaboration(io) {
  const nsp = io.of('/collab');

  nsp.on('connection', (socket) => {
    let currentDocId = null;

    socket.on('join-document', async ({ documentId, token }) => {
      try {
        if (!documentId || !mongoose.Types.ObjectId.isValid(documentId)) {
          return socket.emit('error-message', 'Invalid document id');
        }

        const payload = verifyToken(token);
        if (!payload) return socket.emit('error-message', 'Authentication failed');

        const user = await User.findById(payload.sub);
        const doc = await Document.findById(documentId);
        if (!doc || !user) return socket.emit('error-message', 'Document not found');

        const hasAccess =
          doc.owner.toString() === user._id.toString() ||
          doc.collaborators.some((c) => c.user && c.user.toString() === user._id.toString());
        if (!hasAccess) return socket.emit('error-message', 'Access denied');

        currentDocId = documentId;
        socket.join(documentId);

        const room = getRoom(documentId);

        // Load persisted state into the shared Y.Doc the first time this room is opened.
        if (room.users.size === 0 && doc.ydocState) {
          try {
            Y.applyUpdate(room.ydoc, b64ToUint8(doc.ydocState));
          } catch (err) {
            console.error('Failed to hydrate Yjs doc', err);
          }
        }

        room.users.set(socket.id, {
          socketId: socket.id,
          userId: user._id.toString(),
          name: user.name,
          avatarColor: user.avatarColor,
          typing: false,
          role: 'editing',
        });

        // Send current CRDT state to the newly joined client.
        socket.emit('sync-init', { state: uint8ToB64(Y.encodeStateAsUpdate(room.ydoc)) });
        socket.emit('history-init', doc.history.slice(-20).reverse().map((h) => ({
          editedByName: h.editedByName,
          editedAt: h.editedAt,
          summary: h.summary,
        })));
