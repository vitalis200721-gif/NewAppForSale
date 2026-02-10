const VERSION = "v-2026-02-10-1";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // saugus body parse
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }

    const { code, language } = body || {};

    if (!code || typeof code !== "string") {
      return res.status(200).json({ ok: true, version: VERSION });

    }

    // 🔒 laikinas fake AI (kad niekas nelūžtų)
    const result = {
      score: 92,
      issues: [
        {
          type: "success",
          title: "Code structure",
          description: "Code is well structured."
        },
        {
          type: "warning",
          title: "Comments",
          description: "Consider adding more comments."
        }
      ],
      suggestions: [
        "Use const instead of let where possible",
        "Split logic into smaller functions"
      ],
      summary: "Overall clean code with minor improvements."
    };

    return res.status(200).json(result);
  } catch (err) {
    console.error("ANALYZE ERROR:", err);
    return res.status(500).json({
      error: "Server error",
      message: err.message || "Unknown error"
    });
  }
}
