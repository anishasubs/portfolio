// Vercel Serverless Function — Oura Ring OAuth token exchange & refresh

const ALLOWED_ORIGINS = [
  "https://anishasubs.github.io",
  "http://localhost:5173",
  "http://localhost:4173",
];

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

export default async function handler(req: any, res: any) {
  const origin = req.headers?.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "https://anishasubs.github.io");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
  }

  const clientId = process.env.OURA_CLIENT_ID;
  const clientSecret = process.env.OURA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Server misconfigured: missing Oura credentials" });
  }

  try {
    const { action, code, redirectUri, refreshToken } = req.body;

    // Debug: check env var values (first/last chars only)
    if (action === "debug") {
      return res.status(200).json({
        clientIdLength: clientId.length,
        clientIdPrefix: clientId.substring(0, 8),
        clientIdSuffix: clientId.substring(clientId.length - 4),
        secretLength: clientSecret.length,
      });
    }

    if (action === "exchange") {
      if (!code || !redirectUri) {
        return res.status(400).json({ error: "Missing required fields: code, redirectUri" });
      }

      const tokenRes = await fetch("https://api.ouraring.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      const data = await tokenRes.json();
      if (!tokenRes.ok) {
        return res.status(tokenRes.status).json({ error: data.error_description || data.error || "Token exchange failed" });
      }

      return res.status(200).json({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in || 86400) * 1000,
      });
    }

    if (action === "refresh") {
      if (!refreshToken) {
        return res.status(400).json({ error: "Missing required field: refreshToken" });
      }

      const tokenRes = await fetch("https://api.ouraring.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      const data = await tokenRes.json();
      if (!tokenRes.ok) {
        return res.status(tokenRes.status).json({ error: data.error_description || data.error || "Token refresh failed" });
      }

      return res.status(200).json({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in || 86400) * 1000,
      });
    }

    if (action === "fetch") {
      const { accessToken, endpoints } = req.body;
      if (!accessToken || !endpoints || !Array.isArray(endpoints)) {
        return res.status(400).json({ error: "Missing required fields: accessToken, endpoints (array)" });
      }

      const results: Record<string, any> = {};
      for (const endpoint of endpoints) {
        try {
          const apiRes = await fetch(`https://api.ouraring.com/v2/usercollection/${endpoint}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          results[endpoint] = apiRes.ok ? await apiRes.json() : { error: `${apiRes.status}` };
        } catch (e) {
          results[endpoint] = { error: "fetch failed" };
        }
      }

      return res.status(200).json(results);
    }

    return res.status(400).json({ error: "Invalid action. Use 'exchange', 'refresh', or 'fetch'." });
  } catch (error) {
    console.error("Oura proxy error:", error);
    return res.status(500).json({ error: "Internal proxy error" });
  }
}
