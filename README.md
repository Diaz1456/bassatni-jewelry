# Elegance Jewelry — Fine Jewelry E-commerce Website

A complete, production-ready jewelry store built with **Node.js + Express + MongoDB (Mongoose)**, server-side rendered with EJS and progressively enhanced with vanilla JavaScript. Includes a full **admin CMS panel** and a **luxury public theme**.

## Features

### Public Storefront
- **Catalog & Search**: filterable catalog (type, metal, gemstone, price, occasion), typo-tolerant search with autocomplete
- **Product Detail**: multi-image gallery, material/gemstone specs, measurements, care instructions, related products
- **Sections**: New Arrivals, Best Sellers, Featured, lookbooks/style galleries
- **Cart & Wishlist**: client-side cart and wishlist pages (localStorage) with quantity editing, persistence across sessions, and demo checkout
- **Static pages**: About, Contact (validated form + Google Maps embed), FAQ, **Ring Size Guide**
- **Newsletter signup**, SEO (per-page meta, Open Graph, Twitter cards, JSON-LD Product schema, sitemap + robots.txt)
- **CSRF protection**: lightweight session-token middleware applied to all public and admin state-changing forms (login, contact, newsletter, settings, product/category/media management, logout)

### Admin Panel (CMS) — `http://localhost:3000/admin`
- **Secure login**: bcrypt-hashed password (`bcryptjs`) + signed `express-session` cookie; all `/admin/*` routes guarded by auth middleware; login rate-limited + CSRF-protected
- **Dashboard**: active/inactive/trashed product counts, low-stock & out-of-stock alerts, best sellers, recent products, quick links
- **Product CRUD**: create, edit, **soft-delete to trash with restore + permanent purge**, bulk activate/hide/trash; live-status badges; 8 sort orders; category/status/KW filters sharing shareable filter URLs
- **Photo uploads**: Multer multi-image upload (up to 8 × 6MB) with **live client-side previews**; remove existing images on edit (files cleaned from disk)
- **Category CMS**: create, edit, delete top-level categories with images and display order (deletion blocked while products reference them); drives nav/footer/homepage/filters
- **Image Library**: browse every uploaded image (product/settings/category folders), copy public URLs, delete files safely within the uploads root
- **Site settings**: shop name, logo, favicon, tagline, hero image/title/subtitle, contact info, announcement bar, Google Maps embed, footer text/copyright, social links (Instagram/Facebook/Pinterest/Twitter/YouTube), SEO defaults — stored in MongoDB and reflected across the public site instantly (cache-invalidating)
- **Validation (client + server)**: forms validate inline before submit and are re-validated server-side (mirrored rules); SKU auto-generator and slug auto-fill helpers

### Luxury Theme
Dark "Noir & Or" elegance — deep charcoal-navy backgrounds (`#0F0F1A`), cream product sections, gold gradients, Playfair Display + Cormorant Garamond + Montserrat, sticky header with announcement bar, gold section divides, testimonials, and responsive mobile navigation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express 4 |
| Database | MongoDB + Mongoose 8 |
| Auth | bcryptjs + express-session |
| Uploads | Multer (disk → `/uploads`, served statically) |
| Views | EJS (server-side rendering) + express-ejs-layouts |
| Frontend | Vanilla JS + CSS3 (no framework) |
| Image processing | Sharp (ready for an optimization pipeline) |
| Deployment | Render (blueprint included) |

## Project Structure

```
jewelry-shop/
├── server.js             # Entry point (Render start command: node server.js)
├── src/
│   ├── app.js            # Express app: sessions, flash, settings locals, route mount
│   ├── config/           # Environment/config
│   ├── controllers/      # Public + admin route handlers
│   ├── middleware/       # Security, rate limits, admin auth, uploads, error handling
│   ├── models/           # Mongoose schemas (Product, Category, Lookbook, Admin, Settings)
│   ├── routes/           # Web + API + Admin routes
│   ├── utils/            # DB connection, formatters, settings cache, sitemap
│   └── views/            # EJS templates (partials/, products/, admin/, …)
├── public/
│   ├── css/              # main.css, components.css, theme.css, admin.css
│   ├── js/               # main.js (public), admin.js (admin interactivity + validation)
│   └── images/           # Placeholder assets
├── uploads/              # Admin-uploaded images (gitignored; persistent disk in prod)
├── seeds/seed.js         # Sample data + admin user + default settings
├── render.yaml           # Render blueprint (service + disk + env vars)
└── .env.example
```

