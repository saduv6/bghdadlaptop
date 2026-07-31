import { adminLogin, fetchOrders, fetchCustomers, fetchProducts, updateOrderStatus, saveProduct, deleteProduct } from "./api.js";
import { sampleOrders, sampleCustomers, sampleProducts } from "./sample-data.js";

const SESSION_KEY = "ls_admin_session";
const toastEl = document.getElementById("toast");

let state = {
  orders: [],
  customers: [],
  products: [],
  editingOrderId: null,
  editingProductId: null,
};

function formatPrice(n) {
  return "\u20B9" + (n || 0).toLocaleString("en-IN");
}
function formatDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }
}
function showToast(msg, type = "") {
  toastEl.textContent = msg;
  toastEl.className = "toast show " + type;
  setTimeout(() => (toastEl.className = "toast"), 2200);
}

/* ---------- Auth ---------- */
function isLoggedIn() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return s && s.token && Date.now() - s.ts < 1000 * 60 * 60 * 8;
  } catch { return false; }
}

function showDashboard() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("dashLayout").style.display = "flex";
  loadAllData();
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById("dashLayout").style.display = "none";
  document.getElementById("loginScreen").style.display = "grid";
  document.getElementById("loginForm").reset();
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("loginBtn");
  const errBox = document.getElementById("loginError");
  errBox.style.display = "none";
  btn.disabled = true;
  btn.textContent = "Signing in...";
  try {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const res = await adminLogin(username, password);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: res.token, user: res.user, ts: Date.now() }));
    showDashboard();
  } catch (err) {
    errBox.textContent = "Invalid username or password.";
    errBox.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign In";
  }
});

document.getElementById("logoutBtn").addEventListener("click", logout);

/* ---------- Navigation ---------- */
const sectionTitles = {
  overview: "Dashboard",
  orders: "Orders",
  customers: "Customers",
  products: "Products",
  settings: "Settings",
};

function switchSection(name) {
  document.querySelectorAll(".dash-section").forEach((s) => s.classList.remove("active"));
  document.getElementById(`sec-${name}`).classList.add("active");
  document.querySelectorAll(".sidebar-nav a").forEach((a) => a.classList.toggle("active", a.dataset.section === name));
  document.getElementById("pageTitle").textContent = sectionTitles[name] || "Dashboard";
  document.getElementById("sidebar").classList.remove("open");
}

document.querySelectorAll("[data-section]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    switchSection(el.dataset.section);
  });
});

document.getElementById("hamburger").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

/* ---------- Data loading ---------- */
async function loadAllData() {
  // Orders
  let orders = await fetchOrders();
  state.orders = orders && orders.length ? orders : [...sampleOrders];
  // Customers
  let customers = await fetchCustomers();
  state.customers = customers && customers.length ? customers : [...sampleCustomers];
  // Products
  let products = await fetchProducts();
  state.products = products && products.length ? products : [...sampleProducts];

  renderOverview();
  renderOrders();
  renderCustomers();
  renderProducts();
}

/* ---------- Overview ---------- */
function renderOverview() {
  const totalOrders = state.orders.length;
  const totalCustomers = state.customers.length;
  const pending = state.orders.filter((o) => o.status === "Pending").length;
  const revenue = state.orders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + (o.total || 0), 0);

  document.getElementById("statGrid").innerHTML = `
    <div class="stat-card">
      <div class="stat-icon blue">&#128230;</div>
      <div class="stat-meta"><span class="stat-value">${totalOrders}</span><span class="stat-label">Total Orders</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green">&#9679;</div>
      <div class="stat-meta"><span class="stat-value">${totalCustomers}</span><span class="stat-label">Customers</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon amber">&#9203;</div>
      <div class="stat-meta"><span class="stat-value">${pending}</span><span class="stat-label">Pending Orders</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon purple">&#8377;</div>
      <div class="stat-meta"><span class="stat-value">${formatPrice(revenue)}</span><span class="stat-label">Revenue</span></div>
    </div>`;

  const recent = [...state.orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  document.getElementById("recentOrdersBody").innerHTML = recent.map((o) => `
    <tr>
      <td><strong>${o.id || o.orderNumber || "—"}</strong></td>
      <td>${o.customer || (o.customer && o.customer.name) || "—"}</td>
      <td>${formatDate(o.date)}</td>
      <td>${formatPrice(o.total)}</td>
      <td>${statusBadge(o.status)}</td>
    </tr>`).join("") || `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem">No orders yet</td></tr>`;
}

