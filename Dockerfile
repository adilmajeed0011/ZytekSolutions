# ── Stage 1: Serve ────────────────────────────────────────────────────────────
# Uses a minimal Node.js Alpine image to serve the pre-built static files.
# The build is already compiled — no build step is needed here.

FROM node:20-alpine

LABEL maintainer="Zytek Solutions <info@zyteksolutions.com>"
LABEL description="Zytek Solutions website — production static server"

# Create non-root user for security
RUN addgroup -S zytek && adduser -S zytek -G zytek

WORKDIR /app

# Copy server dependencies
COPY package.server.json ./package.json

# Install only production dependencies
RUN npm install --production --ignore-scripts

# Copy the pre-built static files
COPY dist/public ./dist/public

# Copy the server entry point
COPY server.js ./

# Correct ownership
RUN chown -R zytek:zytek /app

USER zytek

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/ | grep -q "Zytek" || exit 1

CMD ["node", "server.js"]
