# GUNA PHARMA — Backend (API only)

This is the API server only. It does not serve any web pages — the website
itself lives in the separate `guna-pharma-frontend` folder and talks to this
server over HTTP.

Built with Node.js + Express + SQLite (file-based, no external database
server needed).

## 1. Install

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
- `PORT` — defaults to `4000`

## 2. Run

```bash
npm start
```

You should see:
```
GUNA PHARMA API server running at http://localhost:4000
```

The database file is created automatically at `db/guna_pharma.db` on first
run, seeded with 12 sample medical products.

Now start the frontend project separately and point it at this server's
URL (`http://localhost:4000` by default) — see the frontend's README.

## 3. API reference

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

## 4. Security notes

- Passwords are hashed with **bcrypt** before storage — plain passwords are
  never saved.
- All registration rules (email format, 10-digit mobile, password strength,
  6-digit pincode, required checkboxes) are validated again on the server,
  so they can't be bypassed from the browser.
- `cors()` is currently open to any origin so the separate frontend can
  reach it easily during development. Before going live, restrict it to
  your real frontend domain, e.g.:
  ```js
  app.use(cors({ origin: 'https://your-frontend-domain.com' }));
  ```

## 5. Project structure

```
guna-pharma-backend/
  server.js            → starts the API server
  db/init.js            → creates tables + seed products
  routes/auth.js        → register & login
  routes/products.js    → product catalog
  routes/cart.js        → cart add/update/remove
  routes/orders.js      → checkout + order history
  routes/admin.js       → admin order management
  middleware/auth.js    → login-session & admin-key checks
```
