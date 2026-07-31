# BaghdadLaptop

A laptop e-commerce store with Cash on Delivery checkout and a full management dashboard.

## Features

**Storefront**
- Product grid with live stock indicators
- Slide-out cart with quantity controls (persists across reloads)
- Moving marquee bar at the top with 3 customizable sentences
- Full footer with phone numbers, emails, address, and social media links

**Checkout**
- 3-step flow: Cart Review → Shipping Details → Confirmation
- Cash on Delivery only — no payment gateway needed
- Form validation and order confirmation with order number

**Dashboard** (access at `/dashboard`)
- Login: username `admin`, password `admin123`
- Overview with order/customer/revenue stats
- Order management with editable status (Pending / Shipped / Delivered / Cancelled)
- Product management (add, edit, delete)
- Customer list (derived from orders)
- **Appearance settings**: change site name, upload a logo, pick from 5 color schemes, edit the marquee text, set delivery fee
- **Contact info settings**: edit phone numbers, emails, address, and social media links (Facebook, Instagram, WhatsApp, Telegram)

All settings are stored in the database and appear instantly on the storefront.

## Tech Stack

- **Frontend**: Vite + vanilla JavaScript
- **Database**: Supabase (PostgreSQL) — products, orders, and site settings
- **Styling**: Custom CSS with a black-and-white default theme and 5 swappable color schemes

## Development

The dev server runs automatically. To build for production:

```bash
npm run build
```

## Deployment

This project is configured for Netlify. The `netlify.toml` file handles the build command and SPA routing. Push to GitHub and import the repository in Netlify.

The Supabase database is already provisioned — no manual database setup is required.
