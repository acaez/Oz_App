const nodemailer = require('nodemailer');

// Gmail SMTP — SMTP_PASS is a Google "App password" (16 chars), not the account password.
// Without SMTP_USER/SMTP_PASS the mailer is disabled and callers fall back to dev behaviour.

const { SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

const transporter = SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({ service: 'gmail', auth: { user: SMTP_USER, pass: SMTP_PASS } })
  : null;

const isMailEnabled = () => !!transporter;

if (transporter)
  transporter.verify()
    .then(() => console.log(`[Mail] Gmail SMTP ready (${SMTP_USER})`))
    .catch(err => console.error('[Mail] SMTP login failed:', err.message));
else
  console.log('[Mail] SMTP not configured — emails disabled');

function layout(title, body, ctaLabel, ctaUrl) {
  return `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1f1b16">
    <div style="font-size:28px;font-weight:700;letter-spacing:2px;margin-bottom:24px">OZ</div>
    <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 24px">${body}</p>
    <a href="${ctaUrl}" style="display:inline-block;background:#1f1b16;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px">${ctaLabel}</a>
    <p style="font-size:12px;color:#8a8278;margin:32px 0 0">Si le bouton ne marche pas : <br><a href="${ctaUrl}" style="color:#8a8278;word-break:break-all">${ctaUrl}</a></p>
  </div>`;
}

async function sendMail({ to, subject, html }) {
  if (!transporter) throw new Error('Mailer not configured');
  await transporter.sendMail({ from: MAIL_FROM || `OZ Library <${SMTP_USER}>`, to, subject, html });
}

function sendVerificationEmail(to, url) {
  return sendMail({
    to,
    subject: 'Confirme ton adresse email — OZ Library',
    html: layout('Bienvenue sur OZ Library', 'Clique sur le bouton pour activer ton compte.', 'Activer mon compte', url),
  });
}

function sendResetEmail(to, url) {
  return sendMail({
    to,
    subject: 'Réinitialise ton mot de passe — OZ Library',
    html: layout('Mot de passe oublié ?', "Ce lien est valable 1 heure. Si tu n'as rien demandé, ignore cet email.", 'Choisir un nouveau mot de passe', url),
  });
}

module.exports = { isMailEnabled, sendMail, sendVerificationEmail, sendResetEmail };