function statusBadge(status) {
  const map = { Pending: "badge-pending", Shipped: "badge-shipped", Delivered: "badge-delivered", Cancelled: "badge-cancelled" };
  return `<span class="badge ${map[status] || "badge-pending"}">${status || "Pending"}</span>`;
}

/* ---------- Orders ---------- */
function renderOrders(filter = "") {
  const body = document.getElementById("ordersBody");
  let orders = state.orders;
  if (filter) {
    const f = filter.toLowerCase();
    orders = orders.filter((o) =>
      (o.id || o.orderNumber || "").toLowerCase().includes(f) ||
      (o.customer || "").toLowerCase().includes(f) ||
      (o.email || "").toLowerCase().includes(f)
    );
  }
  if (!orders.length) {
    body.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">No orders found</td></tr>`;
    return;
  }
  body.innerHTML = orders.map((o) => `
    <tr>
      <td><strong>${o.id || o.orderNumber || "—"}</strong></td>
      <td>${o.customer || "—"}<br><span style="font-size:0.78rem;color:var(--text-muted)">${o.email || ""}</span></td>
      <td>${formatDate(o.date)}</td>
      <td>${formatPrice(o.total)}</td>
      <td>${statusBadge(o.status)}</td>
      <td class="row-actions">
        <button class="icon-btn" data-edit-order="${o.id || o.orderNumber}" title="Edit status">&#9998;</button>
      </td>
    </tr>`).join("");
  body.querySelectorAll("[data-edit-order]").forEach((btn) => {
    btn.addEventListener("click", () => openOrderModal(btn.dataset.editOrder));
  });
}

document.getElementById("orderSearch").addEventListener("input", (e) => renderOrders(e.target.value));

/* ---------- Order status modal ---------- */
function openOrderModal(orderId) {
  state.editingOrderId = orderId;
  const order = state.orders.find((o) => (o.id || o.orderNumber) === orderId);
  document.getElementById("modalOrderId").textContent = orderId;
  document.getElementById("modalOrderStatus").value = order?.status || "Pending";
  document.getElementById("orderModal").classList.add("open");
}
function closeOrderModal() {
  document.getElementById("orderModal").classList.remove("open");
  state.editingOrderId = null;
}
document.getElementById("closeOrderModal").addEventListener("click", closeOrderModal);
document.getElementById("cancelOrder").addEventListener("click", closeOrderModal);
document.getElementById("confirmOrderStatus").addEventListener("click", async () => {
  const status = document.getElementById("modalOrderStatus").value;
  const id = state.editingOrderId;
  await updateOrderStatus(id, status);
  const order = state.orders.find((o) => (o.id || o.orderNumber) === id);
  if (order) order.status = status;
  closeOrderModal();
  renderOverview();
  renderOrders(document.getElementById("orderSearch").value);
  showToast("Order status updated", "success");
});

/* ---------- Customers ---------- */
function renderCustomers(filter = "") {
  const body = document.getElementById("customersBody");
  let customers = state.customers;
  if (filter) {
    const f = filter.toLowerCase();
    customers = customers.filter((c) =>
      (c.name || "").toLowerCase().includes(f) ||
      (c.email || "").toLowerCase().includes(f) ||
      (c.phone || "").toLowerCase().includes(f)
    );
  }
  if (!customers.length) {
    body.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem">No customers found</td></tr>`;
    return;
  }
  body.innerHTML = customers.map((c) => `
    <tr>
      <td><strong>${c.name || "—"}</strong></td>
      <td>${c.email || "—"}</td>
      <td>${c.phone || "—"}</td>
      <td>${c.orders || 0}</td>
      <td>${formatDate(c.joined)}</td>
    </tr>`).join("");
}
document.getElementById("customerSearch").addEventListener("input", (e) => renderCustomers(e.target.value));

