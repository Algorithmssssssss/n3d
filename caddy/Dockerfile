# Builds the storefront and the admin panel, then bakes both into a Caddy image that
# also proxies /api and /uploads to the backend. Build context is the project root
# (see docker-compose.yml).

# ---- Storefront (React) ----
FROM node:22-alpine AS storefront
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# The apps call a same-origin "/api", so nothing in the build depends on the public
# domain: the same image works behind any hostname or tunnel, no rebuild needed.
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# ---- Admin panel (React, served under /admin) ----
FROM node:22-alpine AS admin
WORKDIR /app
COPY admin/package*.json ./
RUN npm ci
COPY admin/ ./
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# ---- Caddy ----
FROM caddy:2-alpine
COPY caddy/Caddyfile /etc/caddy/Caddyfile
# Fail the image build (not the first request) if the Caddyfile is invalid
RUN caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
COPY --from=storefront /app/build /srv/storefront
COPY --from=admin /app/build /srv/admin

EXPOSE 80
