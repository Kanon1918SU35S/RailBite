const nodemailer = require('nodemailer');

// Helper: wrap a promise with a timeout
const withTimeout = (promise, ms, label = 'Operation') =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    )
  ]);

// ─────────────────────────────────────────────────────────
// BREVO (Sendinblue) HTTP API — bypasses SMTP port blocks
// Free tier: 300 emails/day. Uses HTTPS (port 443) which
// is NEVER blocked on any hosting platform.
// ─────────────────────────────────────────────────────────
const sendViaBrevo = async ({ to, subject, html, text, from }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null; // not configured

  // Parse FROM into name + email
  const fromMatch = from.match(/"?([^"<]*)"?\s*<([^>]+)>/);
  const senderName = fromMatch ? fromMatch[1].trim() : 'RailBite Bangladesh';
  const senderEmail = fromMatch ? fromMatch[2].trim() : from;

  const body = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to }],
    subject,
    htmlContent: html
  };
  if (text) body.textContent = text;

  console.log(`[Email/Brevo] Sending "${subject}" to ${to}...`);

  const res = await withTimeout(
    fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    }),
    15000,
    'Brevo API call'
  );

  const data = await res.json();

  if (!res.ok) {
    console.error('[Email/Brevo] API error:', res.status, JSON.stringify(data));
    return { success: false, error: data.message || `HTTP ${res.status}` };
  }

  console.log(`[Email/Brevo] Sent successfully: messageId=${data.messageId}`);
  return { success: true, messageId: data.messageId || 'brevo-ok', provider: 'brevo' };
};

// ─────────────────────────────────────────────────────────
// RESEND HTTP API — alternative to Brevo
// Free tier: 100 emails/day (3000/month).
// ─────────────────────────────────────────────────────────
const sendViaResend = async ({ to, subject, html, text, from }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null; // not configured

  const body = { from, to: [to], subject, html };
  if (text) body.text = text;

  console.log(`[Email/Resend] Sending "${subject}" to ${to}...`);

  const res = await withTimeout(
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }),
    15000,
    'Resend API call'
  );

  const data = await res.json();

  if (!res.ok) {
    console.error('[Email/Resend] API error:', res.status, JSON.stringify(data));
    return { success: false, error: data.message || `HTTP ${res.status}` };
  }

  console.log(`[Email/Resend] Sent successfully: id=${data.id}`);
  return { success: true, messageId: data.id || 'resend-ok', provider: 'resend' };
};

// ─────────────────────────────────────────────────────────
// SMTP Transport (Nodemailer) — fallback for hosts that
// allow outbound SMTP (not Render free tier).
// ─────────────────────────────────────────────────────────
let smtpTransporter;
let smtpVerified = false;

const createSMTPTransporter = async () => {
  if (smtpTransporter && smtpVerified) return smtpTransporter;

  if (process.env.SMTP_HOST) {
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
    console.log('[Email/SMTP] Using custom SMTP:', process.env.SMTP_HOST);
  } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    smtpTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
    console.log('[Email/SMTP] Using Gmail:', process.env.GMAIL_USER);
  } else if (process.env.NODE_ENV !== 'production') {
    // Ethereal test account (dev only)
    try {
      const testAccount = await Promise.race([
        nodemailer.createTestAccount(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Ethereal timeout')), 5000))
      ]);
      smtpTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email', port: 587, secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      console.log('[Email/SMTP] Using Ethereal:', testAccount.user);
    } catch (err) {
      console.warn('[Email/SMTP] Ethereal failed:', err.message);
      return null;
    }
  } else {
    return null;
  }

  // Verify connection
  try {
    await withTimeout(smtpTransporter.verify(), 12000, 'SMTP verify');
    smtpVerified = true;
    console.log('[Email/SMTP] Connection verified OK');
  } catch (err) {
    console.warn('[Email/SMTP] Verification failed:', err.message);
    smtpTransporter = null;
    smtpVerified = false;
    return null;
  }

  return smtpTransporter;
};

const sendViaSMTP = async ({ to, subject, html, text, from }) => {
  const t = await createSMTPTransporter();
  if (!t) return null;

  console.log(`[Email/SMTP] Sending "${subject}" to ${to}...`);
  const info = await withTimeout(
    t.sendMail({ from, to, subject, html, text: text || subject }),
    20000,
    'SMTP sendMail'
  );

  // Ethereal preview
  if (info.messageId && !process.env.SMTP_HOST && !process.env.GMAIL_USER) {
    const url = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
    if (url) console.log('[Email/SMTP] Ethereal preview:', url);
  }

  console.log(`[Email/SMTP] Sent: ${info.messageId}`);
  return { success: true, messageId: info.messageId, provider: 'smtp' };
};

// ─────────────────────────────────────────────────
// Helper — sender address
// ─────────────────────────────────────────────────
const FROM = process.env.EMAIL_FROM
  || (process.env.BREVO_SENDER_EMAIL
      ? `"RailBite Bangladesh" <${process.env.BREVO_SENDER_EMAIL}>`
      : process.env.GMAIL_USER
        ? `"RailBite Bangladesh" <${process.env.GMAIL_USER}>`
        : '"RailBite Bangladesh" <noreply@railbitebd.com>');

