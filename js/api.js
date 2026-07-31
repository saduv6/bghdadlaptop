// API client — talks to Netlify Functions in production, falls back to
// bundled sample data so the UI is fully testable before deployment.

import { sampleProducts } from "./sample-data.js";

// Netlify serves functions at /.netlify/functions/<name>.
// We also add a /api/* -> /.netlify/functions/* redirect in netlify.toml
// so the frontend can call /api/<name>. In local Vite dev there are no
// functions running, so calls fail and we gracefully fall back to sample data.
const API_BASE = "/.netlify/functions";

const USE_FALLBACK = true; // graceful: real API if reachable, sample data otherwise

async function api(path, options) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) throw new Error(`API ${path} returned ${res.status}`);
    return await res.json();
  } catch (err) {
    if (!USE_FALLBACK) throw err;
    return null; // caller handles fallback
  }
}

export async function fetchProducts() {
  const data = await api("/products");
  if (data && Array.isArray(data.products)) return data.products;
  return sampleProducts;
}

export async function fetchProduct(id) {
  const data = await api(`/products?id=${id}`);
  if (data && data.product) return data.product;
  return sampleProducts.find((p) => p.id === id) || null;
}

export async function createOrder(order) {
  const data = await api("/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
  if (data && data.order) return data.order;
  // Fallback: generate a local order number so checkout flow completes
  return {
    ...order,
    orderNumber: "LS-" + Date.now().toString(36).toUpperCase(),
    status: "Pending",
    createdAt: new Date().toISOString(),
  };
}

export async function fetchOrders() {
  const data = await api("/orders");
  if (data && Array.isArray(data.orders)) return data.orders;
  return null; // dashboard shows its own seeded data when API absent
}

export async function fetchCustomers() {
  const data = await api("/customers");
  if (data && Array.isArray(data.customers)) return data.customers;
  return null;
}

export async function adminLogin(username, password) {
  const data = await api("/auth-login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  if (data && data.token) return data;
  // Fallback for local dev — matches the hardcoded creds in the function
  if (username === "admin" && password === "admin123") {
    return { token: "dev-token-" + Date.now(), user: { username: "admin", role: "admin" } };
  }
  throw new Error("Invalid credentials");
}

// Dashboard management actions (used in dev fallback)
export async function updateOrderStatus(orderId, status) {
  const data = await api("/orders", {
    method: "PATCH",
    body: JSON.stringify({ id: orderId, status }),
  });
  return data && data.order ? data.order : { id: orderId, status };
}

export async function deleteProduct(id) {
  await api("/products", { method: "DELETE", body: JSON.stringify({ id }) });
  return true;
}

export async function saveProduct(product) {
  const data = await api("/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
  return data && data.product ? data.product : product;
}
