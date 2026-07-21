# Zytek Solutions

**Lahore's Trusted Technology Partner** — Web development, IT infrastructure, security systems & digital marketing for businesses across Pakistan.

🌐 **Live site:** [zyteksolutions.com](https://zyteksolutions.com)

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Fonts | Inter (Google Fonts) |
| Deployment | Static SPA + optional Node.js server |

---

## Folder Structure

```
zytek-solutions/
├── dist/
│   └── public/              # ← Production build output (deploy this)
│       ├── index.html
│       ├── favicon.svg
│       ├── site.webmanifest
│       ├── robots.txt
│       ├── sitemap.xml
│       ├── _redirects        # Netlify/Cloudflare SPA routing
│       ├── _headers          # Netlify/Cloudflare security headers
│       └── assets/
│           ├── index-*.js    # Minified JS bundle (content-hashed)
│           └── index-*.css   # Minified CSS bundle (content-hashed)
│
├── src/                      # React source code
│   ├── components/ui/        # shadcn/ui base components
│   ├── pages/                # Page-level route components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities (cn, etc.)
│   ├── App.tsx               # Root component & router
│   └── main.tsx              # Entry point
│
├── deployment/               # Platform-specific deployment guides
│   ├── Vercel.md
│   ├── Netlify.md
│   ├── Hostinger.md
│   ├── Render.md
│   ├── Railway.md
│   ├── Docker.md
│   ├── Apache.md             # Apache / cPanel / shared hosting
│   ├── Nginx.md              # Standalone Nginx guide
│   ├── VPS-Ubuntu.md         # Ubuntu VPS (Nginx + PM2)
│   ├── DigitalOcean.md       # DO App Platform / Droplet / Spaces
│   └── Security-Audit.md     # Full security audit report
│
├── docs/                     # Project documentation
│   ├── Project-Structure.md  # Detailed folder layout explanation
│   └── Pre-Deployment-Checklist.md
│
├── server.js                 # Node.js Express static file server
├── package.server.json       # Standalone package.json for Node.js hosts
├── ecosystem.config.cjs      # PM2 cluster config (VPS)
├── nginx.conf                # Nginx config (VPS / Docker)
├── .htaccess                 # Apache / cPanel / shared hosting config
├── Dockerfile                # Docker container definition
├── docker-compose.yml        # Docker Compose stack
├── vercel.json               # Vercel routing + security headers
├── netlify.toml              # Netlify build + routing + headers
├── .env.example              # Environment variable template
├── LICENSE                   # MIT license
└── README.md                 # This file
```

---

## Installation (for Node.js hosting)

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Install server dependencies (only needed for Node.js hosting)
cp package.server.json package.json
npm install --production

# 3. Start the server
npm start
```

> **Static hosting** (Vercel, Netlify, Hostinger Static): just upload the `dist/public/` folder — no server or npm install needed.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Port the Node.js server listens on |
| `NODE_ENV` | No | `production` | Runtime environment |
| `SITE_URL` | No | — | Full site URL for canonical links |

See `.env.example` for the full list including optional variables.

---

## Build

The site ships as a **pre-compiled static build** in `dist/public/`. No build step is needed unless you are modifying the source code.

If you do have source access, the build command is:
```bash
npm run build   # or: vite build
```

---

## Deployment Quick Reference

| Platform | Guide | Difficulty |
|----------|-------|------------|
| Vercel | [deployment/Vercel.md](deployment/Vercel.md) | ⭐ Easiest |
| Netlify | [deployment/Netlify.md](deployment/Netlify.md) | ⭐ Easy |
| Render | [deployment/Render.md](deployment/Render.md) | ⭐⭐ Easy |
| Railway | [deployment/Railway.md](deployment/Railway.md) | ⭐⭐ Easy |
| Hostinger | [deployment/Hostinger.md](deployment/Hostinger.md) | ⭐⭐ Medium |
| Docker | [deployment/Docker.md](deployment/Docker.md) | ⭐⭐⭐ Medium |
| Ubuntu VPS | [deployment/Ubuntu-VPS.md](deployment/Ubuntu-VPS.md) | ⭐⭐⭐ Advanced |

---

## SEO

The site includes full SEO configuration:

- ✅ Unique `<title>` and `<meta description>`
- ✅ Open Graph tags (Facebook, LinkedIn)
- ✅ Twitter Card tags
- ✅ Canonical URL
- ✅ Structured data (LocalBusiness schema)
- ✅ `robots.txt` (allows all crawlers)
- ✅ `sitemap.xml` (all major pages)
- ✅ Web App Manifest (`site.webmanifest`)
- ✅ Favicon (SVG)

**Action required:** Replace `og-image.png` (1200×630px) in `dist/public/` with your actual OG social preview image.

---

## Performance

- Hashed asset filenames → long-lived browser cache (1 year)
- HTML served with `no-cache` → always fresh
- Gzip/Brotli compression (Nginx / Node.js server)
- Fonts preconnected to Google Fonts CDN
- Critical assets preloaded

---

## Security

- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `X-XSS-Protection` — legacy XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin`
- HTTPS enforced via Nginx redirect (VPS) or platform SSL (Vercel/Netlify)
- Non-root user in Docker container

---

## Maintenance

### Updating the site
1. Receive the new compiled build (`dist/public/`)
2. Upload/replace the files on your hosting platform
3. Vite generates new content-hashed filenames automatically — old cached files are invalidated

### Updating `sitemap.xml`
Edit `dist/public/sitemap.xml` and update the `<lastmod>` dates.

### SSL Certificate Renewal (VPS)
```bash
sudo certbot renew --nginx
sudo systemctl reload nginx
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Blank page after navigation | Ensure SPA fallback is configured (all routes → `index.html`) |
| Assets returning 404 | Confirm `dist/public/assets/` is included in upload |
| Old version cached | Hard-refresh (`Ctrl+Shift+R`) or clear CDN cache |
| SSL error on VPS | Run `sudo certbot renew` and reload Nginx |
| Node.js server won't start | Check `NODE_ENV` and `PORT` env vars; run `npm install` first |
