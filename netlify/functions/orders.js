// GET  /api/orders       -> list all orders (dashboard)
// POST /api/orders       -> create new order (checkout)
// PATCH /api/orders       -> update order status { id, status }

import { getCollection, getDb } from "./_mongo.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    statusCode,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function generateOrderNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "LS-";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function handler(event, context) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  try {
    const orders = await getCollection("orders");

    // GET all
    if (event.httpMethod === "GET") {
      const all = await orders.find({}).sort({ createdAt: -1 }).toArray();
      return json(200, { orders: all });
    }

    // POST create
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      if (!body.customer || !body.items || !body.items.length) {
        return json(400, { error: "customer and items are required" });
      }

      const orderNumber = generateOrderNumber();
      const order = {
        orderNumber,
        customer: body.customer,
        items: body.items,
        subtotal: body.subtotal || 0,
        deliveryFee: body.deliveryFee || 150,
        total: body.total || 0,
        paymentMethod: "COD",
        status: "Pending",
        createdAt: new Date().toISOString(),
        date: new Date().toISOString().slice(0, 10),
      };

      const result = await orders.insertOne(order);

      // Upsert customer record for the dashboard
      const db = await getDb();
      const customers = db.collection("customers");
      await customers.updateOne(
        { email: body.customer.email },
        {
          $set: {
            name: body.customer.name,
            email: body.customer.email,
            phone: body.customer.phone,
            lastOrder: orderNumber,
          },
          $setOnInsert: { joined: new Date().toISOString().slice(0, 10) },
          $inc: { orders: 1 },
        },
        { upsert: true }
      );

      return json(201, { order: { ...order, _id: result.insertedId } });
    }

    // PATCH update status
    if (event.httpMethod === "PATCH") {
      const body = JSON.parse(event.body || "{}");
      if (!body.id) return json(400, { error: "id is required" });
      const { ObjectId } = await import("mongodb");
      let query;
      try { query = { _id: new ObjectId(body.id) }; } catch { query = { orderNumber: body.id }; }
      const result = await orders.findOneAndUpdate(
        query,
        { $set: { status: body.status } },
        { returnDocument: "after" }
      );
      if (!result) return json(404, { error: "Order not found" });
      return json(200, { order: result });
    }

    return json(405, { error: "Method not allowed" });
  } catch (err) {
    return json(500, { error: "Database error", detail: err.message });
  }
}
