const nodemailer = require('nodemailer');
const dns = require('dns');
const { promisify } = require('util');

const dnsLookup = promisify(dns.lookup);

// ─────────────────────────────────────────────────────────
// Helper: resolve hostname to IPv4 address
// Render's free tier only has IPv4 outbound; Gmail DNS may
// return an IPv6 AAAA record first → ENETUNREACH.
// ─────────────────────────────────────────────────────────
const resolveIPv4 = async (hostname) => {
  try {
    const { address } = await dnsLookup(hostname, { family: 4 });
    console.log(`[Email] Resolved ${hostname} → ${address} (IPv4)`);
    return address;
  } catch (err) {
    console.warn(`[Email] IPv4 DNS lookup failed for ${hostname}:`, err.message, '— using hostname directly');
    return hostname;
  }
};

// ─────────────────────────────────────────────────────────
// Helper: wrap a promise with a timeout
// ─────────────────────────────────────────────────────────
const withTimeout = (promise, ms, label = 'Operation') =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    )
  ]);

// ─────────────────────────────────────────────────────────
// Transport — supports Gmail App Password, custom SMTP, or
// falls back to Ethereal (test) in development only.
// In production, emails are SKIPPED if no provider is set.
// ─────────────────────────────────────────────────────────
let transporter;
let transporterVerified = false;

const IS_PROD = process.env.NODE_ENV === 'production';

const createTransporter = async () => {
  // Return cached transporter only if it was verified successfully
  if (transporter && transporterVerified) return transporter;

  if (process.env.SMTP_HOST) {
    // Custom SMTP (SendGrid, Mailgun, your own server, etc.)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      // Render / cloud timeouts
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
    console.log('[Email] Using custom SMTP:', process.env.SMTP_HOST);
  } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    // Gmail App Password — try SMTPS (465) first, then fallback to STARTTLS (587)
    const gmailIP = await resolveIPv4('smtp.gmail.com');

    const attemptConfigs = [
      {
        // SMTPS explicit (IPv4 IP)
        host: gmailIP,
        port: 465,
        secure: true,
        tls: { servername: 'smtp.gmail.com', rejectUnauthorized: true, minVersion: 'TLSv1.2' }
      },
      {
        // STARTTLS (hostname) — sometimes allowed when 465 is blocked
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        tls: { servername: 'smtp.gmail.com', rejectUnauthorized: true, minVersion: 'TLSv1.2' }
      }
    ];

    let lastError = null;
    for (const cfg of attemptConfigs) {
      try {
        const conf = Object.assign({
          auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000
        }, cfg);

        const candidate = nodemailer.createTransport(conf);
        console.log(`[Email] Trying Gmail transport: ${conf.host}:${conf.port} secure=${conf.secure}`);

        // Verify with timeout
        await withTimeout(candidate.verify(), 12000, `SMTP verify ${conf.host}:${conf.port}`);

        transporter = candidate;
        console.log(`[Email] Gmail SMTP verified: ${conf.host}:${conf.port}`);
        break; // success
      } catch (err) {
        lastError = err;
        console.warn(`[Email] Gmail transport failed for ${cfg.host}:${cfg.port} —`, err.message);
        // try next config
      }
    }

    if (!transporter) {
      console.error('[Email] All Gmail transport attempts failed. Last error:', lastError && lastError.message);
      // leave transporter null so caller sees an error from createTransporter
      throw lastError || new Error('Gmail transport verification failed');
    }
  } else if (IS_PROD) {
    // ──── PRODUCTION WITHOUT CREDENTIALS ────
    console.error(
      '\n╔══════════════════════════════════════════════════════════╗\n' +
      '║  [Email] ERROR: No email provider configured!           ║\n' +
      '║  Set GMAIL_USER + GMAIL_APP_PASSWORD or SMTP_* env vars ║\n' +
      '║  in your Render dashboard. Emails will NOT be sent.     ║\n' +
      '╚══════════════════════════════════════════════════════════╝\n'
    );
    // Stub transport so the app doesn't crash — but emails won't reach users
    transporter = {
      sendMail: async () => ({ messageId: 'stub-no-provider-in-production' }),
      verify: async () => true
    };
    transporterVerified = true;
    return transporter;
  } else {
    // Fallback — Ethereal test account (dev only, viewable at ethereal.email)
    try {
      const testAccount = await Promise.race([
        nodemailer.createTestAccount(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Ethereal timeout')), 5000))
      ]);
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('[Email] Using Ethereal test account:', testAccount.user);
    } catch (err) {
      console.warn('[Email] Ethereal fallback failed:', err.message, '— emails will be skipped');
      transporter = {
        sendMail: async () => ({ messageId: 'stub-no-transport' }),
        verify: async () => true
      };
      transporterVerified = true;
      return transporter;
    }
  }

  // Verify the SMTP connection works before caching (with timeout so it never hangs)
  try {
    await withTimeout(transporter.verify(), 12000, 'SMTP verify');
    transporterVerified = true;
    console.log('[Email] SMTP connection verified successfully ✓');
  } catch (err) {
    console.error('[Email] SMTP connection verification FAILED:', err.message);
    console.error('[Email] Check your SMTP/Gmail credentials in environment variables.');
    // Don't cache a broken transporter — allow retry on next call
    const failedTransporter = transporter;
    transporter = null;
    transporterVerified = false;
    return failedTransporter; // Still return it so the caller gets an error from sendMail
  }

  return transporter;
};

