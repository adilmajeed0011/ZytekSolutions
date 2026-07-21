# Pre-Deployment Checklist — Zytek Solutions

Use this checklist before going live on any hosting platform.

---

## ✅ Build & Files

- [ ] Run `pnpm --filter @workspace/zytek-solutions run build` and confirm it completes with no errors
- [ ] Verify `dist/public/index.html` exists and references the correct asset paths
- [ ] Confirm `dist/public/assets/` contains the compiled JS and CSS bundles
- [ ] Create and place `dist/public/og-image.png` (1200×630px) — used by social sharing previews
- [ ] Verify `dist/public/robots.txt` has the correct `Sitemap:` URL pointing to your live domain
- [ ] Update `dist/public/sitemap.xml` — replace `https://zyteksolutions.com` with your actual domain if different

---

## ✅ Environment Variables

- [ ] Set `NODE_ENV=production` on your hosting platform
- [ ] Set `PORT` to the correct value for your platform (Render/Railway set this automatically)
- [ ] Set `CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com` for the API server
- [ ] Never commit `.env` to version control (confirm `.gitignore` includes `.env`)

---

## ✅ Domain & DNS

- [ ] Point A record (or CNAME) to your host's IP / endpoint
- [ ] Add both `yourdomain.com` and `www.yourdomain.com` to DNS
- [ ] Wait for DNS propagation (up to 48 hours; usually 15–30 minutes)

---

## ✅ SSL / HTTPS

- [ ] SSL certificate is provisioned and valid
- [ ] `https://yourdomain.com` loads without browser warnings
- [ ] `http://yourdomain.com` redirects to `https://`
- [ ] `https://www.yourdomain.com` redirects to `https://yourdomain.com` (or vice versa — pick one canonical)

---

## ✅ SPA Routing

- [ ] Navigate to the homepage → works
- [ ] Navigate to a deep route (e.g. `/services`) → works
- [ ] Hard-refresh a deep route → no 404 error
- [ ] Type a non-existent route → app handles it gracefully (custom 404 or redirects home)

---

## ✅ Performance

- [ ] Run [PageSpeed Insights](https://pagespeed.web.dev/) on the live URL — target 90+ scores
- [ ] Check that `/assets/` files are served with `Cache-Control: max-age=31536000, immutable`
- [ ] Check that `index.html` is served with `Cache-Control: max-age=0, must-revalidate`
- [ ] Verify Gzip/Brotli compression is active (`curl -H "Accept-Encoding: gzip" -I https://yourdomain.com` → look for `Content-Encoding: gzip`)

---

## ✅ Security Headers

Run your domain through [securityheaders.com](https://securityheaders.com) and confirm all of the following are present:

- [ ] `Strict-Transport-Security` — HSTS with `max-age=31536000`
- [ ] `Content-Security-Policy` — CSP present and correct
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` — camera, mic, geolocation disabled
- [ ] `Cross-Origin-Opener-Policy: same-origin`
- [ ] `X-Powered-By` header is **absent**
- [ ] `Server` header does not reveal version details

Target: **Grade A or A+** on securityheaders.com.

---

## ✅ SEO

- [ ] `<title>` tag is set correctly in `index.html`
- [ ] `<meta name="description">` is present and accurate
- [ ] Canonical URL tag is set to the live domain
- [ ] OG tags (`og:title`, `og:description`, `og:image`, `og:url`) are present
- [ ] Twitter card meta tags are present
- [ ] `og-image.png` is uploaded and accessible at `https://yourdomain.com/og-image.png`
- [ ] Test OG tags with [Meta Tags debugger](https://metatags.io/) or [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [ ] Submit sitemap to [Google Search Console](https://search.google.com/search-console/): `https://yourdomain.com/sitemap.xml`
- [ ] Submit sitemap to [Bing Webmaster Tools](https://www.bing.com/webmasters)

---

## ✅ Functionality

- [ ] All navigation links work correctly
- [ ] All images load (no broken images)
- [ ] All fonts load correctly
- [ ] WhatsApp chat button opens the correct WhatsApp number
- [ ] Contact form (if present) submits without errors
- [ ] No JavaScript errors in browser console (F12 → Console)
- [ ] No failed network requests in browser console (F12 → Network)

---

## ✅ Cross-Browser & Responsive

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)
- [ ] Tablet viewport (768px)
- [ ] Desktop viewport (1280px+)

---

## ✅ Post-Deployment (Optional but Recommended)

- [ ] Set up uptime monitoring ([UptimeRobot](https://uptimerobot.com/) — free tier available)
- [ ] Set up Google Analytics or a privacy-friendly alternative (Plausible, Fathom)
- [ ] Submit domain to [HSTS Preload List](https://hstspreload.org/) (irreversible — do after confirming everything works)
- [ ] Enable Cloudflare proxy for DDoS protection and CDN acceleration (free plan available)
- [ ] Schedule a quarterly dependency review: `cd artifacts/zytek-solutions && npm audit`