const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:3000';

// ─────────────────────────────────────────────────
// Shared HTML wrapper
// ─────────────────────────────────────────────────
const wrapHTML = (body) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RailBite</title>
</head>
<body style="margin:0;padding:0;background:#111;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:12px;overflow:hidden;border:1px solid #2a2a3e;">
        <-help Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#e87e1e 0%,#f5a623 100%);padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:26px;letter-spacing:1px;">🚂 RailBite</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Bangladesh Railway Food Service</p>
          </td>
        </tr>
        <-help Body -->
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>
        <-help Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #2a2a3e;text-align:center;">
            <p style="margin:0;color:#888;font-size:12px;">&copy; ${new Date().getFullYear()} RailBite Bangladesh. All rights reserved.</p>
            <p style="margin:4px 0 0;color:#666;font-size:11px;">This is an automated email — please do not reply.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

const btnStyle =
  'display:inline-block;padding:14px 32px;background:#e87e1e;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;';

// ═════════════════════════════════════════════════════════
// UNIFIED SEND — tries providers in order:
//   1. Brevo HTTP API  (if BREVO_API_KEY set)
//   2. Resend HTTP API (if RESEND_API_KEY set)
//   3. SMTP/Nodemailer (if SMTP_HOST or GMAIL_USER set)
// First success wins. All use HTTPS except SMTP.
// ═════════════════════════════════════════════════════════
const sendEmail = async ({ to, subject, html, text }) => {
  const providers = [
    { name: 'Brevo',  fn: sendViaBrevo },
    { name: 'Resend', fn: sendViaResend },
    { name: 'SMTP',   fn: sendViaSMTP }
  ];

  let lastError = null;

  for (const { name, fn } of providers) {
    try {
      const result = await fn({ to, subject, html, text, from: FROM });
      if (result === null) continue; // provider not configured
      if (result.success) return result;
      lastError = result.error;
      console.warn(`[Email] ${name} failed:`, result.error);
    } catch (err) {
      lastError = err.message;
      console.warn(`[Email] ${name} exception:`, err.message);
    }
  }

  // All providers failed or none configured
  const errMsg = lastError || 'No email provider configured. Set BREVO_API_KEY, RESEND_API_KEY, or SMTP env vars.';
  console.error('[Email] All providers failed:', errMsg);
  return { success: false, error: errMsg };
};

// ═════════════════════════════════════════════════
// PUBLIC API — pre-built email templates
// ═════════════════════════════════════════════════

const sendPasswordResetEmail = async (user, token) => {
  const link = `${FRONTEND_URL}/reset-password?token=${token}`;
  const html = wrapHTML(`
    <h2 style="color:#fff;margin-top:0;">Password Reset Request 🔐</h2>
    <p style="color:#ccc;line-height:1.7;">
      Hi <strong>${user.name}</strong>, we received a request to reset your
      password. Click the button below to choose a new password.
    </p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${link}" style="${btnStyle}">🔑 Reset Password</a>
    </p>
    <p style="color:#999;font-size:13px;">
      Or copy this link:<br/>
      <a href="${link}" style="color:#e87e1e;word-break:break-all;">${link}</a>
    </p>
    <p style="color:#666;font-size:12px;margin-top:24px;">
      This link expires in <strong>1 hour</strong>. If you didn't request this,
      please ignore this email — your password remains unchanged.
    </p>
  `);

  return sendEmail({ to: user.email, subject: 'Reset Your Password — RailBite', html });
};

const sendPasswordChangedEmail = async (user) => {
  const html = wrapHTML(`
    <h2 style="color:#fff;margin-top:0;">Password Changed Successfully &#x2705;</h2>
    <p style="color:#ccc;line-height:1.7;">
      Hi <strong>${user.name}</strong>, your RailBite password was just changed
      successfully.
    </p>
    <p style="color:#ccc;line-height:1.7;">
      If you did not make this change, please contact our support immediately
      at <a href="mailto:support@railbitebd.com" style="color:#e87e1e;">support@railbitebd.com</a>.
    </p>
  `);

  return sendEmail({ to: user.email, subject: 'Password Changed — RailBite', html });
};

