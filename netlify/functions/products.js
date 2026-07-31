// GET  /api/products       -> list all products
// GET  /api/products?id=X  -> single product
// POST /api/products       -> create product  { name, brand, price, stock, ... }
// PATCH /api/products       -> update status/stock { id, status }
// DELETE /api/products       -> delete product { id }

import { getCollection, ensureSeedData } from "./_mongo.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    statusCode,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

export async function handler(event, context) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  try {
    await ensureSeedData();
    const products = await getCollection("products");

    // GET all / single
    if (event.httpMethod === "GET") {
      const params = event.queryStringParameters || {};
      if (params.id) {
        const { ObjectId } = await import("mongodb");
        let query;
        try { query = { _id: new ObjectId(params.id) }; } catch { query = { id: params.id }; }
        const product = await products.findOne(query);
        if (!product) return json(404, { error: "Product not found" });
        return json(200, { product });
      }
      const all = await products.find({}).toArray();
      return json(200, { products: all });
    }

    // POST create
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      if (!body.name || body.price == null) return json(400, { error: "name and price are required" });
      const doc = {
        ...body,
        id: body.id || "p" + Date.now().toString(36),
        stock: body.stock ?? 0,
        status: body.status || "active",
        createdAt: new Date().toISOString(),
      };
      const result = await products.insertOne(doc);
      return json(201, { product: { ...doc, _id: result.insertedId } });
    }

    // PATCH update
    if (event.httpMethod === "PATCH") {
      const body = JSON.parse(event.body || "{}");
      if (!body.id) return json(400, { error: "id is required" });
      const { ObjectId } = await import("mongodb");
      let query;
      try { query = { _id: new ObjectId(body.id) }; } catch { query = { id: body.id }; }
      const update = { ...body };
      delete update.id;
      delete update._id;
      const result = await products.findOneAndUpdate(query, { $set: update }, { returnDocument: "after" });
      if (!result) return json(404, { error: "Product not found" });
      return json(200, { product: result });
    }

    // DELETE
    if (event.httpMethod === "DELETE") {
      const body = JSON.parse(event.body || "{}");
      if (!body.id) return json(400, { error: "id is required" });
      const { ObjectId } = await import("mongodb");
      let query;
      try { query = { _id: new ObjectId(body.id) }; } catch { query = { id: body.id }; }
      const result = await products.deleteOne(query);
      return json(200, { deleted: result.deletedCount });
    }

    return json(405, { error: "Method not allowed" });
  } catch (err) {
    return json(500, { error: "Database error", detail: err.message });
  }
}