## Prerequisites

- **Node.js >= 18**
- **MongoDB** — local instance or MongoDB Atlas free tier
- **npm**

## Setup & Run Locally

### 1. Install dependencies

```bash
git clone <your-repo-url>
cd jewelry-shop
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

At minimum set `MONGODB_URI` to your database:

```env
MONGODB_URI=mongodb://localhost:27017/jewelry-shop
```

### 3. Seed the database

```bash
npm run seed
```

This creates:

- **4 categories** — Rings, Necklaces, Earrings, Bracelets
- **12 products** — realistic sample jewelry with descriptions, prices, gemstone/measurement specs, images, SEO
- **3 lookbooks** — Bridal 2026, Minimalist Modern, Summer Radiance
- **1 admin user** — `admin@jewelrystore.com` / `admin123` (see "Default Admin Credentials")
- **Default site settings** — shop name "Elegance Jewelry", tagline, hero, contact info

> ⚠️ The seed **wipes** existing products/categories/lookbooks, and **resets** the admin password and site settings to the defaults above. Use it on a fresh database or whenever you want the sample data back.

### 4. Start the server

```bash
npm start          # runs `node server.js`
```

Open http://localhost:3000. The admin panel is at http://localhost:3000/admin.

For auto-reload during development: `npm run dev`.

## Default Admin Credentials

| Field | Value |
|-------|-------|
| URL | `http://localhost:3000/admin` |
| Email | `admin@jewelrystore.com` |
| Password | `admin123` |

Change them by setting `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` in `.env` and re-running `npm run seed`. **Change the password in production before launch.**

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default `3000`) |
| `NODE_ENV` | `development` or `production` | No (default `development`) |
| `MONGODB_URI` | MongoDB connection string | **Yes** |
| `MONGODB_URI_PROD` | Optional production-only URI (falls back to `MONGODB_URI`) | No |
| `SESSION_SECRET` | Signs the session cookie — set a long random value in production | **Yes (prod)** |
| `SITE_URL` | Public site URL (sitemap + Open Graph) | Recommended |
| `SITE_NAME` | Fallback store name (admin Settings override it) | No |
| `SITE_DESCRIPTION` | Fallback description (admin Settings override it) | No |
| `GA_MEASUREMENT_ID` | Google Analytics 4 ID (`G-XXXX`) | No |
| `IMAGE_QUALITY` | JPEG/WebP quality 0–100 | No (default `80`) |
| `IMAGE_MAX_WIDTH` | Max image width for optimization | No (default `1920`) |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window | No (default `900000`) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | No (default `100`) |
| `ADMIN_EMAIL` | Initial admin email (used by seed) | No (default `admin@jewelrystore.com`) |
| `ADMIN_PASSWORD` | Initial admin password (used by seed) | No (default `admin123`) |
| `ADMIN_NAME` | Initial admin display name | No (default `Store Owner`) |
| `SETTINGS_CACHE_TTL_MS` | Public-site settings cache TTL (ms) | No (default `60000`) |

## Validation

All forms validate **client-side** (instant inline messages) **and** server-side (authoritative, since clients can be bypassed):

| Form | Client rules | Server rules |
|------|-------------|--------------|
| Admin product | name/SKU/category/price/metal/description required; video URL must be `http(s)` | Same (mirrored in `validate()`) |
| Admin settings | shop name required; email format; social URLs `http(s)` | Same (mirrored in `validateSettings()`) |
| Contact | first/last name, email, subject, message required; email format | Required fields checked with helpful flash/400 |
| Newsletter | email presence (via AJAX in `main.js`) | Email required (400 on failure) |

