/**
 * Zytek Solutions — Production Server
 * Serves the compiled SPA + handles the /api/contact form endpoint.
 *
 * Platforms: Hostinger (Node.js), Render, Railway, Ubuntu VPS
 *
 * Set these environment variables before starting:
 *   NODE_ENV=production
 *   PORT=3000
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=zyteksolution@gmail.com
 *   SMTP_PASS=<Gmail App Password>
 *   CONTACT_EMAIL=zyteksolution@gmail.com   (optional, defaults to SMTP_USER)
 */

import express from "express";
import compression from "compression";
import nodemailer from "nodemailer";
import { rateLimit } from "express-rate-limit";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import pino from "pino";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, "dist", "public");

// ── Logger ────────────────────────────────────────────────────────────────────
const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(isProduction
    ? {}
    : { transport: { target: "pino-pretty", options: { colorize: true } } }),
});

// Verify build directory exists
if (!fs.existsSync(DIST)) {
  logger.error({ dir: DIST }, "Build directory not found. Run the build step first.");
  process.exit(1);
}

const app = express();

// ── Remove fingerprinting ────────────────────────────────────────────────────
app.disable("x-powered-by");

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── Body parser (for the contact form API) ───────────────────────────────────
app.use(express.json({ limit: "20kb" }));

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: "Too many requests.",
  }),
);

// ── CSP ───────────────────────────────────────────────────────────────────────
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

// ── Security headers ──────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Content-Security-Policy", CSP);
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
});

// ════════════════════════════════════════════════════════════════════════════════
// ── POST /api/contact ─────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════

// Stricter rate limit: max 5 contact submissions per IP per 15 min
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: JSON.stringify({ error: "Too many messages sent. Please try again later." }),
  keyGenerator: (req) => req.ip ?? "unknown",
});

app.post("/api/contact", contactLimiter, async (req, res) => {
  // ── 1. Validate ────────────────────────────────────────────────────────────
  const { name, email, company, phone, service, message } = req.body ?? {};

  const errors = [];
  if (!name   || typeof name   !== "string" || name.trim().length   < 2)   errors.push("Name must be at least 2 characters.");
  if (!email  || typeof email  !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.push("Valid email address is required.");
  if (!service|| typeof service !== "string" || service.trim().length < 1)  errors.push("Please select a service.");
  if (!message|| typeof message !== "string" || message.trim().length < 10) errors.push("Message must be at least 10 characters.");
  if (name    && name.trim().length   > 100)  errors.push("Name is too long.");
  if (email   && email.trim().length  > 200)  errors.push("Email is too long.");
  if (message && message.trim().length > 2000) errors.push("Message is too long (max 2000 characters).");

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0] });
  }

  const cleanName    = name.trim();
  const cleanEmail   = email.trim().toLowerCase();
  const cleanService = service.trim();
  const cleanMessage = message.trim();
  const cleanCompany = (company && typeof company === "string") ? company.trim().slice(0, 150) : null;
  const cleanPhone   = (phone   && typeof phone   === "string") ? phone.trim().slice(0, 30)   : null;

  // ── 2. Check SMTP config ───────────────────────────────────────────────────
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT ?? "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const toEmail  = process.env.CONTACT_EMAIL ?? smtpUser ?? "zyteksolution@gmail.com";

  if (!smtpHost || !smtpUser || !smtpPass) {
    logger.error("Contact form: SMTP environment variables not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)");
    return res.status(500).json({
      error: "Email service is not configured. Please contact us directly on WhatsApp.",
    });
  }

  // ── 3. Build email ─────────────────────────────────────────────────────────
  const subject = `New enquiry from ${cleanName} — ${cleanService}`;

  const textBody = [
    "New contact form submission — Zytek Solutions",
    "",
    `Name:     ${cleanName}`,
    `Email:    ${cleanEmail}`,
    cleanCompany ? `Company:  ${cleanCompany}` : null,
    cleanPhone   ? `Phone:    ${cleanPhone}`   : null,
    `Service:  ${cleanService}`,
    "",
    "Message:",
    cleanMessage,
    "",
    "---",
    "Sent via zyteksolutions.com contact form",
  ].filter((l) => l !== null).join("\n");

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#0f172a;padding:24px 32px">
      <h1 style="color:#fff;margin:0;font-size:20px">New Contact Form Submission</h1>
      <p style="color:#94a3b8;margin:4px 0 0">Zytek Solutions Website</p>
    </div>
    <div style="padding:32px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#64748b;width:110px;vertical-align:top"><strong>Name</strong></td>
            <td style="padding:8px 0;color:#0f172a">${esc(cleanName)}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;vertical-align:top"><strong>Email</strong></td>
            <td style="padding:8px 0"><a href="mailto:${esc(cleanEmail)}" style="color:#3b82f6">${esc(cleanEmail)}</a></td></tr>
        ${cleanCompany ? `<tr><td style="padding:8px 0;color:#64748b;vertical-align:top"><strong>Company</strong></td><td style="padding:8px 0;color:#0f172a">${esc(cleanCompany)}</td></tr>` : ""}
        ${cleanPhone   ? `<tr><td style="padding:8px 0;color:#64748b;vertical-align:top"><strong>Phone</strong></td><td style="padding:8px 0;color:#0f172a">${esc(cleanPhone)}</td></tr>` : ""}
        <tr><td style="padding:8px 0;color:#64748b;vertical-align:top"><strong>Service</strong></td>
            <td style="padding:8px 0;color:#0f172a">${esc(cleanService)}</td></tr>
      </table>
      <div style="margin-top:20px;padding:16px;background:#f8fafc;border-radius:6px;border-left:3px solid #3b82f6">
        <p style="margin:0 0 8px;color:#64748b;font-size:13px"><strong>Message</strong></p>
        <p style="margin:0;color:#0f172a;white-space:pre-wrap">${esc(cleanMessage)}</p>
      </div>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
      <p style="margin:0;color:#94a3b8;font-size:12px">Sent via <a href="https://zyteksolutions.com" style="color:#3b82f6">zyteksolutions.com</a></p>
    </div>
  </div>
