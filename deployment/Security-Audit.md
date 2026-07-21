# Security Audit Report — Zytek Solutions
**Date:** 2026-07-20  
**Standard:** OWASP Top 10, NIST Secure Coding Guidelines, Node.js Security Best Practices  
**Severity scale:** 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low · ✅ Pass

---

## Executive Summary

The site is a pre-compiled static React SPA served by a Node.js Express server with a separate Express 5 API backend. No authentication, database queries, or file uploads exist in the current codebase, which significantly reduces the attack surface. All findings below have been **fixed** unless marked with a manual-action tag.

| Severity | Found | Fixed | Manual action required |
|----------|-------|-------|----------------------|
| 🔴 Critical | 1 | 1 | 0 |
| 🟠 High | 5 | 5 | 0 |
| 🟡 Medium | 6 | 6 | 0 |
| 🟢 Low | 4 | 4 | 0 |
| ⚠️ Deployment steps | — | — | 6 |

---

## Findings & Fixes

---

### 1. 🔴 CRITICAL — Open CORS Policy (API Server)

**File:** `artifacts/api-server/src/app.ts`  
**OWASP:** A05:2021 — Security Misconfiguration

**Vulnerability:**  
`app.use(cors())` with no configuration defaults to `Access-Control-Allow-Origin: *`. Any website on the internet could make cross-origin requests to the API, potentially abusing endpoints added in the future (contact form submissions, admin actions, etc.).

**Fix applied:**  
CORS is now restricted to an explicit origin allowlist read from the `CORS_ORIGIN` environment variable. Defaults to `https://zyteksolutions.com` and `https://www.zyteksolutions.com`. In development, `localhost` origins are additionally allowed.

```typescript
// Before
app.use(cors());

// After
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origin '${origin}' not allowed by CORS`));
  },
  credentials: true,
  maxAge: 86400,
}));
```

**Deployment action:** Set `CORS_ORIGIN` in your hosting environment.

---

### 2. 🟠 HIGH — Missing Content Security Policy

**Files:** All delivery layers (server.js, vercel.json, netlify.toml, nginx.conf, _headers)  
**OWASP:** A03:2021 — Injection (XSS via missing CSP)

**Vulnerability:**  
No `Content-Security-Policy` header was present anywhere. Without CSP, any XSS vulnerability — whether in a dependency, a future CMS integration, or a third-party widget — can execute arbitrary JavaScript, exfiltrate data, or hijack sessions.

**Fix applied:**  
A strict CSP has been added to every delivery layer:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' data: https://fonts.gstatic.com;
img-src 'self' data: blob: https:;
connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com;
frame-src 'none';
frame-ancestors 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests
```

**Note:** `'unsafe-inline'` is required for `style-src` because Tailwind CSS v4 and third-party widget styles may inject inline styles at runtime. Script execution is fully restricted to `'self'` — only bundled code in `/assets/` runs. If you add a third-party chat widget script (e.g. Crisp, Intercom) loaded via `<script src="...">`, you must add its origin to `script-src`.

---

### 3. 🟠 HIGH — Framework Version Disclosure (`X-Powered-By`)

**Files:** `app.ts`, `server.js`  
**OWASP:** A05:2021 — Security Misconfiguration

**Vulnerability:**  
Express sets `X-Powered-By: Express` by default. Advertising the framework and version enables targeted attacks exploiting known Express CVEs.

**Fix applied:**  
```typescript
app.disable("x-powered-by");
```
Applied to both the API server and the static file server.

---

### 4. 🟠 HIGH — No Global Error Handler (API Server)

**File:** `artifacts/api-server/src/app.ts`  
**OWASP:** A05:2021 — Security Misconfiguration

**Vulnerability:**  
Express 5 propagates unhandled errors through the default error handler, which can expose stack traces, file paths, and module names to the HTTP response body.

**Fix applied:**  
A global error handler is now registered as the last middleware. It logs the full error server-side using the structured pino logger and always returns a generic `{ error: "An unexpected error occurred." }` response to the client — regardless of the actual error.

---

### 5. 🟠 HIGH — No Request Body Size Limit

**File:** `artifacts/api-server/src/app.ts`  
**OWASP:** A06:2021 — Vulnerable and Outdated Components / DoS

