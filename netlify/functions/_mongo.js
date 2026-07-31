// Shared MongoDB connection — uses the connection-caching pattern so each
// serverless function invocation reuses a warm connection across cold starts.
// Docs: https://www.mongodb.com/docs/drivers/node/current/

import { MongoClient } from "mongodb";

// Cached connection survives across warm function invocations.
let cachedClient = null;
let cachedDb = null;

export async function getDb() {
  if (cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  cachedClient = new MongoClient(uri, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 10000,
  });

  await cachedClient.connect();
  cachedDb = cachedClient.db(process.env.MONGODB_DB || "nexus_laptops");

  return cachedDb;
}

export async function getCollection(name) {
  const db = await getDb();
  return db.collection(name);
}

// Seed the database with sample products + an admin user on first use.
// Safe to call repeatedly — it only inserts if the collection is empty.
export async function ensureSeedData() {
  const db = await getDb();

  const products = db.collection("products");
  if ((await products.countDocuments()) === 0) {
    await products.insertMany([
      { name: "ProBook 14 Ultra", brand: "Nexus", price: 74999, stock: 12, specs: 'Intel i7 / 16GB RAM / 512GB SSD / 14" FHD', image: "https://images.unsplash.com/photo-1496181133206-56db36b71d1d?auto=format&fit=crop&w=600&q=80", status: "active" },
      { name: "AirLite 13 Slim", brand: "Lumen", price: 52999, stock: 24, specs: 'Intel i5 / 8GB RAM / 256GB SSD / 13" QHD', image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80", status: "active" },
      { name: "GamerForce X17", brand: "Vortex", price: 129999, stock: 6, specs: 'Ryzen 7 / 32GB / 1TB SSD / RTX 4060 / 17" 144Hz', image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80", status: "active" },
      { name: "BizBook 15 Pro", brand: "Nexus", price: 61999, stock: 18, specs: 'Intel i5 / 16GB / 512GB SSD / 15.6" FHD', image: "https://images.unsplash.com/photo-1541807084-5c52b6b71d8f?auto=format&fit=crop&w=600&q=80", status: "active" },
      { name: "StudioBook 16 Creator", brand: "Lumen", price: 99999, stock: 8, specs: 'Ryzen 9 / 32GB / 1TB SSD / 16" OLED / RTX 4070', image: "https://images.unsplash.com/photo-1531492746076-1610796f342e?auto=format&fit=crop&w=600&q=80", status: "active" },
      { name: "EduLite 12 Go", brand: "Lumen", price: 34999, stock: 40, specs: 'Intel Celeron / 8GB / 128GB SSD / 12" HD', image: "https://images.unsplash.com/photo-1611180575133-322e3e3c3e6e?auto=format&fit=crop&w=600&q=80", status: "active" },
    ]);
  }

  const users = db.collection("users");
  if ((await users.countDocuments({ username: "admin" })) === 0) {
    await users.insertOne({ username: "admin", password: "admin123", role: "admin" });
  }
}
