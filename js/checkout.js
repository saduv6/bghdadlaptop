import { getCart, cartSubtotal, cartCount, clearCart, DELIVERY_FEE } from "./cart.js";
import { createOrder, fetchSettings } from "./api.js";

const reviewItems = document.getElementById("reviewItems");
const summaryItems = document.getElementById("summaryItems");
const sumItems = document.getElementById("sumItems");
const sumSubtotal = document.getElementById("sumSubtotal");
const sumDelivery = document.getElementById("sumDelivery");
const sumTotal = document.getElementById("sumTotal");
const toastEl = document.getElementById("toast");

let currentStep = 1;
let placedOrder = null;
let deliveryFee = DELIVERY_FEE;

function formatPrice(n) {
  return "\u20B9" + n.toLocaleString("en-IN");
}

function showToast(msg, type = "") {
  toastEl.textContent = msg;
  toastEl.className = "toast show " + type;
  setTimeout(() => (toastEl.className = "toast"), 2500);
}

function applySettings(s) {
  if (!s) return;
  if (s.color_scheme) document.documentElement.setAttribute("data-color-scheme", s.color_scheme);

  const logoEl = document.getElementById("siteLogo");
  if (s.logo_url) {
    logoEl.innerHTML = `<img class="logo-img" src="${s.logo_url}" alt="${s.site_name || "BaghdadLaptop"}" />`;
  } else {
    const name = s.site_name || "BaghdadLaptop";
    logoEl.innerHTML = `<span class="logo-mark">${name.charAt(0)}</span><span>${name}</span>`;
  }

  const marqueeBar = document.getElementById("marqueeBar");
  if (s.marquee_enabled === false) {
    marqueeBar.style.display = "none";
  } else {
    marqueeBar.style.display = "block";
    document.getElementById("mq1").textContent = s.marquee_text_1 || "";
    document.getElementById("mq2").textContent = s.marquee_text_2 || "";
    document.getElementById("mq3").textContent = s.marquee_text_3 || "";
  }

  if (s.delivery_fee) {
    deliveryFee = Number(s.delivery_fee);
    sumDelivery.textContent = formatPrice(deliveryFee);
  }
}

function renderReview() {
  const cart = getCart();
  if (!cart.length) {
    reviewItems.innerHTML = `<div class="empty-state"><div class="big">&#128722;</div><p>Your cart is empty.</p><a href="/" class="btn btn-ghost" style="margin-top:1rem">Browse laptops</a></div>`;
    document.getElementById("toStep2").disabled = true;
  } else {
    document.getElementById("toStep2").disabled = false;
    reviewItems.innerHTML = "";
    cart.forEach((item) => {
      const row = document.createElement("div");
      row.className = "review-item";
      row.innerHTML = `
        <img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'" />
        <div class="review-item-info">
          <div class="review-item-name">${item.name}</div>
          <div class="review-item-specs">${item.specs || item.brand || ""}</div>
          <div class="review-item-meta">
            <span class="review-item-qty">Qty: ${item.qty}</span>
            <span class="review-item-price">${formatPrice(item.price * item.qty)}</span>
          </div>
        </div>`;
      reviewItems.appendChild(row);
    });
  }
}

function renderSummary() {
  const cart = getCart();
  const subtotal = cartSubtotal();
  const total = subtotal + deliveryFee;
  sumItems.textContent = cartCount() + (cartCount() === 1 ? " item" : " items");
  sumSubtotal.textContent = formatPrice(subtotal);
  sumDelivery.textContent = formatPrice(deliveryFee);
  sumTotal.textContent = formatPrice(total);
  summaryItems.innerHTML = "";
  cart.forEach((item) => {
    const line = document.createElement("div");
    line.className = "summary-line muted";
    line.innerHTML = `<span>${item.name} ×${item.qty}</span><span>${formatPrice(item.price * item.qty)}</span>`;
    summaryItems.appendChild(line);
  });
}

function goToStep(step) {
  currentStep = step;
  document.querySelectorAll(".checkout-panel").forEach((p) => p.classList.remove("active"));
  document.getElementById(`panel${step}`).classList.add("active");

  document.querySelectorAll(".step").forEach((s) => {
    const n = parseInt(s.dataset.step, 10);
    s.classList.toggle("active", n === step);
    s.classList.toggle("done", n < step);
  });
  document.querySelectorAll(".step-connector").forEach((c) => {
    c.classList.toggle("done", parseInt(c.dataset.conn, 10) < step);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateForm() {
  const form = document.getElementById("shippingForm");
  const required = ["fullName", "email", "phone", "address", "city", "pincode"];
  let valid = true;
  required.forEach((name) => {
    const field = form.elements[name];
    if (!field.value.trim() || !field.checkValidity()) {
      field.style.borderColor = "var(--error-500)";
      valid = false;
    } else {
      field.style.borderColor = "";
    }
  });
  return valid;
}

async function handlePlaceOrder() {
  if (!validateForm()) {
    showToast("Please fill in all required fields correctly.", "error");
    return;
  }
  const cart = getCart();
  if (!cart.length) {
    showToast("Your cart is empty.", "error");
    return;
  }

  const form = document.getElementById("shippingForm");
  const formData = Object.fromEntries(new FormData(form).entries());
  const subtotal = cartSubtotal();
  const total = subtotal + deliveryFee;

  const order = {
    customer: {
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      pincode: formData.pincode,
      notes: formData.notes || "",
    },
    items: cart.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
    subtotal,
    deliveryFee,
    total,
    paymentMethod: "COD",
    status: "Pending",
  };

  const btn = document.getElementById("placeOrder");
  btn.disabled = true;
  btn.textContent = "Placing order...";
  try {
    placedOrder = await createOrder(order);
    clearCart();
    renderConfirmation();
    goToStep(3);
  } catch (err) {
    showToast("Could not place order. Please try again.", "error");
    btn.disabled = false;
    btn.textContent = "Place Order \u2192";
  }
}

function renderConfirmation() {
  if (!placedOrder) return;
  document.getElementById("orderNumber").textContent = placedOrder.orderNumber || placedOrder.id || "BL-" + Date.now().toString(36).toUpperCase();
  const c = placedOrder.customer || {};
  document.getElementById("confirmDetails").innerHTML = `
    <div class="confirm-detail-row"><span class="label">Name</span><span class="value">${c.name || ""}</span></div>
    <div class="confirm-detail-row"><span class="label">Email</span><span class="value">${c.email || ""}</span></div>
    <div class="confirm-detail-row"><span class="label">Phone</span><span class="value">${c.phone || ""}</span></div>
    <div class="confirm-detail-row"><span class="label">Address</span><span class="value">${c.address || ""}, ${c.city || ""} - ${c.pincode || ""}</span></div>
    <div class="confirm-detail-row"><span class="label">Payment</span><span class="value">Cash on Delivery</span></div>
    <div class="confirm-detail-row"><span class="label">Total</span><span class="value">${formatPrice(placedOrder.total || 0)}</span></div>
    <div class="confirm-detail-row"><span class="label">Status</span><span class="value"><span class="badge badge-pending">Pending</span></span></div>
  `;
}

document.getElementById("toStep2").addEventListener("click", () => goToStep(2));
document.getElementById("backTo1").addEventListener("click", () => goToStep(1));
document.getElementById("placeOrder").addEventListener("click", handlePlaceOrder);

(async () => {
  const settings = await fetchSettings();
  applySettings(settings);
  renderReview();
  renderSummary();
})();
