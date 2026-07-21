# Deploying Zytek Solutions on Hostinger

Hostinger supports two deployment modes for this site:

- **Static Hosting** — upload `dist/public/` directly (simplest)
- **Node.js Hosting** — run `server.js` for more control over caching and headers

---

## Option A — Static File Upload (Recommended for Hostinger Basic/Premium)

### Step 1 — Prepare files

Your deployment folder is `dist/public/`. It contains:
```
index.html
favicon.svg
site.webmanifest
robots.txt
sitemap.xml
assets/
  index-*.js
  index-*.css
```

### Step 2 — Upload via File Manager

1. Log into **hPanel** → File Manager
2. Navigate to `public_html/`
3. Delete any existing `index.html` or placeholder files
4. Upload **all contents** of `dist/public/` into `public_html/`
   - Do NOT upload the folder itself — upload the files inside it

### Step 3 — Configure SPA routing

Since this is a Single Page Application (SPA), all routes must redirect to `index.html`. Create/update `.htaccess` in `public_html/`:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ /index.html [L]

# Security headers
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Long-lived cache for hashed assets
<FilesMatch "^.*\.(js|css)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

# No cache for HTML
<FilesMatch "\.html$">
  Header set Cache-Control "public, max-age=0, must-revalidate"
</FilesMatch>

# Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>
```

### Step 4 — SSL

In hPanel → **SSL** → enable **Free SSL (Let's Encrypt)** for your domain.

---

## Option B — Node.js Hosting (Hostinger VPS or Node.js plan)

### Requirements

- Hostinger VPS or Business/Cloud plan with Node.js support
- Node.js 18+
- SSH access

### Step 1 — Upload files

Upload the following to your server (e.g., `/home/user/zytek-solutions/`):
```
dist/public/     ← compiled site
server.js
package.server.json  (rename to package.json on upload)
.env
```

### Step 2 — Install dependencies

```bash
cd /home/user/zytek-solutions
npm install --production
```

### Step 3 — Configure environment

```bash
cp .env.example .env
nano .env
# Set PORT=3000, NODE_ENV=production
```

### Step 4 — Configure Hostinger Node.js

In hPanel → **Node.js**:
- **Application root:** `/home/user/zytek-solutions`
- **Application URL:** your domain
- **Application startup file:** `server.js`
- **Node.js version:** 20.x

Click **Create** / **Restart**.

---

## Custom Domain

hPanel → **Domains** → set the primary domain or add `zyteksolutions.com` as an addon domain pointing to `public_html/`.

---

## Manual Steps Required

- [ ] Upload all `dist/public/` contents to `public_html/`
- [ ] Create `.htaccess` with SPA routing rules (Option A)
- [ ] Enable Free SSL in hPanel
- [ ] Upload `og-image.png` (1200×630px) to `public_html/`
