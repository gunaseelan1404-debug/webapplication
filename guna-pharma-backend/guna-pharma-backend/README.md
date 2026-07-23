# GUNA PHARMA — Backend (API only)

This is the API server only. It does not serve any web pages — the website
itself lives in the separate `guna-pharma-frontend` folder and talks to this
server over HTTP.

Built with Node.js + Express + **MySQL** (via `mysql2`).

## 1. Get a MySQL database

You need a MySQL database somewhere before this will start. Options:

- **Railway** — click "New" → "Database" → "Add MySQL" in your project.
  Railway auto-creates the DB and gives you connection variables you can
  reference directly (see section 4 below).
- **PlanetScale / Aiven / any managed MySQL** — they'll give you a
  connection string like `mysql://user:pass@host:3306/dbname`.
- **Local MySQL** — install MySQL, then run:
  ```sql
  CREATE DATABASE guna_pharma;
  ```

You don't need to create any tables yourself — the app creates them
automatically on first run.

## 2. Install

Requires **Node.js 18+**.

```bash
npm install
cp .env.example .env
```

Edit `.env`:
- `JWT_SECRET` — any long random string
- `ADMIN_KEY` — password for the admin dashboard in the frontend
- `GPAY_NUMBER` — already set to `8148331184`
- `DISCOUNT_RATE` — already set to `0.15` (15%)
- Either `MYSQL_URL` (a full connection string) **or** the individual
  `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` fields

## 3. Run

```bash
npm start
```

You should see:
```
MySQL tables ready.
GUNA PHARMA API server running at http://localhost:4000
```

Tables are created automatically on first run, and 12 sample medical
products are seeded if the `products` table is empty.

Now start the frontend project separately and point it at this server's
URL — see the frontend's README.

## 4. API reference

All request/response bodies are JSON. Protected routes need a header:
`Authorization: Bearer <token>` (token comes back from register/login).
Admin routes need header: `x-admin-key: <ADMIN_KEY>`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account, returns `{ token, customer }` |
| POST | `/api/auth/login` | — | Log in, returns `{ token, customer }` |
| GET  | `/api/products` | — | List all products + current discount rate |
| GET  | `/api/products/:id` | — | Single product |
| GET  | `/api/cart` | customer | Current cart |
| POST | `/api/cart` | customer | Add item `{ productId, quantity }` |
| PATCH | `/api/cart/:cartItemId` | customer | Change quantity `{ quantity }` |
| DELETE | `/api/cart/:cartItemId` | customer | Remove item |
| POST | `/api/orders/checkout` | customer | Place order from cart `{ paymentReference? }` |
| GET  | `/api/orders` | customer | Order history |
| GET  | `/api/admin/orders` | admin key | All orders, all customers |
| PATCH | `/api/admin/orders/:id` | admin key | Update status `{ status }` |
| GET  | `/api/admin/customers` | admin key | All registered customers |
| GET  | `/api/health` | — | Health check |

## 5. Deployed on Railway

This backend is live at:
`https://webapplication-production-235c.up.railway.app`

Railway doesn't read your local `.env` file — set these in
**Railway → your project → your backend service → Variables**:

| Variable | Value |
|---|---|
| `JWT_SECRET` | a long random string |
| `ADMIN_KEY` | your admin dashboard password |
| `GPAY_NUMBER` | `8148331184` |
| `DISCOUNT_RATE` | `0.15` |

**For the database**, if you added Railway's MySQL plugin to the same
project, it already injects `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`,
`MYSQLPASSWORD`, `MYSQLDATABASE` (or a single `MYSQL_URL`) automatically —
this code picks those up on its own, you don't need to set `DB_*`
variables yourself in that case.

If instead you're using an **external MySQL** (PlanetScale, Aiven, your
own server, etc.), set `MYSQL_URL` to its full connection string, e.g.:
```
MYSQL_URL=mysql://user:password@your-host:3306/guna_pharma
```

`PORT` is set automatically by Railway — don't override it.

CORS is locked to the deployed frontend
(`https://webapplication-uvvq.vercel.app`) plus `http://localhost:5500`
for local testing. If you change the frontend's domain, update the
`allowedOrigins` list in `server.js` and redeploy.

## 6. Security notes

- Passwords are hashed with **bcrypt** before storage — plain passwords are
  never saved.
- All registration rules (email format, 10-digit mobile, password strength,
  6-digit pincode, required checkboxes) are validated again on the server,
  so they can't be bypassed from the browser.
- Order creation runs inside a real MySQL **transaction** — if anything
  fails partway through (stock update, order-item insert, etc.) the whole
  order is rolled back so the database never ends up half-written.

## 7. Project structure

```
guna-pharma-backend/
  server.js            → starts the API server (awaits DB init first)
  db/pool.js            → MySQL connection pool
  db/init.js             → creates tables + seed products
  routes/auth.js         → register & login
  routes/products.js     → product catalog
  routes/cart.js         → cart add/update/remove
  routes/orders.js       → checkout (transactional) + order history
  routes/admin.js        → admin order management
  middleware/auth.js     → login-session & admin-key checks
```
