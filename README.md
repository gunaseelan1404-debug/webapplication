# GUNA PHARMA — Frontend (website only)

This is just the website — plain HTML, CSS and JavaScript. It has no
database and no server logic of its own; every page calls the separate
**guna-pharma-backend** project over the network for data.

## 1. Point it at your backend

Start `guna-pharma-backend` first (see its own README) — by default it
runs at `http://localhost:4000`.

Open `js/config.js` in this folder and confirm the URL matches:

```js
window.GUNA_CONFIG = {
  API_BASE_URL: 'http://localhost:4000'
};
```

Change this one line whenever the backend's address changes — for example
once you deploy the backend to a live server:

```js
window.GUNA_CONFIG = {
  API_BASE_URL: 'https://api.gunapharma.com'
};
```

## 2. Run the frontend

Because the pages use `fetch()` to talk to the backend, don't just
double-click the HTML files — serve them from a tiny local web server so
the browser treats them as a proper site. Any of these work:

**Option A — Node (no install needed if you have Node.js):**
```bash
npx serve -l 5500 .
```

**Option B — Python (already on most computers):**
```bash
python3 -m http.server 5500
```

Then open **http://localhost:5500/register.html** in your browser.

## 3. Pages

| Page | File |
|---|---|
| Create account | `register.html` |
| Login | `login.html` |
| Products | `products.html` |
| Cart & GPay checkout | `cart.html` |
| My Orders | `orders.html` |
| Admin (owner only) | `admin.html` — needs the `ADMIN_KEY` you set in the backend's `.env` |

`index.html` just redirects to Products (if logged in) or Register (if not).

## 4. Deploying for real customers

Any static hosting works once you're ready to go live — Netlify, Vercel,
GitHub Pages, or your own web server. Just make sure:
- `js/config.js` points at your backend's real, public URL (with HTTPS)
- The backend's CORS setting allows requests from this frontend's domain

## 5. Project structure

```
guna-pharma-frontend/
  index.html, register.html, login.html,
  products.html, cart.html, orders.html, admin.html
  css/style.css      → shared design system (colors, buttons, cards)
  css/auth.css        → register/login split-panel layout
  js/config.js         → the ONE line to edit: your backend's URL
  js/api.js            → shared fetch helper, session storage, cart badge
```
