# Deploying Zytek Solutions on Ubuntu VPS

This guide covers a production-grade deployment on Ubuntu 22.04 LTS using Nginx as a reverse proxy, PM2 as the process manager, and Let's Encrypt for SSL.

> **Note:** This guide covers two approaches:
> - **Option A** — Nginx serves static files directly (recommended, no Node.js needed at runtime)
> - **Option B** — Node.js + Express (`server.js`) behind Nginx reverse proxy (for platforms that need Node.js)

---

## Server Requirements

- Ubuntu 20.04 or 22.04 LTS
- 1 GB RAM minimum (512 MB works for static serving)
- Root or sudo access
- Domain DNS pointing to the server IP

---

## Step 1 — Initial Server Setup

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Create a deploy user (optional but recommended)
sudo adduser zytek
sudo usermod -aG sudo zytek
su - zytek
```

---

## Step 2 — Install Node.js 20 (required for Option B; optional for Option A)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # v20.x.x
npm --version
```

---

## Step 3 — Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## Option A — Nginx Serves Static Files Directly

### Upload the build

```bash
sudo mkdir -p /var/www/zyteksolutions

# From your local machine:
scp -r dist/public/* user@your-server-ip:/var/www/zyteksolutions/

sudo chown -R www-data:www-data /var/www/zyteksolutions
sudo chmod -R 755 /var/www/zyteksolutions
```

### Configure Nginx

```bash
sudo cp nginx.conf /etc/nginx/sites-available/zyteksolutions
sudo nano /etc/nginx/sites-available/zyteksolutions
# Update: root /var/www/zyteksolutions;
# Update: server_name zyteksolutions.com www.zyteksolutions.com;

sudo ln -s /etc/nginx/sites-available/zyteksolutions /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

---

## Option B — Node.js Express Server with Nginx Reverse Proxy

### Upload project files

```bash
sudo mkdir -p /var/www/zyteksolutions
cd /var/www/zyteksolutions

# Upload from local machine
scp server.js package.server.json ecosystem.config.cjs .env.example user@your-server-ip:/var/www/zyteksolutions/
scp -r dist/ user@your-server-ip:/var/www/zyteksolutions/

# Rename package.server.json → package.json
cp package.server.json package.json
```

### Install production dependencies

```bash
cd /var/www/zyteksolutions
npm install --omit=dev
```

### Set up environment

```bash
cp .env.example .env
nano .env
```

Set:
```env
NODE_ENV=production
PORT=3000
```

### Install PM2 and start the server

```bash
sudo npm install -g pm2

# Start with PM2 cluster mode
pm2 start ecosystem.config.cjs --env production

# Save PM2 process list and auto-start on reboot
pm2 save
pm2 startup
# Run the command it outputs (e.g. sudo env PATH=... pm2 startup ...)
```

### Configure Nginx as reverse proxy

```bash
sudo nano /etc/nginx/sites-available/zyteksolutions
```

```nginx
server {
    listen 80;
    server_name zyteksolutions.com www.zyteksolutions.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name zyteksolutions.com www.zyteksolutions.com;

    ssl_certificate     /etc/letsencrypt/live/zyteksolutions.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zyteksolutions.com/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/zyteksolutions /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Step 4 — SSL with Let's Encrypt (both options)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d zyteksolutions.com -d www.zyteksolutions.com
sudo certbot renew --dry-run   # verify auto-renewal
```

---

## Step 5 — Firewall

```bash
sudo ufw status
# Should show:
# Nginx Full   ALLOW
# OpenSSH      ALLOW
```

---

## Maintenance

```bash
# View Node.js server logs (Option B)
pm2 logs zytek-solutions
pm2 monit

# Restart after update
pm2 reload zytek-solutions

# Update static files (Option A)
sudo cp -r dist/public/* /var/www/zyteksolutions/
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 502 Bad Gateway | Node.js process not running — `pm2 restart zytek-solutions` |
| 404 on page refresh | SPA fallback not configured — check `try_files` or Express wildcard route |
| SSL renewal fails | Run `sudo certbot renew` manually; check DNS |
| Port 3000 in use | Change `PORT` in `.env` |
| Permission denied | `sudo chown -R zytek:zytek /var/www/zyteksolutions` |
