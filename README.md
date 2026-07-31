# Nexus Laptops — E-commerce Store

A complete laptop e-commerce store with storefront, checkout (Cash on Delivery), and an admin dashboard. Built with vanilla JavaScript + Vite, backed by MongoDB Atlas via Netlify Serverless Functions.

## What's inside

```
├── index.html              Storefront (product grid + cart drawer)
├── checkout.html           3-step checkout (Cart → Shipping → Confirmation)
├── dashboard.html          Admin dashboard (login + orders/customers/products)
├── css/
│   ├── styles.css          Shared design system
│   ├── dashboard.css       Dashboard styles
│   └── checkout.css        Checkout styles
├── js/
│   ├── storefront.js       Storefront logic
│   ├── checkout.js         Checkout logic
│   ├── dashboard.js        Dashboard logic
│   ├── cart.js             Cart (localStorage)
│   ├── api.js              API client (with sample-data fallback)
│   └── sample-data.js      Fallback data for local dev
├── netlify/functions/
│   ├── _mongo.js           MongoDB connection (cached) + seed
│   ├── products.js         GET/POST/PATCH/DELETE products
│   ├── orders.js           GET/POST/PATCH orders
│   ├── customers.js        GET customers
│   └── auth-login.js       POST admin login
├── netlify.toml            Netlify build + redirects config
└── vite.config.js          Vite build config
```

## Admin login (demo)

- **Username:** `admin`
- **Password:** `admin123`

> These credentials are seeded into MongoDB on first use. Change them in production (see below).

---

## Step 1 — Create a MongoDB Atlas free-tier database

1. Go to **https://www.mongodb.com/cloud/atlas/register** and sign up (free).
2. Create a project, then create a **free M0 cluster** (512 MB, forever free).
3. Under **Database Access**, create a database user (username + password — save these).
4. Under **Network Access**, click **Add IP Address → Allow access from anywhere** (`0.0.0.0/0`). Netlify functions run on dynamic IPs, so this is required.
5. Click **Connect → Drivers**, copy the **connection string**. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your database user's credentials.

## Step 2 — Deploy to Netlify

1. Push this project to a GitHub repository.
2. Go to **https://app.netlify.com** → **Add new site → Import from Git** → select your repo.
3. Build settings (auto-detected from `netlify.toml`, but verify):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
4. Under **Site settings → Environment variables**, add:
   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | your connection string from Step 1 |
   | `MONGODB_DB` | `nexus_laptops` |
5. Click **Deploy**. The first deploy will seed the database with sample products + the admin user.

## Step 3 — Connect your custom domain

1. In Netlify: **Site settings → Domain management → Add custom domain**.
2. Enter your domain. Netlify will give you DNS records (CNAME or A record) to add at your registrar.
3. SSL is provisioned automatically (Let's Encrypt) — no extra setup needed.

---

## How the API works

All endpoints are Netlify Functions, exposed at `/.netlify/functions/<name>` (also reachable via the `/api/<name>` redirect):

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/.netlify/functions/products` | List all products |
| GET | `/.netlify/functions/products?id=X` | Single product |
| POST | `/.netlify/functions/products` | Create product |
| PATCH | `/.netlify/functions/products` | Update product `{ id, status }` |
| DELETE | `/.netlify/functions/products` | Delete product `{ id }` |
| GET | `/.netlify/functions/orders` | List all orders |
| POST | `/.netlify/functions/orders` | Create order (checkout) |
| PATCH | `/.netlify/functions/orders` | Update order status `{ id, status }` |
| GET | `/.netlify/functions/customers` | List customers |
| POST | `/.netlify/functions/auth-login` | Admin login `{ username, password }` |

The frontend (`js/api.js`) calls these endpoints and **falls back to bundled sample data** if the API isn't reachable — so you can develop and preview the UI locally before deploying.

## Local development

```bash
npm install
npm run dev
```

This starts Vite at `http://localhost:5173`. The API functions won't run locally (they need Netlify's runtime), so the UI uses sample data. To test functions locally, install the Netlify CLI and run `netlify dev`.

## Security notes for production

1. **Change the admin password.** The seed creates `admin / admin123`. After first deploy, update the `users` document in MongoDB Atlas (or change the seed in `_mongo.js` before deploying).
2. **Hash passwords.** This demo stores the admin password in plaintext. For production, hash it with `bcrypt` in `auth-login.js`.
3. **Add real auth tokens.** The login returns a base64 demo token. Swap in a signed JWT (`jsonwebtoken` package) with a secret stored in Netlify env vars.
4. **Restrict Network Access** if you add a static IP, but for serverless you generally need `0.0.0.0/0`.

## Tech stack

- **Frontend:** Vanilla JS + Vite (no frameworks)
- **Backend:** Netlify Serverless Functions (Node.js)
- **Database:** MongoDB Atlas free tier (M0, 512 MB)
- **Hosting:** Netlify free plan

## License

MIT — yours to use and modify.
