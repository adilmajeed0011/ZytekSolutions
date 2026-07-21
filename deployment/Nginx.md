# Deploying Zytek Solutions on Nginx

This guide covers serving the pre-built static SPA directly with Nginx — ideal for VPS, dedicated servers, and custom Docker setups where you want Nginx to serve files directly without a Node.js process.

---

## Prerequisites

- Ubuntu 20.04 / 22.04 LTS (or any Debian-based system)
- Nginx 1.18+
- Domain DNS pointing to the server IP
- Let's Encrypt / Certbot for SSL

---

## Step 1 — Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## Step 2 — Upload the build

```bash
# Create the web root
sudo mkdir -p /var/www/zytek-solutions

# Upload from your local machine
scp -r dist/public/* user@your-server-ip:/var/www/zytek-solutions/

# Set correct ownership
sudo chown -R www-data:www-data /var/www/zytek-solutions
sudo chmod -R 755 /var/www/zytek-solutions
```

---

## Step 3 — Copy the Nginx config

```bash
# Copy the provided config
sudo cp nginx.conf /etc/nginx/sites-available/zyteksolutions

# Edit it to set the correct root and domain
sudo nano /etc/nginx/sites-available/zyteksolutions
```

Update these two lines:
```nginx
server_name zyteksolutions.com www.zyteksolutions.com;
root /var/www/zytek-solutions;
```

---

## Step 4 — Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/zyteksolutions /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   # remove default placeholder

# Test config
sudo nginx -t

# Apply
sudo systemctl reload nginx
```

---

## Step 5 — SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d zyteksolutions.com -d www.zyteksolutions.com
```

Certbot modifies your Nginx config to add SSL automatically. Verify auto-renewal:

```bash
sudo certbot renew --dry-run
```

---

## Step 6 — Verify

```bash
# Test that security headers are present
curl -I https://zyteksolutions.com

# Look for:
# Strict-Transport-Security: max-age=31536000...
# Content-Security-Policy: default-src 'self'...
# X-Frame-Options: DENY
```

---

## Nginx Config Reference

The full `nginx.conf` included in the project root provides:

| Feature | Config |
|---------|--------|
| HTTP → HTTPS redirect | ✅ Port 80 server block |
| TLS 1.2 / 1.3 only | ✅ `ssl_protocols TLSv1.2 TLSv1.3` |
| HSTS + preload | ✅ `Strict-Transport-Security` header |
| Content Security Policy | ✅ Full CSP header |
| Clickjacking protection | ✅ `X-Frame-Options: DENY` |
| Hashed asset caching | ✅ `/assets/` → 1-year immutable cache |
| Gzip compression | ✅ `gzip on` |
| SPA fallback | ✅ `try_files $uri $uri/ /index.html` |
| Server version hiding | ✅ `server_tokens off` |
| Rate limiting | ✅ 30 req/s per IP, burst 60 |
| Dotfiles blocked | ✅ `location ~ /\.` → `deny all` |
| Backup files blocked | ✅ `.bak`, `.sql`, `.conf` → `deny all` |
| OCSP stapling | ✅ Enabled |

---

## Build Commands (for rebuilding)

```bash
# Install dependencies (requires Node.js 18+ and pnpm)
pnpm install

# Build
pnpm --filter @workspace/zytek-solutions run build

# Output: dist/public/

# Re-deploy after build
sudo cp -r dist/public/* /var/www/zytek-solutions/
```

---

## Useful Nginx Commands

```bash
sudo nginx -t                      # Test config syntax
sudo systemctl reload nginx        # Apply config changes
sudo systemctl restart nginx       # Full restart
sudo tail -f /var/log/nginx/error.log   # Error logs
sudo tail -f /var/log/nginx/access.log  # Access logs
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 502 Bad Gateway | Nginx is running but upstream (if proxying Node.js) is down |
| 404 on page refresh | Add `try_files $uri $uri/ /index.html` in `location /` block |
| Mixed content warnings | Ensure `upgrade-insecure-requests` is in CSP; check for hardcoded `http://` URLs |
| Fonts blocked by CSP | Add the font CDN to `font-src` in `nginx.conf` |
| Permission denied | `sudo chown -R www-data:www-data /var/www/zytek-solutions` |
| Rate limit too aggressive | Increase `max=` in `limit_req_zone` or raise `burst=` in `limit_req` |
