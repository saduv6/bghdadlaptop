import { createClient } from "@supabase/supabase-js";
import { sampleProducts } from "./sample-data.js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- Site settings ---------- */
export async function fetchSettings() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function saveSettings(settings) {
  const { data, error } = await supabase
    .from("site_settings")
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

/* ---------- Products ---------- */
export async function fetchProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });
  if (error || !data || !data.length) return sampleProducts;
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    price: Number(p.price),
    stock: p.stock,
    specs: p.specs,
    image: p.image,
    status: p.status,
  }));
}

export async function saveProduct(product) {
  if (product.id && product.id.length === 36) {
    const { data, error } = await supabase
      .from("products")
      .update({
        name: product.name,
        brand: product.brand,
        price: product.price,
        stock: product.stock,
        specs: product.specs,
        image: product.image,
        status: product.status,
      })
      .eq("id", product.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: product.name,
      brand: product.brand,
      price: product.price,
      stock: product.stock,
      specs: product.specs,
      image: product.image,
      status: product.status,
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/* ---------- Orders ---------- */
export async function createOrder(order) {
  const orderNumber = "BL-" + Date.now().toString(36).toUpperCase();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_name: order.customer.name,
      customer_email: order.customer.email,
      customer_phone: order.customer.phone,
      customer_address: order.customer.address,
      customer_city: order.customer.city,
      customer_pincode: order.customer.pincode,
      notes: order.customer.notes || "",
      items: order.items,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee,
      total: order.total,
      payment_method: order.paymentMethod || "COD",
      status: "Pending",
    })
    .select()
    .maybeSingle();
  if (error) {
    return { ...order, orderNumber, status: "Pending" };
  }
  return {
    id: data.id,
    orderNumber: data.order_number,
    status: data.status,
    total: Number(data.total),
    customer: {
      name: data.customer_name,
      email: data.customer_email,
      phone: data.customer_phone,
      address: data.customer_address,
      city: data.customer_city,
      pincode: data.customer_pincode,
    },
  };
}

export async function fetchOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    customer: o.customer_name,
    email: o.customer_email,
    phone: o.customer_phone,
    address: o.customer_address,
    city: o.customer_city,
    pincode: o.customer_pincode,
    notes: o.notes,
    items: o.items || [],
    subtotal: Number(o.subtotal) || 0,
    deliveryFee: Number(o.delivery_fee) || 0,
    total: Number(o.total) || 0,
    status: o.status,
    date: o.created_at,
  }));
}

export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select()
    .maybeSingle();
  if (error) return { id: orderId, status };
  return { id: data.id, status: data.status };
}

/* ---------- Customers (derived from orders) ---------- */
export async function fetchCustomers() {
  const { data, error } = await supabase
    .from("orders")
    .select("customer_name, customer_email, customer_phone, created_at");
  if (error || !data) return [];
  const map = {};
  data.forEach((o) => {
    const key = o.customer_email || o.customer_phone;
    if (!key) return;
    if (!map[key]) {
      map[key] = {
        name: o.customer_name,
        email: o.customer_email,
        phone: o.customer_phone,
        orders: 0,
        joined: o.created_at,
      };
    }
    map[key].orders++;
  });
  return Object.values(map);
}

/* ---------- Auth (local-only for dashboard) ---------- */
export async function adminLogin(username, password) {
  if (username === "admin" && password === "admin123") {
    return { token: "session-" + Date.now(), user: { username: "admin", role: "admin" } };
  }
  throw new Error("Invalid credentials");
}
