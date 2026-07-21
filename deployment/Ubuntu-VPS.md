# Deploying Zytek Solutions on Ubuntu VPS

This guide covers a production-grade deployment on Ubuntu 22.04 LTS using Nginx as a reverse proxy, PM2 as the process manager, and Let's Encrypt for SSL.

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

## Step 2 — Install Node.js 20

```bash
# Install via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v   # v20.x.x
npm -v
```

---

## Step 3 — Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## Step 4 — Upload the Project

From your local machine:

```bash
# Create target directory on server
ssh zytek@your-server-ip "mkdir -p /var/www/zytek-solutions"

# Upload the compiled site and server files
scp -r artifacts/zytek-solutions/dist         zytek@your-server-ip:/var/www/zytek-solutions/
scp    artifacts/zytek-solutions/server.js     zytek@your-server-ip:/var/www/zytek-solutions/
scp    artifacts/zytek-solutions/package.server.json zytek@your-server-ip:/var/www/zytek-solutions/package.json
scp    artifacts/zytek-solutions/.env.example  zytek@your-server-ip:/var/www/zytek-solutions/.env.example
```

---

## Step 5 — Install Dependencies & Configure Environment

```bash
ssh zytek@your-server-ip

cd /var/www/zytek-solutions
npm install --production

cp .env.example .env
nano .env
# Set: NODE_ENV=production, PORT=3000
```

---

## Step 6 — Install and Configure PM2

```bash
sudo npm install -g pm2

# Copy the PM2 config
scp artifacts/zytek-solutions/ecosystem.config.cjs zytek@your-server-ip:/var/www/zytek-solutions/

# Start with PM2
cd /var/www/zytek-solutions
pm2 start ecosystem.config.cjs --env production

# Save process list and enable startup
pm2 save
pm2 startup

# Follow the command PM2 outputs (run it as root)
```

### PM2 Commands Reference

```bash
pm2 list                          # List all processes
pm2 logs zytek-solutions          # View logs
pm2 restart zytek-solutions       # Restart
pm2 reload zytek-solutions        # Zero-downtime reload
pm2 stop zytek-solutions          # Stop
pm2 delete zytek-solutions        # Remove from PM2
```

---

## Step 7 — Configure Nginx

```bash
# Upload the Nginx config
scp artifacts/zytek-solutions/nginx.conf \
    zytek@your-server-ip:/etc/nginx/conf.d/zytek-solutions.conf
```

Or copy the contents manually:

```bash
sudo nano /etc/nginx/conf.d/zytek-solutions.conf
# Paste contents from nginx.conf in this project
```

**Important:** The initial Nginx config redirects to HTTPS. Before SSL is set up, temporarily use an HTTP-only config:

```nginx
server {
    listen 80;
    server_name zyteksolutions.com www.zyteksolutions.com;
    root /var/www/zytek-solutions/dist/public;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
```

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 8 — SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d zyteksolutions.com -d www.zyteksolutions.com

# Follow the prompts. Certbot auto-edits your Nginx config.

# Test auto-renewal
sudo certbot renew --dry-run
```

Auto-renewal is set up via a systemd timer by default. Verify:

```bash
sudo systemctl status certbot.timer
```

---

## Step 9 — Folder Permissions

```bash
sudo chown -R zytek:zytek /var/www/zytek-solutions
sudo chmod -R 755 /var/www/zytek-solutions/dist/public
sudo mkdir -p /var/log/zytek
sudo chown zytek:zytek /var/log/zytek
```

---

## Step 10 — Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # Ports 80 and 443
sudo ufw enable
sudo ufw status
```

---

## Updating the Site

When you receive a new build:

```bash
# Upload new dist/public files
scp -r dist/public/* zytek@your-server-ip:/var/www/zytek-solutions/dist/public/

# No server restart needed — Nginx serves files directly
# If server.js changed, reload PM2:
pm2 reload zytek-solutions
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Restart Node.js server | `pm2 restart zytek-solutions` |
| Reload Nginx | `sudo systemctl reload nginx` |
| View Node.js logs | `pm2 logs zytek-solutions` |
| View Nginx logs | `sudo tail -f /var/log/nginx/error.log` |
| Renew SSL | `sudo certbot renew` |
| Check Nginx config | `sudo nginx -t` |
| PM2 startup | `pm2 startup && pm2 save` |

---

## Manual Steps Required

- [ ] Point `zyteksolutions.com` DNS A record to your server IP
- [ ] Upload `og-image.png` (1200×630px) to `/var/www/zytek-solutions/dist/public/`
- [ ] Run `certbot` to obtain SSL certificate
- [ ] Update `nginx.conf` with correct domain name if different from `zyteksolutions.com`
- [ ] Set up a cron job for `pm2 save` after each config change
