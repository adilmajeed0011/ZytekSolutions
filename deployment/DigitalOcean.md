# Deploying Zytek Solutions on DigitalOcean

This guide covers three DigitalOcean deployment options: Droplet (Ubuntu VPS), App Platform (PaaS), and Spaces + CDN (pure static hosting).

---

## Option A — App Platform (Easiest — Static Site)

DigitalOcean App Platform can serve the compiled `dist/public/` directly with zero server management.

### Step 1 — Push to GitHub

Push your project to a GitHub repository. App Platform deploys from Git.

### Step 2 — Create a new App

1. Go to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
2. Click **Create App → GitHub**
3. Authorize DigitalOcean and select your repository

### Step 3 — Configure the App

| Field | Value |
|-------|-------|
| Type | **Static Site** |
| Build Command | `pnpm install && pnpm --filter @workspace/zytek-solutions run build` |
| Output Directory | `artifacts/zytek-solutions/dist/public` |
| HTTP Routes | `/*` → index.html (enable **Catchall route** for SPA) |

### Step 4 — Add environment variables (if needed)

In **Settings → Environment Variables**, add:
```
NODE_ENV=production
```

### Step 5 — Attach custom domain

1. Go to **Settings → Domains**
2. Add `zyteksolutions.com` and `www.zyteksolutions.com`
3. Update your DNS: point A record to the IP shown, or use CNAME

App Platform provisions SSL automatically via Let's Encrypt.

### Step 6 — Deploy

Click **Deploy** — builds take 2–5 minutes. Every push to `main` auto-deploys.

---

## Option B — Droplet (Ubuntu VPS)

See [`VPS-Ubuntu.md`](./VPS-Ubuntu.md) — the complete Ubuntu VPS guide applies to DigitalOcean Droplets without modification.

**Quick Droplet setup:**

```bash
# Create Droplet: Ubuntu 22.04 LTS, Basic, $6/mo (1GB RAM, 1 vCPU)
# Select your SSH key during creation
# Point your domain's A record to the Droplet IP
# Then follow VPS-Ubuntu.md
```

**Recommended Droplet size:** Basic $6/mo (1 GB RAM / 1 vCPU) is sufficient for a static site.

---

## Option C — Spaces (Object Storage) + CDN

For maximum performance with a globally distributed CDN and no server to manage:

### Step 1 — Create a Space

1. Go to **Spaces** → **Create Space**
2. Choose a datacenter region
3. Enable **CDN** on the Space

### Step 2 — Upload static files

```bash
# Install s3cmd
sudo apt install s3cmd -y
s3cmd --configure   # enter your DigitalOcean Spaces access key + secret

# Upload dist/public/ to your Space
s3cmd sync dist/public/ s3://your-space-name/ \
  --acl-public \
  --delete-removed \
  --add-header="Cache-Control:public, max-age=31536000, immutable" \
  --exclude="index.html" \
  --exclude="*.webmanifest" \
  --exclude="robots.txt" \
  --exclude="sitemap.xml"

# Upload HTML with no-cache
s3cmd put dist/public/index.html s3://your-space-name/index.html \
  --acl-public \
  --add-header="Cache-Control:public, max-age=0, must-revalidate" \
  --add-header="Content-Type:text/html"
```

### Step 3 — Configure SPA routing

In Space settings → **Website Endpoint**:
- Index document: `index.html`
- Error document: `index.html` (routes all 404s back to the SPA)

### Step 4 — Custom domain

Attach your custom domain in **Space → Settings → Custom Domain** and update DNS CNAME to the Spaces CDN endpoint.

---

## Environment Variables Summary

| Variable | Required | Value |
|----------|----------|-------|
| `NODE_ENV` | Yes | `production` |
| `PORT` | Only for Droplet (Node.js server) | `3000` |
| `CORS_ORIGIN` | Only for API server | `https://zyteksolutions.com` |

---

## Pricing Reference (as of 2024)

| Option | Monthly Cost |
|--------|-------------|
| App Platform — Static Site | Free (3 static sites free) |
| Droplet — Basic 1 GB | $6/mo |
| Spaces — 250 GB storage + CDN | $5/mo |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| SPA routes 404 on App Platform | Enable **Catchall Route** in App Platform routes |
| Build fails | Check build command and output directory in App settings |
| CDN not updating | Purge CDN cache in Spaces dashboard after re-upload |
| SSL not provisioning | Ensure DNS record is fully propagated before adding domain |
