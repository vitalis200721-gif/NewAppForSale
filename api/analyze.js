// api/analyze.js
// Vercel Serverless Function: POST https://your-site.vercel.app/api/analyze

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
  // Vercel dažnai jau paduoda req.body kaip objektą, bet kartais būna string.
  if (req.body && typeof req.body === "object") return req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");

  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function formUrlEncoded(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
}

async function verifyGumroadLicense({ productPermalink, licenseKey }) {
  const url = "https://api.gumroad.com/v2/licenses/verify";
  const body = formUrlEncoded({
    product_permalink: productPermalink,
    license_key: licenseKey,
    // galima pridėti: increment_uses_count: "false"
  });

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await r.json().catch(() => ({}));
  // Gumroad grąžina { success: true/false, ... }
  return Boolean(data && data.success);
}

async function callAI({ code, language }) {
  const apiKey = process.env.OPENAI_API_KEY;

  // ✅ Jei nėra AI key – testui grąžinam server-side demo (kad nelūžtų 500)
  if (!apiKey) {
    return {
      score: 85,
      issues: [
        { type: "success", title: "API working", description: "Server returned a valid JSON response." },
        { type: "warning", title: "AI key missing", description: "Set OPENAI_API_KEY in Vercel to enable real AI." }
      ],
      suggestions: ["Add OPENAI_API_KEY env var on Vercel", "Then redeploy"],
      summary: `Demo response. Language=${language || "unknown"}. Code length=${code?.length || 0}.`
    };
  }

  // --- čia lieka tavo realus OpenAI kvietimas kaip buvo ---
  const system = `You are a senior developer performing a strict code review.
Return ONLY valid JSON in this exact format:
{
  "score": number,
  "issues": [
    {"type":"error|warning|success","title":"string","description":"string"}
  ],
  "suggestions": ["string"],
  "summary": "string"
}
No extra text.`;

  const user = `Language: ${language || "unknown"}
Analyze this code:
${code}`;

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  const data = await r.json().catch(() => ({}));
  const content = data?.choices?.[0]?.message?.content || "";

  try {
    return JSON.parse(content);
  } catch {
    return {
      score: 70,
      issues: [{ type: "warning", title: "AI output not valid JSON", description: content.slice(0, 200) }],
      suggestions: [],
      summary: content.slice(0, 500) || "No output",
    };
  }
}


module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return send(res, 405, { error: "Method Not Allowed" });
    }

    const body = await readJsonBody(req);
    const code = (body.code || "").trim();
    const language = (body.language || "").trim();
    const licenseKey = (body.licenseKey || body.license || "").trim();

    if (!code) return send(res, 400, { error: "No code provided" });

    // 1) DEV bypass (kad tau nereikėtų pirkti)
    // Vercel ENV: DEV_LICENSE_KEY=DEV-OK-12345 (pvz)
    const devKey = process.env.DEV_LICENSE_KEY;
    const isDevBypass = devKey && licenseKey === devKey;

    // 2) PRO tikrinimas
    if (!isDevBypass) {
      if (!licenseKey) return send(res, 403, { error: "License required" });

      const productPermalink = process.env.GUMROAD_PRODUCT_PERMALINK;
      if (!productPermalink) {
        return send(res, 500, { error: "Server misconfigured: missing GUMROAD_PRODUCT_PERMALINK" });
      }

      const valid = await verifyGumroadLicense({
        productPermalink,
        licenseKey,
      });

      if (!valid) return send(res, 403, { error: "Invalid license" });
    }

    // 3) AI analizė (tik jei praėjo licenciją arba DEV bypass)
    const result = await callAI({ code, language });

    return send(res, 200, result);
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: "Server error", details: String(err?.message || err) });
  }
};
