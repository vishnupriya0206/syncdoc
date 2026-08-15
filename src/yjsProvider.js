import * as Y from "yjs";
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

/**
 * A minimal custom provider that bridges a Yjs Y.Doc to a Socket.io server.
 * It plays the same role as y-websocket's WebsocketProvider, but rides on
 * top of our own Express + Socket.io backend so the same connection can
 * also carry REST-adjacent presence/awareness events.
 */
export class SocketIOProvider {
  constructor(docId, ydoc, { userName, userColor } = {}) {
    this.docId = docId;
    this.ydoc = ydoc;
    this.userName = userName || "Anonymous";
    this.userColor = userColor || randomColor();
    this.awarenessState = {}; // socketId -> { name, color, blockId }
    this.listeners = { awarenessChange: [], statusChange: [] };
    this.status = "connecting";

    this.socket = io(SERVER_URL, { transports: ["websocket", "polling"] });

    this.socket.on("connect", () => {
      this._setStatus("connected");
      this.socket.emit("join-document", { docId });
    });

    this.socket.on("disconnect", () => this._setStatus("disconnected"));

    this.socket.on("sync-response", ({ update }) => {
      const binary = base64ToUint8Array(update);
      Y.applyUpdate(this.ydoc, binary, "remote");
    });

    this.socket.on("update", ({ update }) => {
      const binary = base64ToUint8Array(update);
      Y.applyUpdate(this.ydoc, binary, "remote");
    });

    this.socket.on("awareness", ({ socketId, state }) => {
      if (state === null) {
        delete this.awarenessState[socketId];
      } else {
        this.awarenessState[socketId] = state;
      }
      this._emit("awarenessChange", this.getAwarenessStates());
    });

    this.socket.on("peer-left", ({ socketId }) => {
      delete this.awarenessState[socketId];
      this._emit("awarenessChange", this.getAwarenessStates());
    });

    // Any local change to the Y.Doc gets sent to the server, tagged so we
    // don't re-broadcast updates that just arrived FROM the server.
    this.ydoc.on("update", (update, origin) => {
      if (origin === "remote") return;
      const b64 = uint8ArrayToBase64(update);
      this.socket.emit("update", { docId: this.docId, update: b64 });
    });
  }

  setLocalAwareness(partialState) {
    this.socket.emit("awareness", { docId: this.docId, state: partialState });
  }

  getAwarenessStates() {
    return this.awarenessState;
  }

  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }

  _emit(event, payload) {
    (this.listeners[event] || []).forEach((cb) => cb(payload));
  }

  _setStatus(status) {
    this.status = status;
    this._emit("statusChange", status);
  }

  destroy() {
    this.socket.emit("awareness", { docId: this.docId, state: null });
    this.socket.disconnect();
  }
}

function base64ToUint8Array(base64) {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64(bytes) {
  let binaryStr = "";
  for (let i = 0; i < bytes.length; i++) binaryStr += String.fromCharCode(bytes[i]);
  return btoa(binaryStr);
}

export function randomColor() {
  const palette = ["#D97757", "#4C6EF5", "#2F9E44", "#E8590C", "#AE3EC9", "#1098AD"];
  return palette[Math.floor(Math.random() * palette.length)];
}
