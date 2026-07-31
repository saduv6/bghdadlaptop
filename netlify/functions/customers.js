// GET /api/customers -> list all customers (dashboard)

import { getCollection } from "./_mongo.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const customers = await getCollection("customers");
    const all = await customers.find({}).sort({ joined: -1 }).toArray();
    return json(200, { customers: all });
  } catch (err) {
    return json(500, { error: "Database error", detail: err.message });
  }
}
