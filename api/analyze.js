export const config = {
  runtime: "nodejs",
};

async function verifyGumroadLicense(licenseKey) {
  const productPermalink = process.env.GUMROAD_PRODUCT_PERMALINK;
  if (!productPermalink) throw new Error("Missing GUMROAD_PRODUCT_PERMALINK");

  const body = new URLSearchParams({
    product_permalink: productPermalink,
    license_key: licenseKey,
  });

  const r = await fetch("https://api.gumroad.com/v2/licenses/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await r.json();
  return Boolean(data?.success);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { code, language, licenseKey } = req.body || {};
    const lk = licenseKey || req.headers["x-license-key"];

    if (!code) return res.status(400).json({ error: "No code provided" });
    if (!lk) return res.status(401).json({ error: "License required" });

    const ok = await verifyGumroadLicense(lk);
    if (!ok) return res.status(403).json({ error: "Invalid license" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Server missing OPENAI_API_KEY" });

    // OpenAI Responses API (recommended for new projects)
    const prompt = `
Return ONLY valid JSON in this exact format:
{
  "score": number (0-100),
  "issues": [
    {"type":"error|warning|info","title":"string","description":"string"}
  ],
  "suggestions": ["string"],
  "summary": "string"
}

Analyze this ${language || "code"}:
${code}
`;

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(502).json({ error: "AI provider error", detail: t.slice(0, 500) });
    }

    const data = await r.json();
    // Iš Responses API ištraukiam tekstą
    const text =
      data.output?.[0]?.content?.find?.((c) => c.type === "output_text")?.text ||
      data.output_text ||
      "";

    // Bandome parse'inti JSON, jei nepavyksta – grąžinam kaip tekstą
    try {
      const parsed = JSON.parse(text);
      return res.status(200).json(parsed);
    } catch {
      return res.status(200).json({ raw: text });
    }
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e?.message || e) });
  }
}
