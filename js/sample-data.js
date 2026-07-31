// Sample product data — used as a fallback when the Netlify API isn't
// reachable (local dev, before deployment). On a deployed site these are
// replaced by whatever lives in your MongoDB Atlas `products` collection.

export const sampleProducts = [
  {
    id: "p1",
    name: "ProBook 14 Ultra",
    brand: "Nexus",
    price: 74999,
    stock: 12,
    image: "https://images.unsplash.com/photo-1496181133206-56db36b71d1d?auto=format&fit=crop&w=600&q=80",
    specs: "Intel i7 / 16GB RAM / 512GB SSD / 14\" FHD",
    status: "active",
  },
  {
    id: "p2",
    name: "AirLite 13 Slim",
    brand: "Lumen",
    price: 52999,
    stock: 24,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
    specs: "Intel i5 / 8GB RAM / 256GB SSD / 13\" QHD",
    status: "active",
  },
  {
    id: "p3",
    name: "GamerForce X17",
    brand: "Vortex",
    price: 129999,
    stock: 6,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80",
    specs: "Ryzen 7 / 32GB / 1TB SSD / RTX 4060 / 17\" 144Hz",
    status: "active",
  },
  {
    id: "p4",
    name: "BizBook 15 Pro",
    brand: "Nexus",
    price: 61999,
    stock: 18,
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80",
    specs: "Intel i5 / 16GB / 512GB SSD / 15.6\" FHD",
    status: "active",
  },
  {
    id: "p5",
    name: "StudioBook 16 Creator",
    brand: "Lumen",
    price: 99999,
    stock: 8,
    image: "https://images.unsplash.com/photo-1531492746076-1610796f342e?auto=format&fit=crop&w=600&q=80",
    specs: "Ryzen 9 / 32GB / 1TB SSD / 16\" OLED / RTX 4070",
    status: "active",
  },
  {
    id: "p6",
    name: "EduLite 12 Go",
    brand: "Lumen",
    price: 34999,
    stock: 40,
    image: "https://images.unsplash.com/photo-1611180575133-322e3e6e9b6c?auto=format&fit=crop&w=600&q=80",
    specs: "Intel Celeron / 8GB / 128GB SSD / 12\" HD",
    status: "active",
  },
  {
    id: "p7",
    name: "UltraBook 15 Edge",
    brand: "Nexus",
    price: 87999,
    stock: 0,
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80",
    specs: "Intel i7 / 16GB / 1TB SSD / 15.6\" 2.8K OLED",
    status: "active",
  },
  {
    id: "p8",
    name: "GamerForce X15 Air",
    brand: "Vortex",
    price: 109999,
    stock: 3,
    image: "https://images.unsplash.com/photo-1525547719195-98d1adfa5c0a?auto=format&fit=crop&w=600&q=80",
    specs: "Ryzen 7 / 24GB / 1TB SSD / RTX 4050 / 15\" 165Hz",
    status: "active",
  },
];

export const sampleOrders = [
  { id: "LS-3K8M2N", customer: "Aarav Sharma", email: "aarav@example.com", phone: "9876543210", date: "2026-07-28", total: 74999, status: "Pending", items: [{ name: "ProBook 14 Ultra", qty: 1, price: 74999 }] },
  { id: "LS-2J7P1Q", customer: "Priya Iyer", email: "priya@example.com", phone: "9123456780", date: "2026-07-26", total: 129999, status: "Shipped", items: [{ name: "GamerForce X17", qty: 1, price: 129999 }] },
  { id: "LS-1H6O0P", customer: "Rohan Mehta", email: "rohan@example.com", phone: "9988776655", date: "2026-07-22", total: 87999, status: "Delivered", items: [{ name: "UltraBook 15 Edge", qty: 1, price: 87999 }] },
  { id: "LS-0G5N9O", customer: "Sneha Reddy", email: "sneha@example.com", phone: "9001234567", date: "2026-07-20", total: 52999, status: "Delivered", items: [{ name: "AirLite 13 Slim", qty: 1, price: 52999 }] },
  { id: "LS-9F4M8N", customer: "Karan Singh", email: "karan@example.com", phone: "9112233445", date: "2026-07-18", total: 99999, status: "Cancelled", items: [{ name: "StudioBook 16 Creator", qty: 1, price: 99999 }] },
];

export const sampleCustomers = [
  { id: "c1", name: "Aarav Sharma", email: "aarav@example.com", phone: "9876543210", orders: 1, joined: "2026-07-28" },
  { id: "c2", name: "Priya Iyer", email: "priya@example.com", phone: "9123456780", orders: 1, joined: "2026-07-26" },
  { id: "c3", name: "Rohan Mehta", email: "rohan@example.com", phone: "9988776655", orders: 1, joined: "2026-07-22" },
  { id: "c4", name: "Sneha Reddy", email: "sneha@example.com", phone: "9001234567", orders: 1, joined: "2026-07-20" },
  { id: "c5", name: "Karan Singh", email: "karan@example.com", phone: "9112233445", orders: 1, joined: "2026-07-18" },
];
