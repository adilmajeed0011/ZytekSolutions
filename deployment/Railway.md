# Deploying Zytek Solutions on Railway

Railway runs the Node.js `server.js` to serve the static site. It auto-detects the `package.json` start command.

---

## Prerequisites

- A [Railway account](https://railway.app) (free trial or paid)
- Code pushed to a GitHub repository

---

## Step 1 — Create a new project

1. Go to [railway.app/new](https://railway.app/new)
2. Click **Deploy from GitHub repo**
3. Select your repository

---

## Step 2 — Configure the service

Railway reads from the root of the repository. If your project is in a monorepo at `artifacts/zytek-solutions/`, set the **Root Directory**:

Railway dashboard → your service → **Settings → Source → Root Directory**:
```
artifacts/zytek-solutions
```

---

## Step 3 — Set up package.json

Railway uses `package.json` to detect the start command. Before deploying, ensure `package.server.json` is available as `package.json`:

In the project root (for Railway only), create/use `package.json` that points to `server.js`:

```json
{
  "name": "zytek-solutions",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "engines": { "node": ">=18" },
  "dependencies": {
    "compression": "^1.7.4",
    "express": "^4.18.2"
  }
}
```

---

## Step 4 — Environment variables

Railway dashboard → your service → **Variables**:

```
NODE_ENV=production
PORT=3000
```

> Railway automatically injects `PORT`. You can set a specific one or let Railway assign it.

---

## Step 5 — Deploy

Click **Deploy** or push a commit. Railway builds and starts automatically.

Your service gets a `*.railway.app` URL immediately.

---

## Custom Domain

Railway dashboard → your service → **Settings → Networking → Custom Domain**:
1. Add `zyteksolutions.com`
2. Update DNS: add a `CNAME` pointing to your Railway service URL
3. Railway provisions SSL automatically

---

## Manual Steps Required

- [ ] Set root directory to `artifacts/zytek-solutions` if monorepo
- [ ] Add `NODE_ENV=production` in Railway environment variables
- [ ] Add custom domain and update DNS
- [ ] Upload `og-image.png` (1200×630px) to `dist/public/`