**Vulnerability:**  
`express.json()` and `express.urlencoded()` with no `limit` option accept arbitrarily large request bodies. This enables body-bomb denial-of-service attacks where an attacker sends a multi-megabyte payload to exhaust server memory.

**Fix applied:**  
```typescript
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
```
A 10 KB limit is also applied to the static file server.

---

### 6. 🟠 HIGH — No Rate Limiting

**Files:** `app.ts`, `server.js`  
**OWASP:** A04:2021 — Insecure Design

**Vulnerability:**  
Neither the API server nor the static file server had rate limiting. Without it, both are exposed to brute-force attacks, credential stuffing (when auth is added), and volumetric denial-of-service from a single IP.

**Fix applied:**  
`express-rate-limit` is installed and configured on both servers:

| Server | Window | Max requests |
|--------|--------|-------------|
| API server | 15 min | 200 per IP |
| Static server | 15 min | 500 per IP |

---

### 7. 🟠 HIGH — Missing HSTS Header

**Files:** `server.js`, `vercel.json`, `netlify.toml`, `nginx.conf`, `_headers`  
**OWASP:** A02:2021 — Cryptographic Failures

**Vulnerability:**  
No `Strict-Transport-Security` header meant browsers could downgrade HTTPS connections to HTTP, enabling man-in-the-middle attacks on subsequent visits.

**Fix applied:**  
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
Added to every delivery layer. The static file server applies this only when `NODE_ENV=production`.

---

### 8. 🟡 MEDIUM — Missing Cross-Origin Isolation Headers

**Files:** All delivery layers  
**OWASP:** A05:2021 — Security Misconfiguration

**Vulnerability:**  
Missing `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` headers left the site vulnerable to Spectre-style cross-origin information leakage and cross-origin resource embedding abuse.

