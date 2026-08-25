const express = require('express');
const mongoose = require('mongoose');
const Document = require('../models/Document');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { sendInviteEmail } = require('../utils/mailer');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();
router.use(requireAuth);

function canAccess(doc, userId) {
  const uid = userId.toString();

  const ownerId = doc.owner?._id
    ? doc.owner._id.toString()
    : doc.owner?.toString();

  if (ownerId === uid) {
    return true;
  }

  return doc.collaborators.some((c) => {
    const collaboratorId = c.user?._id
      ? c.user._id.toString()
      : c.user?.toString();

    return collaboratorId === uid;
  });
}
// Rejects requests with a malformed :id before they ever reach Mongoose, so
// a bad/short id can't throw an uncaught CastError.
function requireValidId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid document id' });
  }
  next();
}

// GET /api/documents  -> all documents visible to the user
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { scope } = req.query; // 'all' | 'shared' | 'starred' | 'trash'
    const uid = req.userId;

    let filter = {
      $or: [{ owner: uid }, { 'collaborators.user': uid }],
    };

    const docs = await Document.find(filter).sort({ updatedAt: -1 }).populate('owner', 'name email avatarColor');

    let result = docs.filter((d) => !d.trashed);
    if (scope === 'shared') result = docs.filter((d) => d.owner._id.toString() !== uid && !d.trashed);
    if (scope === 'starred') result = docs.filter((d) => d.starred && !d.trashed);
    if (scope === 'trash') result = docs.filter((d) => d.trashed);

    res.json({
      documents: result.map((d) => ({
        id: d._id,
        title: d.title,
        updatedAt: d.updatedAt,
        starred: d.starred,
        folder: d.folder,
        owner: d.owner ? { id: d.owner._id, name: d.owner.name } : null,
        isOwner: d.owner && d.owner._id.toString() === uid,
      })),
    });
  })
);

// POST /api/documents  { title }
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const title = req.body.title || 'Untitled Document';
    const doc = await Document.create({
      title,
      owner: req.userId,
      collaborators: [{ user: req.userId, role: 'owner' }],
      history: [{ editedBy: req.userId, summary: 'Document created' }],
    });
    res.status(201).json({ document: { id: doc._id, title: doc.title } });
  })
);

// GET /api/documents/:id
router.get(
  '/:id',
  requireValidId,
  asyncHandler(async (req, res) => {
    const doc = await Document.findById(req.params.id)
      .populate('owner', 'name email avatarColor')
      .populate('collaborators.user', 'name email avatarColor')
      .populate('history.editedBy', 'name');

    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (!canAccess(doc, req.userId)) return res.status(403).json({ error: 'You do not have access to this document' });

    res.json({
      document: {
        id: doc._id,
        title: doc.title,
        ydocState: doc.ydocState,
        contentHtml: doc.contentHtml,
        wordCount: doc.wordCount,
        charCount: doc.charCount,
        owner: doc.owner,
        collaborators: doc.collaborators.map((c) => ({
          id: c.user?._id,
          name: c.user?.name || (c.invitedEmail ? c.invitedEmail.split('@')[0] : 'Invited'),
          email: c.user?.email || c.invitedEmail,
          avatarColor: c.user?.avatarColor,
          role: c.role,
          pending: !c.user,
        })),
        history: doc.history
          .slice(-20)
          .reverse()
          .map((h) => ({
            editedByName: h.editedByName || h.editedBy?.name || 'Someone',
            editedAt: h.editedAt,
            summary: h.summary,
          })),
      },
    });
  })
);

// PATCH /api/documents/:id  { title, starred, trashed, folder }
router.patch(
  '/:id',
  requireValidId,
  asyncHandler(async (req, res) => {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (!canAccess(doc, req.userId)) return res.status(403).json({ error: 'No access' });

    ['title', 'starred', 'trashed', 'folder'].forEach((field) => {
      if (req.body[field] !== undefined) doc[field] = req.body[field];
    });
    await doc.save();
    res.json({ document: { id: doc._id, title: doc.title, starred: doc.starred, trashed: doc.trashed } });
  })
);
// DELETE /api/documents/:id (permanent)
router.delete(
  '/:id',
  requireValidId,
  asyncHandler(async (req, res) => {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.owner.toString() !== req.userId) return res.status(403).json({ error: 'Only the owner can delete this document' });
    await doc.deleteOne();
    res.json({ ok: true });
  })
);

// POST /api/documents/:id/invite  { email, role }
router.post(
  '/:id/invite',
  requireValidId,
  asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email is required' });
    }

    const doc = await Document.findById(req.params.id).populate('owner', 'name email');
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (!canAccess(doc, req.userId)) return res.status(403).json({ error: 'No access' });

    const normalizedEmail = email.toLowerCase().trim();

    if (doc.owner.email === normalizedEmail) {
      return res.status(400).json({ error: 'That is already the document owner' });
    }

    // The invited person may or may not already have a SyncDoc account.
    // Either way is fine - if they don't, we still record the invite by
    // email and link it to their account automatically once they sign up.
    let collaboratorUser = await User.findOne({ email: normalizedEmail });

    const alreadyAdded = doc.collaborators.some(
      (c) => (collaboratorUser && c.user?.toString() === collaboratorUser._id.toString()) || c.invitedEmail === normalizedEmail
    );

    if (!alreadyAdded) {
      doc.collaborators.push({
        user: collaboratorUser ? collaboratorUser._id : undefined,
        invitedEmail: normalizedEmail,
        role: role === 'viewing' ? 'viewing' : 'editing',
      });
      doc.history.push({ editedBy: req.userId, summary: `Invited ${normalizedEmail}` });
      await doc.save();
    }

    const inviter = await User.findById(req.userId);
    const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/editor/${doc._id}`;

    // Sending the email is best-effort: if SMTP is misconfigured or the
    // provider rejects the message, the invite itself (already saved above)
    // should still succeed instead of surfacing a 500 to the client.
    let emailDelivered = false;
    try {
      const result = await sendInviteEmail({ to: normalizedEmail, inviterName: inviter.name, documentTitle: doc.title, link });
      emailDelivered = Boolean(result?.delivered);
    } catch (err) {
      console.error('Failed to send invite email:', err.message);
    }

    res.json({ ok: true, invited: normalizedEmail, emailDelivered, alreadyAdded });
  })
);

module.exports = router;