## Error Handling

- Every async route handler wraps DB work in `try/catch` and forwards to the central `errorHandler` middleware (`next(error)`) or renders an error page directly.
- `errorHandler` distinguishes operational errors (validation, CastError, duplicate keys) from unexpected ones; dev mode shows the full error/stack, production renders a generic 500.
- **Multer errors** (file too large, wrong type) are caught by the error handler and redirected back with a flash message instead of crashing.
- Upload cleanup: if a create/update fails after files were written to disk, the uploaded files are unlinked so orphans never accumulate.
- `Admin`/auth lookups handle missing sessions and deleted admins gracefully (destroy session, redirect to login).

## Image Uploads & Cloudinary Note

Uploaded images are stored **locally** under `uploads/` and served from `/uploads`. MongoDB stores only the *public URL*, so swapping storage backends is a single-point change.

- **Dev**: `uploads/` is gitignored — fine for local work.
- **Render**: the blueprint mounts a **persistent disk** (`/opt/render/project/src/uploads`) so uploads survive restarts/redeploys. On the free tier your service can sleep; the disk persists but is single-instance.
- **For a real production shop, move to cloud storage** — recommend **Cloudinary**: replace the multer disk handler in `src/middleware/upload.js` with calls to the Cloudinary upload API and have `toPublicUrl` return the returned secure URLs (or use MongoDB GridFS). Because only URLs are stored, the product catalog and admin code need no other changes.

## Deploy on Render

### Option A — Blueprint (render.yaml)

1. Create a MongoDB Atlas cluster and copy its connection string.
2. Push this repo to GitHub/GitLab.
3. Render → **New + → Blueprint** → connect your repo.
4. Render provisions the service with **Build**: `npm install`, **Start**: `node server.js`, a persistent disk at `/opt/render/project/src/uploads`, and the env vars from the blueprint.
5. Confirm/set in the dashboard environment:
   - `MONGODB_URI` = your Atlas URI
   - `NODE_ENV=production`
   - `SITE_URL=https://your-app.onrender.com`
   - `SESSION_SECRET` (blueprint auto-generates one)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` (initial admin credentials)
6. Click **Apply** and wait for the deploy.

### Option B — Manual Web Service

1. Render → **New + → Web Service** → connect your repo.
2. **Build Command**: `npm install`
3. **Start Command**: `node server.js`
4. Add the environment variables from the table above.
5. Add a **persistent disk**: Mount path `/opt/render/project/src/uploads` (≥ 1 GB).
6. **Create Web Service**.

### One-time database seed on Render

```bash
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/elegance-jewelry" npm run seed
```

Run it locally against your Atlas URI, or as a Render One-off Job after the service is up. The seed is destructive for content, so run once on a fresh database.

## Routes

Public: `/` (home), `/catalog`, `/product/:slug`, `/category/:slug`, `/categories`, `/lookbooks`, `/lookbook/:slug`, `/about`, `/contact`, `/faq`, `/sitemap.xml`, `/robots.txt`, `/health`.

API: `/api/products`, `/api/products/:slug`, `/api/products/search/autocomplete`, `/api/categories`, `/api/lookbooks` (see existing routes for query params).

Admin: `/admin/login`, `/admin` (dashboard), `/admin/products`, `/admin/products/new`, `/admin/products/:id/edit`, `/admin/products/:id/delete`, `/admin/settings`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the server (`node server.js`) |
| `npm run dev` | Start with nodemon auto-reload |
| `npm run seed` | (Re)seed the database with sample data, admin, and settings |
| `npm run lint` | Run ESLint |
| `npm run generate-sitemap` | Pre-generate sitemap (utility) |

## License

MIT

---

**Note**: Seed product images reference local placeholders under `/public/images/`. Replace them with your real assets; uploaded images are stored under `/uploads/`.