**Fix applied:**  
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```
Added to all delivery layers.

---

### 9. 🟡 MEDIUM — Nginx Version Disclosure

**File:** `nginx.conf`  
**OWASP:** A05:2021 — Security Misconfiguration

**Vulnerability:**  
Nginx's default `server_tokens on` setting includes the version number in error pages and the `Server` response header (e.g. `nginx/1.24.0`), enabling targeted exploitation of known version CVEs.

**Fix applied:**  
```nginx
server_tokens off;
```
Added at the top of `nginx.conf`.

---

### 10. 🟡 MEDIUM — Dotfiles Accessible via Static Server

**File:** `server.js`  
**OWASP:** A05:2021 — Security Misconfiguration

**Vulnerability:**  
`express.static()` without `dotfiles: "deny"` serves dotfiles (`.env`, `.gitignore`, `.htaccess`, etc.) if they exist in the static directory.

**Fix applied:**  
```typescript
express.static(DIST, { dotfiles: "deny" })
```

---

### 11. 🟡 MEDIUM — No Path Traversal Guard in SPA Fallback

**File:** `server.js`  
**OWASP:** A01:2021 — Broken Access Control

**Vulnerability:**  
The catch-all `app.get("*")` route passed `req.path` directly to `path.join()` without resolving it first, theoretically allowing crafted paths like `/../../etc/passwd` to resolve outside the build directory on some Node.js versions.

**Fix applied:**  
```javascript
const resolved = path.resolve(DIST, "." + req.path);
if (!resolved.startsWith(DIST)) return res.status(400).end();
```

---

### 12. 🟡 MEDIUM — `console.log()` in Production Server

**File:** `server.js`  
**OWASP:** A09:2021 — Security Logging and Monitoring Failures

**Vulnerability:**  
`console.log()` in the original server produced unstructured plaintext logs, which cannot be filtered, redacted, or monitored effectively. Sensitive request metadata could have been inadvertently exposed in log aggregators.

**Fix applied:**  
Replaced with structured `pino` logging. Logs are JSON-formatted in production and pretty-printed in development. Error objects are always logged server-side; clients receive only generic messages.

---

### 13. 🟡 MEDIUM — Missing Helmet on API Server

**File:** `artifacts/api-server/src/app.ts`  
**OWASP:** A05:2021 — Security Misconfiguration

**Vulnerability:**  
The API server had no `helmet` middleware, leaving out over a dozen security headers (`X-DNS-Prefetch-Control`, `X-Download-Options`, `X-Permitted-Cross-Domain-Policies`, `Origin-Agent-Cluster`, etc.).

**Fix applied:**  
`helmet` is installed and applied. CSP and COEP are disabled (not appropriate for a JSON API), all other helmet defaults are active.

---

### 14. 🟢 LOW — Missing `Permissions-Policy` header in some configs

**Files:** `vercel.json`, `netlify.toml`  
**Fix applied:** `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()` added to all delivery layers.

---

### 15. 🟢 LOW — Missing SPA Cache Directives on `index.html`

**Files:** All delivery layers  
**Vulnerability:** `index.html` being cached by browsers or CDNs means users may see outdated code after deployments.  
**Fix applied:** `Cache-Control: public, max-age=0, must-revalidate` is now set explicitly for `/index.html` on all platforms.

---

### 16. 🟢 LOW — Missing Nginx Backup/Config File Block

**File:** `nginx.conf`  
**Vulnerability:** Files like `.bak`, `.sql`, `.conf`, `.log` in the web root could be served publicly.  
**Fix applied:** Explicit `deny all` for common backup and config file extensions.

---

### 17. ✅ PASS — No Hardcoded Secrets

Scanned all source files, configuration files, and build outputs. No API keys, passwords, tokens, or credentials were found in the codebase.

---

### 18. ✅ PASS — No SQL Injection Risk

No database queries exist in the current codebase. When queries are added, the project uses Drizzle ORM which uses parameterized queries by default.

---

### 19. ✅ PASS — No XSS via DOM Injection

The SPA is built with React, which escapes all dynamic values in JSX by default. `dangerouslySetInnerHTML` is not used anywhere in the compiled output.

---

### 20. ✅ PASS — Supply-Chain Protection Active

`pnpm-workspace.yaml` has `minimumReleaseAge: 1440` configured — packages must be published for at least 24 hours before pnpm will install them, blocking the most common npm supply-chain attack vector (malicious packages pulled within hours of release).

---

### 21. ✅ PASS — Structured Logging with Redaction

`lib/logger.ts` already redacts `authorization`, `cookie`, and `set-cookie` headers from logs.

---

## Pre-Production Checklist

Before going live, complete these manual steps:

- [ ] **Set `CORS_ORIGIN`** in your hosting environment to `https://zyteksolutions.com,https://www.zyteksolutions.com`
- [ ] **Set `NODE_ENV=production`** in all hosting environments
- [ ] **Enable SSL** on your hosting platform (auto via Vercel/Netlify; `certbot` on VPS)
- [ ] **Create `og-image.png`** (1200×630px) and upload to `dist/public/` — currently missing, causing 404 for social crawlers
- [ ] **Test CSP** after deployment using [securityheaders.com](https://securityheaders.com) — if your WhatsApp/chat widget breaks, add its script origin to `script-src` in all delivery configs
- [ ] **Submit domain to HSTS Preload List** at [hstspreload.org](https://hstspreload.org) after confirming HTTPS works correctly (one-time action, irreversible until you remove it)
- [ ] **Run `npm audit`** before any deployment to catch newly disclosed CVEs in dependencies
- [ ] **Add Cloudflare Turnstile** to the contact form when you build it (site key in frontend, secret key in `.env` only)

---

## If You Add a Contact Form (Future)

When building the contact form backend, implement:

1. **Server-side validation** — never trust browser validation alone
2. **Input sanitization** — strip/encode HTML before storing or emailing
3. **Rate limiting** — tighter limit (e.g. 5 submissions per 15 min per IP) using `express-rate-limit`
4. **Cloudflare Turnstile** — CAPTCHA verification before processing (`TURNSTILE_SECRET_KEY` in `.env`)
5. **Parameterized queries** — if storing submissions in the database
6. **CSRF token** — if the form is in a session-authenticated context
7. **Generic error responses** — never return SMTP errors, validation details, or internal paths to the user

---

## Dependency Audit

```bash
# Run this before every deployment
cd artifacts/api-server && npm audit
cd artifacts/zytek-solutions && npm audit --prefix . 2>/dev/null || echo "No package.json at root"
```

No known vulnerabilities were found at the time of this audit.
