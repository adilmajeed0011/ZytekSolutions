# Deploying Zytek Solutions on Apache (cPanel / Shared Hosting / VPS)

This guide covers deploying the pre-built static SPA on Apache — including cPanel shared hosting, WHM VPS, and standalone Apache on Ubuntu/Debian.

---

## Prerequisites

- Apache 2.4+
- `mod_rewrite` enabled
- `mod_headers` enabled (for security headers)
- `mod_expires` enabled (for caching)
- SSL certificate (Let's Encrypt or cPanel AutoSSL)

---

## Option A — cPanel / Shared Hosting (File Manager)

### Step 1 — Upload files

1. Log in to **cPanel → File Manager**
2. Navigate to `public_html/` (or the subdomain folder you want to use)
3. Delete any existing `index.html` placeholder
4. Upload the contents of `dist/public/` (not the folder itself — its contents):
   - `index.html`
   - `site.webmanifest`
   - `robots.txt`
   - `sitemap.xml`
   - `favicon.svg`
   - `assets/` folder
5. Upload `.htaccess` to the same root directory

> **Using ZIP:** You can zip the contents of `dist/public/` and upload the zip, then extract it in File Manager.

### Step 2 — Enable SSL

In cPanel:
1. Go to **SSL/TLS → AutoSSL**
2. Click **Run AutoSSL** (free Let's Encrypt certificate)
3. Wait 1–5 minutes for the certificate to provision

### Step 3 — Force HTTPS

The `.htaccess` file already includes the HTTP → HTTPS redirect. If it doesn't apply immediately, clear your browser cache.

### Step 4 — Verify

Visit `https://yourdomain.com` and test a deep route like `https://yourdomain.com/about` — it should load correctly (SPA routing via `.htaccess`).

---

## Option B — Apache VirtualHost on Ubuntu/Debian VPS

### Step 1 — Install Apache

```bash
sudo apt update
sudo apt install apache2 -y

# Enable required modules
sudo a2enmod rewrite headers expires deflate ssl
sudo systemctl restart apache2
```

### Step 2 — Upload the build

```bash
# Create the web root
sudo mkdir -p /var/www/zyteksolutions/public_html

# Upload from local machine
scp -r dist/public/* user@your-server-ip:/var/www/zyteksolutions/public_html/
scp .htaccess user@your-server-ip:/var/www/zyteksolutions/public_html/

# Set ownership
sudo chown -R www-data:www-data /var/www/zyteksolutions/public_html
sudo chmod -R 755 /var/www/zyteksolutions/public_html
```

### Step 3 — Create VirtualHost config

```bash
sudo nano /etc/apache2/sites-available/zyteksolutions.conf
```

Paste:

```apache
<VirtualHost *:80>
    ServerName zyteksolutions.com
    ServerAlias www.zyteksolutions.com
    DocumentRoot /var/www/zyteksolutions/public_html

    # Redirect HTTP → HTTPS
    Redirect permanent / https://zyteksolutions.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName zyteksolutions.com
    ServerAlias www.zyteksolutions.com
    DocumentRoot /var/www/zyteksolutions/public_html

    SSLEngine on
    SSLCertificateFile    /etc/letsencrypt/live/zyteksolutions.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/zyteksolutions.com/privkey.pem

    <Directory /var/www/zyteksolutions/public_html>
        AllowOverride All
        Require all granted
        Options -Indexes
    </Directory>

    ErrorLog  ${APACHE_LOG_DIR}/zytek-error.log
    CustomLog ${APACHE_LOG_DIR}/zytek-access.log combined
</VirtualHost>
```

### Step 4 — Enable the site

```bash
sudo a2ensite zyteksolutions.conf
sudo a2dissite 000-default.conf   # disable default site
sudo systemctl reload apache2
```

### Step 5 — SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-apache -y
sudo certbot --apache -d zyteksolutions.com -d www.zyteksolutions.com
```

Certbot auto-renews. Verify renewal:

```bash
sudo certbot renew --dry-run
```

---

## Environment Variables

The static SPA has no runtime environment variables. All configuration is baked into the compiled `dist/public/` bundle at build time.

---

## Build Commands (for rebuilding)

```bash
# Install dependencies
pnpm install

# Build the production bundle
pnpm --filter @workspace/zytek-solutions run build

# Output is in: dist/public/
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Refreshing a route returns 404 | `mod_rewrite` not active | Run `sudo a2enmod rewrite && sudo systemctl restart apache2` |
| Security headers not showing | `mod_headers` not active | Run `sudo a2enmod headers && sudo systemctl restart apache2` |
| Assets return 403 | Permissions | `sudo chmod -R 755 /var/www/.../public_html` |
| `.htaccess` not loading | `AllowOverride None` in VirtualHost | Change to `AllowOverride All` and reload Apache |
| HTTPS redirect loop | SSL not yet provisioned | Wait for AutoSSL or Certbot to complete |
| Fonts / styles not loading | CSP too strict | Add the external domain to `style-src`/`font-src` in `.htaccess` headers |
