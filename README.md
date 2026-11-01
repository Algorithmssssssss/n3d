# TextilePro - Full Stack Product Management System

A full-stack application for managing textile accessories products, built with React, Node.js, Express, MongoDB and Caddy.

## 🏗️ Architecture

One public address serves everything. [Caddy](https://caddyserver.com) sits in front and routes by path:

```
                          ┌──────────────────────────── docker compose ────────────────────────────┐
 Browser ── Cloudflare ── │  Caddy :80 ─┬─ /            → storefront (React build, static files)   │
            Tunnel        │  (only port │─ /admin/*     → admin panel (React build, static files)  │
                          │  published) │─ /api/*       → backend (Express) ── MongoDB             │
                          │             └─ /uploads/*   → backend (product images)                 │
                          └────────────────────────────────────────────────────────────────────────┘
```

```
fullstack/
├── backend/          # Node.js/Express API
├── frontend/         # Customer-facing React app  (served at /)
├── admin/            # Admin panel React app      (served at /admin)
├── caddy/            # Caddyfile + Dockerfile that builds both React apps into the Caddy image
├── docker-compose.yml
├── setup.sh          # generates .env with random secrets
└── .env.example
```

Because the apps talk to a same-origin `/api`, **nothing in the build depends on your domain**. The same images work on `localhost`, a LAN IP, or behind a Cloudflare Tunnel with no rebuild.

---

## 🚀 Deploy (3 commands)

Prerequisite: Docker with the Compose plugin.

```bash
./setup.sh you@example.com        # creates .env with random secrets and prints your admin login
docker compose up -d --build      # builds and starts everything (first build takes a few minutes)
```

Then open `http://localhost:8080` (store) and `http://localhost:8080/admin` (admin panel).

The admin account is created automatically on first start from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`. There is no manual seed step. Want demo products to look at first?

```bash
docker compose exec backend node seed.js     # loads sample data; does nothing if data already exists
```

### Expose it with a Cloudflare Tunnel

Cloudflare terminates HTTPS and forwards plain HTTP to Caddy, so the Caddyfile serves HTTP only (no certificates, no redirect loops). One public hostname covers the store, the admin panel and the API.

**Option A: cloudflared already runs on the host.** Add a public hostname in the Zero Trust dashboard (Networks → Tunnels → your tunnel) with service **`HTTP` → `localhost:8080`**. If cloudflared runs on the same machine you may also set `BIND_ADDRESS=127.0.0.1` in `.env` so the port isn't reachable from your LAN.

**Option B: run cloudflared inside this compose file.**

1. Create a tunnel in the Zero Trust dashboard and copy its token.
2. Add a public hostname pointing at service **`HTTP` → `caddy:80`**.
3. Put `TUNNEL_TOKEN=...` in `.env`, then:

```bash
docker compose --profile tunnel up -d
```

Either way, `https://your-hostname/` is the store, `/admin` is the admin panel.

### Deploy on Vercel instead

`vercel.json` deploys the repo as one Vercel project with three [services](https://vercel.com/docs/services), routed the same way Caddy does it:

| Path | Service | Runs as |
|---|---|---|
| `/api/*`, `/uploads/*` | `backend` | Express, as a Vercel Function (entrypoint `backend/app.js`) |
| `/admin/*` | `admin` | static React build (the `/admin` prefix is stripped when looking up files) |
| everything else | `frontend` | static React build |

Both React apps call the backend from the browser via the same-origin `/api`, so there are no service bindings. The database isn't part of the deployment: use MongoDB Atlas (or the Atlas integration in the Vercel Marketplace) and set these in the project's environment variables:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | same rules as below |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | first admin, created on the first API request when there are no users |

Test everything together locally with `vercel dev`.

> **Image uploads don't work on Vercel yet.** Functions can't keep files on disk and Vercel ignores `express.static`, so `/api/upload` and `/uploads/*` need object storage (e.g. Vercel Blob) first. Function request bodies are also capped at 4.5 MB.

---

## ⚙️ Configuration (`.env`)

| Variable | Required | Purpose |
|---|---|---|
| `JWT_SECRET` | yes | Signs login tokens. 32+ random chars (`setup.sh` generates it). The API refuses to start in production with a missing, short or placeholder value. |
| `MONGO_ROOT_PASSWORD` | yes | MongoDB password (any characters; wrap it in single quotes if it contains `$` or `#`). Only read the first time the database volume is created. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | first start | Creates the first admin when there are no users yet. Password needs 6+ characters. |
| `HTTP_PORT` | no | Published port, default `8080`. |
| `BIND_ADDRESS` | no | `0.0.0.0` (default, reachable on your LAN) or `127.0.0.1` (this machine only). |
| `TUNNEL_TOKEN` | no | For `--profile tunnel`. |

Only Caddy publishes a port. MongoDB and the API are reachable from inside the compose network only.

---

## 🔧 Operating it

```bash
docker compose logs -f              # all logs (access log is from caddy)
docker compose ps                   # status and health
docker compose up -d --build        # apply an update after `git pull`
docker compose down                 # stop (data is kept)
```

**Forgot the admin password?** The panel has no reset flow, so use:

```bash
docker compose exec backend node create-admin.js you@example.com 'a-new-password'
```

**Back up** (database + uploaded images):

```bash
docker compose exec -T mongodb sh -c 'mongodump --archive --gzip -u admin -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --db textilepro' > db-$(date +%F).archive.gz
tar czf uploads-$(date +%F).tgz backend/uploads
```

**Restore** the database:

```bash
docker compose exec -T mongodb sh -c 'mongorestore --archive --gzip --drop -u admin -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin' < db-YYYY-MM-DD.archive.gz
```

**Start over with demo data** (⚠️ deletes all users, categories and products):

```bash
docker compose exec backend node seed.js --reset
```

---

## 💻 Local development (without Docker)

```bash
# MongoDB, e.g.: docker run -d --name tp-mongo -p 127.0.0.1:27017:27017 mongo:6.0
cd backend && cp .env.example .env && npm install && npm run seed && npm run dev
cd frontend && npm install && npm start      # http://localhost:3000
cd admin && npm install && npm start         # http://localhost:3001/admin
```

The React dev servers proxy `/api` and `/uploads` to `http://localhost:5000` (the `proxy` field in each `package.json`), mirroring what Caddy does in production. `npm run seed` creates `admin@textilepro.com` / `admin123` **outside production only**.

> **macOS:** port 5000 is used by AirPlay Receiver. Either turn that off (System Settings → General → AirDrop & Handoff), or run the API on another port (`PORT=5001`) and add `REACT_APP_API_URL=http://localhost:5001/api` to `frontend/.env.local` and `admin/.env.local`.

---

## 🎯 Features

### Customer Store
- Product browsing with category, price and text search filters (shareable URLs)
- Product detail pages with image gallery and specifications
- Cost estimator on every product page: enter a quantity and see the estimated total (quantity × unit price), with a hint if it is below the minimum order
- Featured products, contact details and branding managed from the admin panel
- English and Khmer (ភាសាខ្មែរ) with an `EN | ខ្មែរ` switcher in the header
- Responsive design

### Admin Panel
- Dashboard with statistics
- Product CRUD, image upload, featured/active toggles (inactive products stay listed so they can be re-activated)
- Category management
- Company settings: name, logo, contact details, social links

### Backend API
- REST API with JWT authentication and role checks (admin / manager / editor)
- Image upload with type and size limits
- Login rate limiting, no public sign-up
- MongoDB with Mongoose

---

## 🌐 Languages & branding

**Company name, logo and the browser tab.** Everything comes from **Admin → Settings**: the header and footer, the browser tab title (`<page> | <company name>`) and the tab icon. The icon is your logo fitted onto a square (a square logo looks best); with no logo it's the first letter of the company name. The name and logo of the admin panel itself follow the same settings ("<company name> Admin"). Nothing is hard-coded.

**English / Khmer.** Visitors switch language with the `EN | ខ្មែរ` button in the header. The choice is remembered per browser; on a first visit the browser's language preferences decide (Khmer only if it comes before English in the list). The interface text lives in [`frontend/src/i18n/`](frontend/src/i18n): `en.js` and `km.js`, one line per text, so fixing a translation is a one-line edit. To add another language, add a file next to them and register it in `I18nContext.js`.

What is and isn't translated:

- **Translated:** all storefront interface text, the built-in default tagline and working hours (while you haven't changed them), order units (pieces, rolls, boxes, kg) and the page titles.
- **Shown exactly as you typed it:** product names and descriptions, category names, the company name, your own tagline, address and working hours. Enter those in whichever language you want visitors to see. (Per-language product and category text isn't supported yet.)
- **Admin panel:** English only, but it displays Khmer text you type into products correctly.

Numbers and prices always use Latin digits.

---

## 🛠️ API Endpoints

Roles: **admin** can do everything; **manager** can create/update products, categories and uploads; **editor** is read-only.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (rate limited) |
| GET | `/api/auth/me` | Current user (auth) |
| POST | `/api/auth/register` | Create a user (admin only; there is no public sign-up) |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List: `page`, `limit` (max 100), `category` (id or slug), `search`, `minPrice`, `maxPrice`, `sort`, `featured`, `ecoFriendly`; signed-in users may add `includeInactive=true` |
| GET | `/api/products/stats` | Dashboard counts (auth) |
| GET | `/api/products/:id` | One product by id or slug (inactive ones only for signed-in users) |
| POST | `/api/products` | Create (admin/manager) |
| PUT | `/api/products/:id` | Update (admin/manager) |
| PATCH | `/api/products/:id/toggle-featured` | Toggle featured (admin/manager) |
| DELETE | `/api/products/:id` | Delete (admin) |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List with live `productCount` (signed-in users may add `includeInactive=true`) |
| GET | `/api/categories/:id` | One category by id or slug |
| POST | `/api/categories` | Create (admin/manager) |
| PUT | `/api/categories/:id` | Update (admin/manager) |
| DELETE | `/api/categories/:id` | Delete, refused while it has products (admin) |

### Settings & uploads
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Company settings |
| PUT | `/api/settings` | Update settings (admin) |
| POST | `/api/upload` | Upload one image, jpeg/png/gif/webp, max 5MB (admin/manager) |
| POST | `/api/upload/multiple` | Upload up to 10 images (admin/manager) |
| DELETE | `/api/upload/:filename` | Delete an image (admin/manager) |
| GET | `/api/health` | Health check (503 if the database is down) |

---

## 🔒 Security notes

- Generate real secrets (`./setup.sh` does). Never commit `.env`.
- `POST /api/auth/login` is rate limited (10 failed attempts per 15 minutes per visitor IP). Caddy passes the real visitor IP (from `Cf-Connecting-Ip`) to the API.
- For extra protection, put `your-hostname/admin` behind [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/), and consider a Cloudflare rate-limiting rule for `/api/auth/login`. (Access on `/admin` only guards the panel UI; the public API must stay reachable for the store.)
- Enable HSTS at Cloudflare (SSL/TLS → Edge Certificates); Caddy doesn't set it because it only sees plain HTTP.

---

## 📝 Troubleshooting

**Cloudflare shows 502 / 1033.** The tunnel can't reach Caddy. Check the public hostname's service is `HTTP` → `localhost:8080` (host cloudflared) or `caddy:80` (compose cloudflared), and that `docker compose ps` shows `caddy` healthy.

**Site loads but the API fails (502 on `/api`).** Look at `docker compose logs backend`. The most common causes are a wrong `MONGO_ROOT_PASSWORD` (see below) or a rejected `JWT_SECRET`.

**Upgrading from the old compose file.** If you already have a MongoDB volume created with the old `password123`, put `MONGO_ROOT_PASSWORD=password123` in `.env` (MongoDB only reads the password when the volume is first created), or start fresh with `docker compose down -v`. The old `3000/3001/5000` ports are gone; everything is on `HTTP_PORT`, with the admin panel at `/admin`.

**`mongodb` keeps restarting with "Illegal instruction".** MongoDB 5+ needs a CPU with AVX. On older/low-power hardware change the image in `docker-compose.yml` to `mongo:4.4`.

**Image build is killed / out of memory.** Building a React app needs roughly 1.5-2 GB of RAM. Add swap, or build on a bigger machine.

**Moved or renamed the project folder, and the site is suddenly empty.** Compose names the database volume after the folder, so from the new folder it starts a new, empty database. Your data is still in the old volume (see `docker volume ls`, e.g. `fullstack_mongodb_data`). Add the old name to `.env` as `COMPOSE_PROJECT_NAME=fullstack` and run `docker compose up -d --build` again.

**Port already in use.** Set a different `HTTP_PORT` in `.env`.

---

## 📄 License

MIT License - feel free to use for your projects!
