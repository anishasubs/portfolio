// Vercel Serverless Function — financial-advice endpoint for Ledger
// (finance/index.html on the portfolio site).
//
// The client sends a redacted summary of the user's finances — balances,
// category totals, aggregates. It never sends individual transactions,
// merchant names, or account numbers; see buildAdvisorContext() in the app.
//
// The system prompt lives here rather than in the client so it cannot be
// edited from the browser, and so behaviour stays consistent.

const ALLOWED_ORIGINS = [
  "https://anishasubs.github.io",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:8000",
  "http://localhost:3000",
];

// Tighter than the chat endpoint: each call carries a large context and
// these are deliberate, considered questions rather than rapid chat.
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const MAX_BODY_BYTES = 24_000;
const MAX_QUESTION_CHARS = 1_000;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `You are a careful personal-finance assistant built into a private budgeting app. The user is asking about their own money and has shared a summary of their accounts.

WHAT YOU RECEIVE
A JSON summary: account balances by type, monthly spending by category, income, savings rate, budgets, goals, and 401(k) details. Individual transactions and merchant names are deliberately withheld — do not ask for them.

HOW TO ANSWER
- Lead with the specific number. "Keep about $6,200 in checking" beats "consider keeping a buffer."
- Show the arithmetic in one line so the user can check it. Use the figures you were given.
- Order recommendations by what actually earns the most: capture the full employer 401(k) match first, then clear high-interest debt, then build the emergency fund, then invest.
- Be concrete about trade-offs and name the assumption behind each number.
- Keep it tight. Short sections with headers, no filler, no restating the question.
- If a figure you need is missing from the summary, say which one and give the answer conditionally.

CRITICAL LIMITS — you must respect these
- You have NO live data. You cannot look up current savings rates, fund prices, contribution limits, or tax brackets. Never state a current APY, a specific bank's rate, a fund's return, or this year's IRS limit as fact. Describe what to look for and tell the user to verify the current number.
- Recommend fund TYPES and allocations (for example "a low-cost total-market index fund", "roughly 90/10 stocks to bonds at a long horizon"). If the user lists their actual 401(k) fund menu, you may discuss those specific options, focusing on expense ratios and diversification. Never recommend individual stocks, market timing, or anything speculative.
- You are not a licensed advisor and this is general education, not personalized professional advice. Say so once, briefly, at the end — not as a long disclaimer, and not at the start.
- For anything with tax or legal consequence (Roth conversions, early withdrawal, backdoor contributions, inherited accounts), give the general shape and recommend a CPA or fiduciary advisor before acting.
- Never invent a number that was not given to you or derived from what was given.

FORMAT
Plain markdown: short paragraphs, ## headers, bullets, bold for the key figures. No tables wider than three columns. Aim for under 450 words unless the question genuinely needs more.`;

export default async function handler(req: any, res: any) {
  const origin = req.headers?.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "https://anishasubs.github.io");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server misconfigured: missing API key" });
  }

  try {
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Expected a JSON body" });
    }

    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question) {
      return res.status(400).json({ error: "Missing 'question'" });
    }
    if (question.length > MAX_QUESTION_CHARS) {
      return res.status(400).json({ error: "Question is too long" });
    }
    if (!body.context || typeof body.context !== "object") {
      return res.status(400).json({ error: "Missing 'context'" });
    }

    const contextJson = JSON.stringify(body.context);
    if (contextJson.length > MAX_BODY_BYTES) {
      return res.status(413).json({ error: "Financial summary is too large" });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content:
          "Here is my current financial summary as JSON:\n\n```json\n" +
          contextJson +
          "\n```\n\nMy question: " +
          question,
      },
    ];

    const call = (model: string) =>
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 1400 }),
      });

    const preferred = process.env.ADVICE_MODEL || "gpt-4o";
    let openaiRes = await call(preferred);

    // Fall back to the model the rest of this project already uses if the
    // preferred one isn't available on this account.
    if (!openaiRes.ok && (openaiRes.status === 404 || openaiRes.status === 400)) {
      openaiRes = await call("gpt-4o-mini");
    }

    if (!openaiRes.ok) {
      // Deliberately not logging the body — it contains the user's finances.
      console.error("Advice upstream error, status:", openaiRes.status);
      return res.status(openaiRes.status).json({ error: "The AI service returned an error." });
    }

    const data = await openaiRes.json();
    const answer = data?.choices?.[0]?.message?.content;
    if (!answer) return res.status(502).json({ error: "Empty response from the AI service." });

    return res.status(200).json({ answer, model: data.model });
  } catch (error) {
    // Log the error type only, never the request body.
    console.error("Advice proxy error:", (error as Error)?.name);
    return res.status(500).json({ error: "Internal proxy error" });
  }
}
