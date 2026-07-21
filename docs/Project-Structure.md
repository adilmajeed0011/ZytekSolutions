# Project Structure

This document explains the folder layout of Zytek Solutions and the purpose of each file and directory.

---

## Top-Level Layout

```
zytek-solutions/
│
├── dist/public/          ← Compiled production build (deploy this folder)
├── src/                  ← React source code
│   ├── components/       ← Reusable UI components
│   │   └── ui/           ← shadcn/ui base components
│   ├── pages/            ← Page-level components
│   ├── hooks/            ← Custom React hooks
│   ├── lib/              ← Shared utilities
│   ├── App.tsx           ← Root component & routing
│   ├── main.tsx          ← Entry point
│   └── index.css         ← Global styles (Tailwind)
│
├── public/               ← Static files copied to dist as-is
│   ├── favicon.svg
│   └── robots.txt
│
├── deployment/           ← Platform-specific deployment guides
├── docs/                 ← Project documentation
│
├── server.js             ← Node.js Express static file server (for VPS/Render/Railway)
├── package.server.json   ← Standalone package.json for Node.js hosts (rename to package.json)
├── ecosystem.config.cjs  ← PM2 process manager config
├── nginx.conf            ← Nginx config (VPS / Docker)
├── .htaccess             ← Apache / cPanel / shared hosting config
├── Dockerfile            ← Docker container definition
├── docker-compose.yml    ← Docker Compose (app + optional Nginx)
├── vercel.json           ← Vercel routing + headers config
├── netlify.toml          ← Netlify build + routing + headers config
│
├── .env.example          ← Environment variable template
├── README.md             ← Project overview and quick-start
├── LICENSE               ← MIT license
├── package.json          ← Workspace package (pnpm monorepo)
├── vite.config.ts        ← Vite build configuration
└── tsconfig.json         ← TypeScript configuration
```

---

## `dist/public/` — The Production Build

This is the only folder you need to deploy. It contains:

```
dist/public/
├── index.html            ← SPA entry point (always served for all routes)
├── assets/               ← Compiled JS, CSS, fonts, images (content-hashed)
│   ├── index-[hash].js
│   └── index-[hash].css
├── favicon.svg
├── site.webmanifest      ← PWA manifest
├── robots.txt            ← Search engine crawling rules
├── sitemap.xml           ← XML sitemap for SEO
├── _redirects            ← Netlify/Cloudflare SPA fallback rule
└── _headers              ← Netlify/Cloudflare security headers
```

> The `assets/` files have content-hash filenames (e.g. `index-DTxmIUPp.js`). This enables safe 1-year browser caching — any code change produces a new filename.

---

## `src/` — Source Code

| Path | Purpose |
|------|---------|
| `src/main.tsx` | React entry point — mounts the app |
| `src/App.tsx` | Root component, router setup |
| `src/index.css` | Global CSS, Tailwind imports |
| `src/components/ui/` | shadcn/ui primitive components |
| `src/pages/` | Full-page route components |
| `src/hooks/` | Custom React hooks |
| `src/lib/utils.ts` | `cn()` utility and shared helpers |

---

## Server Files

| File | When to use |
|------|------------|
| `server.js` | Node.js platforms: Render, Railway, Hostinger Node.js, VPS |
| `package.server.json` | Rename to `package.json` on the target host |
| `ecosystem.config.cjs` | PM2 cluster mode on Ubuntu VPS |

---

## Platform Config Files

| File | Platform |
|------|---------|
| `vercel.json` | Vercel |
| `netlify.toml` + `dist/public/_redirects` + `dist/public/_headers` | Netlify / Cloudflare Pages |
| `.htaccess` | Apache / cPanel / shared hosting — place in web root |
| `nginx.conf` | Nginx on VPS or Docker |
| `Dockerfile` | Any Docker-based platform |
| `docker-compose.yml` | Docker Compose (local or self-hosted) |

---

## Documentation

| File | Contents |
|------|---------|
| `README.md` | Project overview, quick start, deployment summary |
| `docs/Project-Structure.md` | This file |
| `deployment/Vercel.md` | Vercel step-by-step guide |
| `deployment/Netlify.md` | Netlify step-by-step guide |
| `deployment/Hostinger.md` | Hostinger step-by-step guide |
| `deployment/Render.md` | Render step-by-step guide |
| `deployment/Railway.md` | Railway step-by-step guide |
| `deployment/Docker.md` | Docker & Docker Compose guide |
| `deployment/Apache.md` | Apache / cPanel / shared hosting guide |
| `deployment/Nginx.md` | Standalone Nginx guide |
| `deployment/VPS-Ubuntu.md` | Ubuntu VPS full guide |
| `deployment/DigitalOcean.md` | DigitalOcean App Platform / Droplet / Spaces |
| `deployment/Security-Audit.md` | Full security audit report and hardening log |