</body>
</html>`;

  // ── 4. Send ────────────────────────────────────────────────────────────────
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: isProduction },
    });

    await transporter.sendMail({
      from: `"Zytek Solutions Website" <${smtpUser}>`,
      to: toEmail,
      replyTo: cleanEmail,
      subject,
      text: textBody,
      html: htmlBody,
    });

    logger.info({ service: cleanService }, "Contact form email sent");
    return res.status(200).json({ message: "Message sent successfully." });

  } catch (err) {
    logger.error({ err }, "Failed to send contact form email");
    return res.status(500).json({
      error: "Failed to send your message. Please try WhatsApp or call us directly.",
    });
  }
});

// ── HTML escape helper ─────────────────────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ════════════════════════════════════════════════════════════════════════════════
// ── Static file serving ───────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════

// Hashed assets — 1-year immutable cache
app.use(
  "/assets",
  express.static(path.join(DIST, "assets"), {
    maxAge: "1y",
    immutable: true,
    fallthrough: false,
  }),
);

// Other static files — short cache
app.use(
  express.static(DIST, {
    maxAge: "1d",
    index: false,
    dotfiles: "deny",
  }),
);

// SPA fallback — all other routes → index.html
app.get("*", (req, res) => {
  const indexPath = path.join(DIST, "index.html");
  const resolved  = path.resolve(DIST, "." + req.path);

  if (!resolved.startsWith(DIST)) {
    return res.status(400).end();
  }

  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.sendFile(indexPath, (err) => {
    if (err && !res.headersSent) {
      logger.error({ err, path: req.path }, "Error sending index.html");
      res.status(500).end();
    }
  });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(
    { port: PORT, env: process.env.NODE_ENV ?? "development" },
    "Zytek Solutions server started",
  );

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn(
      "SMTP not configured — contact form will return errors until SMTP_HOST, SMTP_USER, and SMTP_PASS are set",
    );
  }
});

export default app;
