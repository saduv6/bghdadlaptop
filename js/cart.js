// Cart module — localStorage persistence, shared across storefront + checkout

const CART_KEY = "ls_cart_v1";

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cart:change", { detail: items }));
}

export function addToCart(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find((i) => i.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
      specs: product.specs,
      qty,
    });
  }
  saveCart(cart);
}

export function updateQty(id, qty) {
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (item) {
    item.qty = Math.max(1, qty);
    saveCart(cart);
  }
}

export function removeFromCart(id) {
  const cart = getCart().filter((i) => i.id !== id);
  saveCart(cart);
}

export function clearCart() {
  saveCart([]);
}

export function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

export function cartSubtotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

export const DELIVERY_FEE = 150;
