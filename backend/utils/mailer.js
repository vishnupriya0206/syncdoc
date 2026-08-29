const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendInviteEmail({ to, inviterName, documentTitle, link }) {
  const subject = `${inviterName} invited you to collaborate on "${documentTitle}"`;
  const text = `${inviterName} shared the document "${documentTitle}" with you on SyncDoc.\n\nOpen it here: ${link}`;
  const html = `<p><strong>${inviterName}</strong> shared the document <strong>${documentTitle}</strong> with you on SyncDoc.</p><p><a href="${link}">Open the document</a></p>`;

  if (!transporter) {
    // No SMTP configured - log so the invite is still visible during local dev.
    console.log('--- INVITE EMAIL (SMTP not configured, printing instead) ---');
    console.log(`To: ${to}\nSubject: ${subject}\n${text}`);
    console.log('--------------------------------------------------------------');
    return { delivered: false };
  }

  
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'SyncDoc <no-reply@syncdoc.app>',
    to,
    subject,
    text,
    html,
  });
  return { delivered: true };
}

module.exports = { sendInviteEmail };