/* ---------- Products ---------- */
function renderProducts() {
  const body = document.getElementById("productsBody");
  if (!state.products.length) {
    body.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">No products yet</td></tr>`;
    return;
  }
  body.innerHTML = state.products.map((p) => `
    <tr>
      <td><strong>${p.name || "—"}</strong><br><span style="font-size:0.78rem;color:var(--text-muted)">${p.specs || ""}</span></td>
      <td>${p.brand || "—"}</td>
      <td>${formatPrice(p.price)}</td>
      <td>${p.stock ?? 0}</td>
      <td>${p.status === "active" ? '<span class="badge badge-delivered">Active</span>' : '<span class="badge badge-cancelled">Inactive</span>'}</td>
      <td class="row-actions">
        <button class="icon-btn" data-edit-product="${p.id}" title="Edit">&#9998;</button>
        <button class="icon-btn danger" data-delete-product="${p.id}" title="Delete">&times;</button>
      </td>
    </tr>`).join("");
  body.querySelectorAll("[data-edit-product]").forEach((btn) => {
    btn.addEventListener("click", () => openProductModal(btn.dataset.editProduct));
  });
  body.querySelectorAll("[data-delete-product]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this product? This cannot be undone.")) return;
      await deleteProduct(btn.dataset.deleteProduct);
      state.products = state.products.filter((p) => p.id !== btn.dataset.deleteProduct);
      renderProducts();
      showToast("Product deleted", "success");
    });
  });
}

/* ---------- Product modal ---------- */
function openProductModal(id) {
  state.editingProductId = id || null;
  const title = document.getElementById("productModalTitle");
  const form = document.getElementById("productForm");
  form.reset();
  if (id) {
    const p = state.products.find((x) => x.id === id);
    if (p) {
      title.textContent = "Edit Product";
      document.getElementById("prodId").value = p.id;
      document.getElementById("prodName").value = p.name || "";
      document.getElementById("prodBrand").value = p.brand || "";
      document.getElementById("prodPrice").value = p.price || 0;
      document.getElementById("prodStock").value = p.stock ?? 0;
      document.getElementById("prodStatus").value = p.status || "active";
      document.getElementById("prodSpecs").value = p.specs || "";
      document.getElementById("prodImage").value = p.image || "";
    }
  } else {
    title.textContent = "Add Product";
    document.getElementById("prodId").value = "";
  }
  document.getElementById("productModal").classList.add("open");
}
function closeProductModal() {
  document.getElementById("productModal").classList.remove("open");
  state.editingProductId = null;
}
document.getElementById("addProductBtn").addEventListener("click", () => openProductModal(null));
document.getElementById("closeProductModal").addEventListener("click", closeProductModal);
document.getElementById("cancelProduct").addEventListener("click", closeProductModal);
document.getElementById("saveProduct").addEventListener("click", async () => {
  const name = document.getElementById("prodName").value.trim();
  const brand = document.getElementById("prodBrand").value.trim();
  const price = parseFloat(document.getElementById("prodPrice").value) || 0;
  const stock = parseInt(document.getElementById("prodStock").value, 10) || 0;
  const status = document.getElementById("prodStatus").value;
  const specs = document.getElementById("prodSpecs").value.trim();
  const image = document.getElementById("prodImage").value.trim();
  if (!name || !brand) { showToast("Name and brand are required", "error"); return; }

  const id = state.editingProductId || "p" + Date.now().toString(36);
  const product = { id, name, brand, price, stock, status, specs, image };
  await saveProduct(product);
  if (state.editingProductId) {
    const idx = state.products.findIndex((p) => p.id === id);
    if (idx >= 0) state.products[idx] = product;
  } else {
    state.products.push(product);
  }
  closeProductModal();
  renderProducts();
  showToast(state.editingProductId ? "Product updated" : "Product added", "success");
});

/* ---------- Settings ---------- */
document.getElementById("saveSettings").addEventListener("click", () => {
  const fee = document.getElementById("settingDeliveryFee").value;
  localStorage.setItem("ls_delivery_fee", fee);
  showToast("Settings saved locally", "success");
});

/* ---------- Init ---------- */
if (isLoggedIn()) {
  showDashboard();
}
