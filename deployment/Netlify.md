# Deploying Zytek Solutions on Netlify

Netlify has first-class static site support with automatic SPA routing via the included `_redirects` file.

---

## Prerequisites

- A [Netlify account](https://app.netlify.com/signup) (free tier works)
- The `dist/public/` folder from this project

---

## Option A — Drag & Drop

1. Go to [app.netlify.com](https://app.netlify.com)
2. Drag the **`dist/public/`** folder onto the deploy zone
3. Netlify reads `_redirects` and `_headers` automatically
4. Your site is live instantly

---

## Option B — Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy from project root (artifacts/zytek-solutions/)
netlify deploy --prod --dir=dist/public
```

---

## Option C — Git Integration (Recommended)

1. Push the project to GitHub/GitLab
2. Netlify dashboard → **Add new site → Import an existing project**
3. Set build settings:
   - **Base directory:** `artifacts/zytek-solutions` *(if in a monorepo)*
   - **Build command:** *(leave empty — already built)*
   - **Publish directory:** `dist/public`
4. Click **Deploy site**

The `netlify.toml` in the project root handles everything automatically:
- SPA fallback routing
- Security headers
- Asset cache headers

---

## Custom Domain

1. Netlify dashboard → your site → **Domain settings**
2. Click **Add custom domain** → enter `zyteksolutions.com`
3. Update DNS at your registrar:
   - Add a `CNAME` record: `www` → `<your-site>.netlify.app`
   - For apex domain, use Netlify DNS or an `ALIAS`/`ANAME` record
4. Netlify provisions SSL automatically

---

## Forms (Optional)

If you add a contact form, Netlify has a built-in form handler. Add `netlify` attribute to your `<form>` tag.

---

## Manual Steps Required

- [ ] Add custom domain in Netlify dashboard
- [ ] Upload `og-image.png` (1200×630px) to `dist/public/`
- [ ] Verify the `_redirects` file is present in `dist/public/`
