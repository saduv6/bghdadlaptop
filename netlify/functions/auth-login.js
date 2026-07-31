// POST /api/auth-login -> admin login { username, password }
// Returns a simple signed-ish token (demo). For production, swap in JWT.

import { getCollection, ensureSeedData } from "./_mongo.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    await ensureSeedData();
    const users = await getCollection("users");

    const { username, password } = JSON.parse(event.body || "{}");
    if (!username || !password) return json(400, { error: "Username and password required" });

    const user = await users.findOne({ username, password });
    if (!user) return json(401, { error: "Invalid credentials" });

    // Demo token — replace with a real JWT + secret in production
    const token = Buffer.from(`${user.username}:${Date.now()}`).toString("base64");

    return json(200, {
      token,
      user: { username: user.username, role: user.role || "admin" },
    });
  } catch (err) {
    return json(500, { error: "Database error", detail: err.message });
  }
}