const sendOrderConfirmationEmail = async (user, order) => {
  const itemsHTML = (order.items || [])
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a3e;color:#ccc;">${i.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a3e;color:#ccc;text-align:center;">x${i.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a3e;color:#e87e1e;text-align:right;">৳${(i.price * i.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const html = wrapHTML(`
    <h2 style="color:#fff;margin-top:0;">Order Confirmed! 📦</h2>
    <p style="color:#ccc;line-height:1.7;">
      Hi <strong>${user.name}</strong>, your order has been placed successfully.
    </p>
    <table width="100%" style="margin:20px 0;border-collapse:collapse;">
      <tr style="background:#2a2a3e;">
        <td style="padding:10px 12px;color:#e87e1e;font-weight:600;">Item</td>
        <td style="padding:10px 12px;color:#e87e1e;font-weight:600;text-align:center;">Qty</td>
        <td style="padding:10px 12px;color:#e87e1e;font-weight:600;text-align:right;">Price</td>
      </tr>
      ${itemsHTML}
      <tr>
        <td colspan="2" style="padding:10px 12px;color:#fff;font-weight:700;">Total</td>
        <td style="padding:10px 12px;color:#e87e1e;font-weight:700;text-align:right;">৳${(order.totalAmount || 0).toFixed(2)}</td>
      </tr>
    </table>
    ${order.trainName ? `<p style="color:#ccc;">🚂 <strong>Train:</strong> ${order.trainName}</p>` : ''}
    ${order.seatNumber ? `<p style="color:#ccc;">💺 <strong>Seat:</strong> ${order.seatNumber}</p>` : ''}
    ${order.station ? `<p style="color:#ccc;">📍 <strong>Station:</strong> ${order.station}</p>` : ''}
    <p style="text-align:center;margin:24px 0;">
      <a href="${FRONTEND_URL}/order-details/${order._id}" style="${btnStyle}">📋 View Order Details</a>
    </p>
  `);

  return sendEmail({
    to: user.email,
    subject: `Order Confirmed #${String(order._id).slice(-8).toUpperCase()} — RailBite`,
    html
  });
};

const sendOrderStatusEmail = async (user, order, status) => {
  const statusMap = {
    confirmed: { emoji: '&#x2705;', label: 'Confirmed', color: '#4caf50' },
    preparing: { emoji: '👨‍🍳', label: 'Being Prepared', color: '#ff9800' },
    on_the_way: { emoji: '🚚', label: 'Dispatched & On The Way', color: '#2196f3' },
    delivered: { emoji: '🎉', label: 'Delivered', color: '#4caf50' },
    cancelled: { emoji: '&#x274C;', label: 'Cancelled', color: '#f44336' }
  };

  const s = statusMap[status] || { emoji: '📦', label: status, color: '#e87e1e' };

  const html = wrapHTML(`
    <h2 style="color:#fff;margin-top:0;">Order Update ${s.emoji}</h2>
    <p style="color:#ccc;line-height:1.7;">
      Hi <strong>${user.name}</strong>, your order
      <strong style="color:#e87e1e;">#${String(order._id).slice(-8).toUpperCase()}</strong>
      status has been updated.
    </p>
    <div style="text-align:center;margin:24px 0;padding:20px;background:#222;border-radius:8px;border-left:4px solid ${s.color};">
      <p style="margin:0;color:${s.color};font-size:20px;font-weight:700;">${s.emoji} ${s.label}</p>
    </div>
    <p style="text-align:center;margin:24px 0;">
      <a href="${FRONTEND_URL}/order-tracking/${order._id}" style="${btnStyle}">📍 Track Order</a>
    </p>
  `);

  return sendEmail({
    to: user.email,
    subject: `Order ${s.label} #${String(order._id).slice(-8).toUpperCase()} — RailBite`,
    html
  });
};

const sendContactConfirmationEmail = async (name, email) => {
  const html = wrapHTML(`
    <h2 style="color:#fff;margin-top:0;">Message Received! 📬</h2>
    <p style="color:#ccc;line-height:1.7;">
      Hi <strong>${name}</strong>, thank you for contacting RailBite.
      We've received your message and our support team will get back to you
      within 24 hours.
    </p>
    <p style="color:#999;font-size:13px;margin-top:20px;">
      For urgent matters, call us at <strong>+880 1XXX-XXXXXX</strong>.
    </p>
  `);

  return sendEmail({ to: email, subject: 'We Received Your Message — RailBite', html });
};

const sendPaymentConfirmationEmail = async (user, order, payment) => {
  const html = wrapHTML(`
    <h2 style="color:#fff;margin-top:0;">Payment Received! 💳</h2>
    <p style="color:#ccc;line-height:1.7;">
      Hi <strong>${user.name}</strong>, we've received your payment for order
      <strong style="color:#e87e1e;">#${String(order._id).slice(-8).toUpperCase()}</strong>.
    </p>
    <table width="100%" style="margin:20px 0;">
      <tr>
        <td style="padding:8px 0;color:#999;">Amount Paid</td>
        <td style="padding:8px 0;color:#4caf50;font-weight:700;text-align:right;">৳${(payment.amount || order.totalAmount || 0).toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#999;">Payment Method</td>
        <td style="padding:8px 0;color:#ccc;text-align:right;">${payment.method || 'Online'}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#999;">Transaction ID</td>
        <td style="padding:8px 0;color:#ccc;text-align:right;">${payment.transactionId || 'N/A'}</td>
      </tr>
    </table>
    <p style="text-align:center;margin:24px 0;">
      <a href="${FRONTEND_URL}/order-details/${order._id}" style="${btnStyle}">📋 View Order</a>
    </p>
  `);

  return sendEmail({
    to: user.email,
    subject: `Payment Confirmed — Order #${String(order._id).slice(-8).toUpperCase()} — RailBite`,
    html
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendContactConfirmationEmail,
  sendPaymentConfirmationEmail
};