// ─────────────────────────────────────────────────
// Helper — sender address
// ─────────────────────────────────────────────────
// Gmail ignores custom FROM addresses and sends from the authenticated account.
// We must use the actual Gmail address as sender, or Gmail silently rewrites it.
const FROM = process.env.EMAIL_FROM
  || (process.env.GMAIL_USER
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
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#e87e1e 0%,#f5a623 100%);padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:26px;letter-spacing:1px;">🚂 RailBite</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Bangladesh Railway Food Service</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #2a2a3e;text-align:center;">
            <p style="margin:0;color:#888;font-size:12px;">© ${new Date().getFullYear()} RailBite Bangladesh. All rights reserved.</p>
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

// ─────────────────────────────────────────────────
// Core send helper
// ─────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const t = await withTimeout(createTransporter(), 15000, 'Create transporter');
    console.log(`[Email] Sending "${subject}" to ${to}...`);

    const info = await withTimeout(
      t.sendMail({
        from: FROM,
        to,
        subject,
        html,
        text: text || subject
      }),
      20000,
      'sendMail'
    );

    // Log Ethereal preview URL in dev
    if (info.messageId && !process.env.SMTP_HOST && !process.env.GMAIL_USER) {
      const previewUrl = nodemailer.getTestMessageUrl
        ? nodemailer.getTestMessageUrl(info)
        : null;
      if (previewUrl) {
        console.log('[Email] Preview URL:', previewUrl);
      }
    }

    console.log(`[Email] Sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email] Send failed to ${to}:`, error.message);
    if (error.code) console.error('[Email] Error code:', error.code);
    if (error.responseCode) console.error('[Email] SMTP response code:', error.responseCode);
    return { success: false, error: error.message };
  }
};

// ═════════════════════════════════════════════════
// PUBLIC API — pre-built email templates
// ═════════════════════════════════════════════════

/**
 * Email verification after registration
 */
const sendVerificationEmail = async (user, token) => {
  const link = `${FRONTEND_URL}/verify-email/${token}`;
  const html = wrapHTML(`
    <h2 style="color:#fff;margin-top:0;">Welcome to RailBite, ${user.name}! 🎉</h2>
    <p style="color:#ccc;line-height:1.7;">
      Thank you for registering. Please verify your email address to activate
      your account and start ordering delicious meals on your train journey.
    </p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${link}" style="${btnStyle}">✅ Verify My Email</a>
    </p>
    <p style="color:#999;font-size:13px;">
      Or copy this link into your browser:<br/>
      <a href="${link}" style="color:#e87e1e;word-break:break-all;">${link}</a>
    </p>
    <p style="color:#666;font-size:12px;margin-top:24px;">
      This link expires in <strong>24 hours</strong>. If you didn't create an
      account, you can safely ignore this email.
    </p>
  `);

  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email — RailBite',
    html
  });
};

