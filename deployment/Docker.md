# Deploying Zytek Solutions with Docker

The included `Dockerfile` creates a minimal, secure Node.js container that serves the pre-built static site.

---

## Files Included

| File | Purpose |
|------|---------|
| `Dockerfile` | Single-stage build, Alpine Node.js base |
| `docker-compose.yml` | Full stack with optional Nginx reverse proxy |
| `nginx.conf` | Nginx config for SSL termination |

---

## Quick Start

```bash
# 1. Build the Docker image
cd artifacts/zytek-solutions
docker build -t zytek-solutions .

# 2. Run the container
docker run -d \
  --name zytek-solutions \
  -p 3000:3000 \
  -e NODE_ENV=production \
  zytek-solutions

# 3. Visit http://localhost:3000
```

---

## Docker Compose (with Nginx)

For production with SSL:

```bash
cd artifacts/zytek-solutions

# Start the full stack (Node.js server + Nginx)
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

The compose stack exposes:
- Port 80 → HTTP (redirects to HTTPS)
- Port 443 → HTTPS (via Nginx)
- Port 3000 → Node.js (internal only, not exposed)

---

## Environment Variables

Pass environment variables to the container:

```bash
docker run -d \
  --name zytek-solutions \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  zytek-solutions
```

Or via an `.env` file:

```bash
docker run --env-file .env -p 3000:3000 zytek-solutions
```

---

## SSL with Docker Compose

1. Obtain an SSL certificate on the **host machine** first:
   ```bash
   sudo certbot certonly --standalone -d zyteksolutions.com
   ```

2. The `docker-compose.yml` mounts `/etc/letsencrypt` into the Nginx container — certificates are read automatically.

3. Ensure `nginx.conf` has the correct paths:
   ```nginx
   ssl_certificate /etc/letsencrypt/live/zyteksolutions.com/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/zyteksolutions.com/privkey.pem;
   ```

---

## Deploy to a VPS with Docker

```bash
# 1. SSH into your VPS
ssh user@your-server-ip

# 2. Install Docker
curl -fsSL https://get.docker.com | sh

# 3. Upload project files
scp -r artifacts/zytek-solutions/ user@your-server-ip:/home/user/zytek-solutions

# 4. Build and start
cd /home/user/zytek-solutions
docker compose up -d --build
```

---

## Deploy to Docker Hub / Registry

```bash
# Build and tag
docker build -t yourdockerhubusername/zytek-solutions:latest .

# Push
docker push yourdockerhubusername/zytek-solutions:latest

# Pull and run on server
docker pull yourdockerhubusername/zytek-solutions:latest
docker run -d -p 3000:3000 yourdockerhubusername/zytek-solutions:latest
```

---

## Manual Steps Required

- [ ] Obtain SSL certificate (`certbot`) before starting compose stack with Nginx
- [ ] Update `nginx.conf` with correct domain and certificate paths
- [ ] Upload `og-image.png` (1200×630px) to `dist/public/` before building the image
- [ ] Set secure environment variables (never hardcode in Dockerfile)
