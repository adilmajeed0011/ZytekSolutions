# Deploying Zytek Solutions on Render

Render supports both **Static Sites** (free) and **Web Services** (Node.js). The static site option is recommended.

---

## Option A — Static Site (Free tier, recommended)

### Step 1 — Connect your repo

1. Push the project to GitHub
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New → Static Site**
3. Select your repository

### Step 2 — Configure the build

| Setting | Value |
|---------|-------|
| **Name** | `zytek-solutions` |
| **Branch** | `main` |
| **Root Directory** | `artifacts/zytek-solutions` *(if monorepo)* |
| **Build Command** | *(leave empty — already built)* |
| **Publish Directory** | `dist/public` |

### Step 3 — Add redirect rule

In Render dashboard → **Redirects/Rewrites**:

| Source | Destination | Action |
|--------|-------------|--------|
| `/*` | `/index.html` | Rewrite |

This is the SPA fallback rule.

### Step 4 — Deploy

Click **Create Static Site**. Render deploys and provides a `*.onrender.com` URL.

---

## Option B — Node.js Web Service

### Step 1 — Connect your repo and choose Web Service

In Render → **New → Web Service** → connect your repo.

### Step 2 — Configure

| Setting | Value |
|---------|-------|
| **Runtime** | Node |
| **Root Directory** | `artifacts/zytek-solutions` |
| **Build Command** | `cp package.server.json package.json && npm install --production` |
| **Start Command** | `node server.js` |

### Step 3 — Environment variables

In Render → **Environment**:

```
NODE_ENV=production
PORT=10000
```

> Render automatically sets `PORT`; you don't need to set it manually.

---

## Custom Domain

Render dashboard → your site → **Settings → Custom Domains**:
1. Add `zyteksolutions.com`
2. Add a `CNAME` record at your DNS: `www` → `<your-service>.onrender.com`
3. For apex domain, use Render's provided IPs or redirect `www` from your registrar
4. SSL is provisioned automatically

---

## Manual Steps Required

- [ ] Push code to GitHub and connect to Render
- [ ] Add SPA redirect rule (`/*` → `/index.html`)
- [ ] Add custom domain
- [ ] Upload `og-image.png` (1200×630px) to `dist/public/`
