# Deploying Zytek Solutions on Vercel

Vercel is the easiest option for this static SPA. Zero configuration required — just point it at the `dist/public` folder.

---

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier works)
- The `dist/public/` folder from this project

---

## Option A — Drag & Drop (No Git required)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Browse"** and select the `dist/public/` folder
3. Vercel detects a static site automatically
4. Click **Deploy**
5. Your site is live in ~30 seconds

---

## Option B — Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# From the project root (artifacts/zytek-solutions/)
vercel deploy --prod
```

When prompted:
- **Build command:** leave empty (already built)
- **Output directory:** `dist/public`
- **Override settings:** No

---

## Option C — Git Integration (Recommended for ongoing updates)

1. Push the project to a GitHub/GitLab/Bitbucket repo
2. Go to [vercel.com/new](https://vercel.com/new) → Import repository
3. Set build settings:
   - **Framework Preset:** Other
   - **Build Command:** *(leave empty)*
   - **Output Directory:** `dist/public`
4. Click **Deploy**

The `vercel.json` in the project root handles:
- SPA routing (all paths → `index.html`)
- Asset caching headers
- Security headers

---

## Custom Domain

1. Vercel dashboard → your project → **Settings → Domains**
2. Add `zyteksolutions.com` and `www.zyteksolutions.com`
3. Follow the DNS instructions to point your domain to Vercel:
   - Add an `A` record: `@` → `76.76.21.21`
   - Add a `CNAME` record: `www` → `cname.vercel-dns.com`
4. Vercel provisions SSL automatically (Let's Encrypt)

---

## Environment Variables

This site has no required environment variables. If you add them in the future:

1. Vercel dashboard → **Settings → Environment Variables**
2. Add each key/value pair
3. Redeploy

---

## Manual Steps Required

- [ ] Add your custom domain (`zyteksolutions.com`) in Vercel dashboard
- [ ] Upload a real `og-image.png` (1200×630px) to `dist/public/`
- [ ] Update the meta description in `dist/public/index.html` if needed