/**
 * Password reset request
 */
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

  return sendEmail({
    to: user.email,
    subject: 'Reset Your Password — RailBite',
    html
  });
};

/**
 * Password successfully changed confirmation
 */
const sendPasswordChangedEmail = async (user) => {
  const html = wrapHTML(`
    <h2 style="color:#fff;margin-top:0;">Password Changed Successfully ✅</h2>
    <p style="color:#ccc;line-height:1.7;">
      Hi <strong>${user.name}</strong>, your RailBite password was just changed
      successfully.
    </p>
    <p style="color:#ccc;line-height:1.7;">
      If you did not make this change, please contact our support immediately
      at <a href="mailto:support@railbitebd.com" style="color:#e87e1e;">support@railbitebd.com</a>.
    </p>
  `);

  return sendEmail({
    to: user.email,
    subject: 'Password Changed — RailBite',
    html
  });
};

/**
 * Welcome email after verification
 */
const sendWelcomeEmail = async (user) => {
  const html = wrapHTML(`
    <h2 style="color:#fff;margin-top:0;">Email Verified! 🎊</h2>
    <p style="color:#ccc;line-height:1.7;">
      Hi <strong>${user.name}</strong>, your email has been verified successfully.
      Your RailBite account is now fully activated!
    </p>
    <p style="color:#ccc;line-height:1.7;">
      You can now order delicious meals delivered right to your train seat
      across Bangladesh Railway.
    </p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${FRONTEND_URL}/order-selection" style="${btnStyle}">🍔 Start Ordering</a>
    </p>
  `);

  return sendEmail({
    to: user.email,
    subject: 'Welcome to RailBite! 🚂',
    html
  });
};

/**
 * Order confirmation
 */
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

/**
 * Order status update
 */
const sendOrderStatusEmail = async (user, order, status) => {
  const statusMap = {
    confirmed: { emoji: '✅', label: 'Confirmed', color: '#4caf50' },
    preparing: { emoji: '👨‍🍳', label: 'Being Prepared', color: '#ff9800' },
    on_the_way: { emoji: '🚚', label: 'Dispatched & On The Way', color: '#2196f3' },
    delivered: { emoji: '🎉', label: 'Delivered', color: '#4caf50' },
    cancelled: { emoji: '❌', label: 'Cancelled', color: '#f44336' }
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

/**
 * Contact message confirmation (to the user)
 */
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

  return sendEmail({
    to: email,
    subject: 'We Received Your Message — RailBite',
    html
  });
};

/**
 * Payment confirmation
 */
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

/**
 * Diagnostic — test email config from /api/auth/test-email
 */
const testEmailConfig = async () => {
  const config = {
    provider: process.env.SMTP_HOST
      ? `SMTP (${process.env.SMTP_HOST})`
      : process.env.GMAIL_USER
        ? `Gmail (${process.env.GMAIL_USER})`
        : 'None (Ethereal/stub)',
    from: FROM,
    frontendUrl: FRONTEND_URL,
    nodeEnv: process.env.NODE_ENV || 'not set'
  };

  try {
    const t = await withTimeout(createTransporter(), 15000, 'Create transporter');
    if (t.verify) {
      await withTimeout(t.verify(), 12000, 'SMTP verify');
      config.smtpConnection = 'OK';
    } else {
      config.smtpConnection = 'stub (no real transport)';
    }
  } catch (err) {
    config.smtpConnection = `FAILED: ${err.message}`;
  }

  return config;
};

/**
 * Send a real test email to verify delivery works end-to-end
 */
const sendTestEmail = async (toEmail) => {
  const html = wrapHTML(`
    <h2 style="color:#fff;margin-top:0;">Test Email from RailBite ✅</h2>
    <p style="color:#ccc;line-height:1.7;">If you can read this, email delivery is working correctly!</p>
    <p style="color:#999;font-size:13px;">Sent at: ${new Date().toISOString()}</p>
  `);

  return sendEmail({
    to: toEmail,
    subject: 'RailBite Email Test',
    html
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendContactConfirmationEmail,
  sendPaymentConfirmationEmail,
  testEmailConfig,
  sendTestEmail
};
