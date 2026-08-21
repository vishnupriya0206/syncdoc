const mongoose = require('mongoose');

const CollaboratorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'editing', 'viewing'], default: 'editing' },
    invitedEmail: { type: String },
  },
  { _id: false }
);

const HistoryEntrySchema = new mongoose.Schema(
  {
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    editedByName: String,
    editedAt: { type: Date, default: Date.now },
    summary: String,
  },
  { _id: false }
);

const DocumentSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Untitled Document' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collaborators: [CollaboratorSchema],
    folder: { type: String, default: null },
    starred: { type: Boolean, default: false },
    trashed: { type: Boolean, default: false },

    // Serialized Yjs CRDT document state (the "AST" content tree lives inside
    // the Yjs XmlFragment). Stored as a base64 string of the binary update.
    ydocState: { type: String, default: '' },

    // Plain-text/HTML snapshot kept in sync for quick listing/search & export,
    // always run through DOMPurify before it is persisted (see socket/collab.js).
    contentHtml: { type: String, default: '' },
    wordCount: { type: Number, default: 0 },
    charCount: { type: Number, default: 0 },

    history: [HistoryEntrySchema],
  },
  { timestamps: true }
);

DocumentSchema.methods.toSummaryJSON = function () {
  return {
    id: this._id,
    title: this.title,
    updatedAt: this.updatedAt,
    starred: this.starred,
    trashed: this.trashed,
    folder: this.folder,
    owner: this.owner,
  };
};

module.exports = mongoose.model('Document', DocumentSchema);
