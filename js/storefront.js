import { fetchProducts, fetchSettings } from "./api.js";
import { getCart, addToCart, updateQty, removeFromCart, cartCount, cartSubtotal, DELIVERY_FEE } from "./cart.js";

const grid = document.getElementById("productGrid");
const cartBadge = document.getElementById("cartBadge");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const cartItemsEl = document.getElementById("cartItems");
const cartSubtotalEl = document.getElementById("cartSubtotal");
const toastEl = document.getElementById("toast");

function formatPrice(n) {
  return "\u20B9" + n.toLocaleString("en-IN");
}

function showToast(msg, type = "") {
  toastEl.textContent = msg;
  toastEl.className = "toast show " + type;
  setTimeout(() => (toastEl.className = "toast"), 2200);
}

function stockPill(stock) {
  if (stock === 0) return `<span class="stock-pill stock-out">Out of stock</span>`;
  if (stock <= 5) return `<span class="stock-pill stock-low">Only ${stock} left</span>`;
  return `<span class="stock-pill stock-in">In stock</span>`;
}

function renderProducts(products) {
  grid.innerHTML = "";
  if (!products.length) {
    grid.innerHTML = `<div class="empty-state"><div class="big">&#128722;</div>No products available right now. Check back soon.</div>`;
    return;
  }
  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-thumb">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='&#128187;'" />
      </div>
      <div class="product-body">
        <div class="product-brand">${p.brand}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-specs">${p.specs || ""}</div>
        <div class="product-footer">
          <span class="product-price">${formatPrice(p.price)}</span>
          ${stockPill(p.stock ?? 0)}
        </div>
        <button class="btn btn-primary btn-block add-btn" data-id="${p.id}" ${(p.stock ?? 0) === 0 ? "disabled" : ""}>
          ${(p.stock ?? 0) === 0 ? "Sold Out" : "Add to Cart"}
        </button>
      </div>`;
    grid.appendChild(card);
  });
  grid.querySelectorAll(".add-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const product = products.find((p) => p.id === id);
      if (!product) return;
      addToCart(product, 1);
      showToast(`${product.name} added to cart`, "success");
      openCart();
    });
  });
}

function renderCart() {
  const cart = getCart();
  cartBadge.textContent = cartCount();
  cartSubtotalEl.textContent = formatPrice(cartSubtotal());
  if (!cart.length) {
    cartItemsEl.innerHTML = `<div class="cart-empty"><div style="font-size:2.5rem">&#128722;</div><p>Your cart is empty.</p><a href="#products" class="btn btn-ghost btn-sm" style="margin-top:1rem" onclick="closeCart()">Browse laptops</a></div>`;
    return;
  }
  cartItemsEl.innerHTML = "";
  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'" />
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
      </div>
      <div class="qty-control">
        <button class="qty-btn" data-act="dec" data-id="${item.id}">&minus;</button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn" data-act="inc" data-id="${item.id}">+</button>
        <button class="qty-btn" data-act="del" data-id="${item.id}" style="margin-left:0.3rem;color:var(--error-500)">&times;</button>
      </div>`;
    cartItemsEl.appendChild(row);
  });
  cartItemsEl.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      const item = getCart().find((i) => i.id === id);
      if (!item) return;
      if (act === "inc") updateQty(id, item.qty + 1);
      else if (act === "dec") updateQty(id, item.qty - 1);
      else if (act === "del") removeFromCart(id);
    });
  });
}

function openCart() {
  renderCart();
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("open");
}
function closeCart() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("open");
}

/* ---------- Apply site settings ---------- */
function applySettings(s) {
  if (!s) return;

  // Color scheme
  if (s.color_scheme) {
    document.documentElement.setAttribute("data-color-scheme", s.color_scheme);
  }

  // Site name + logo
  const logoEl = document.getElementById("siteLogo");
  if (s.logo_url) {
    logoEl.innerHTML = `<img class="logo-img" src="${s.logo_url}" alt="${s.site_name || "BaghdadLaptop"}" />`;
  } else {
    const name = s.site_name || "BaghdadLaptop";
    logoEl.innerHTML = `<span class="logo-mark">${name.charAt(0)}</span><span>${name}</span>`;
  }

  // Marquee
  const marqueeBar = document.getElementById("marqueeBar");
  if (s.marquee_enabled === false) {
    marqueeBar.style.display = "none";
  } else {
    marqueeBar.style.display = "block";
    document.getElementById("mq1").textContent = s.marquee_text_1 || "";
    document.getElementById("mq2").textContent = s.marquee_text_2 || "";
    document.getElementById("mq3").textContent = s.marquee_text_3 || "";
  }

  // Footer contact info
  if (s.contact_phone_1) document.getElementById("footerPhone1").innerHTML = `&#9742; <span>${s.contact_phone_1}</span>`;
  if (s.contact_phone_2) document.getElementById("footerPhone2").innerHTML = `&#9742; <span>${s.contact_phone_2}</span>`;
  if (s.contact_email_1) document.getElementById("footerEmail1").innerHTML = `&#9993; <span>${s.contact_email_1}</span>`;
  if (s.contact_email_2) document.getElementById("footerEmail2").innerHTML = `&#9993; <span>${s.contact_email_2}</span>`;
  if (s.contact_address) document.getElementById("footerAddress").innerHTML = `&#127968; <span>${s.contact_address}</span>`;

  // Social links
  const fb = document.getElementById("socialFb");
  const ig = document.getElementById("socialIg");
  const wa = document.getElementById("socialWa");
  const tg = document.getElementById("socialTg");
  if (s.social_facebook) { fb.href = s.social_facebook; fb.style.display = "grid"; }
  if (s.social_instagram) { ig.href = s.social_instagram; ig.style.display = "grid"; }
  if (s.social_whatsapp) { wa.href = `https://wa.me/${s.social_whatsapp.replace(/[^0-9]/g, "")}`; wa.style.display = "grid"; }
  if (s.social_telegram) { tg.href = s.social_telegram; tg.style.display = "grid"; }

  // Copyright
  document.getElementById("footerCopyright").innerHTML = `&copy; ${new Date().getFullYear()} ${s.site_name || "BaghdadLaptop"}. All rights reserved.`;
}

// Mobile menu
document.getElementById("menuToggle")?.addEventListener("click", () => {
  document.getElementById("navLinks").classList.toggle("open");
});

document.getElementById("openCart").addEventListener("click", (e) => { e.preventDefault(); openCart(); });
document.getElementById("closeCart").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
window.closeCart = closeCart;

window.addEventListener("cart:change", renderCart);

// Initial load
(async () => {
  try {
    const [products, settings] = await Promise.all([fetchProducts(), fetchSettings()]);
    applySettings(settings);
    renderProducts(products);
  } catch {
    grid.innerHTML = `<div class="empty-state"><div class="big">&#9888;</div>Couldn't load products. Please refresh.</div>`;
  }
  renderCart();
})();
