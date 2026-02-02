import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const GUMROAD_PRODUCT_ID = "YOUR_GUMROAD_PRODUCT_ID"; // čia įrašyk savo produktą

// Funkcija patikrinti prenumeratą
async function checkGumroadLicense(purchaseCode) {
  const res = await fetch(`https://api.gumroad.com/v2/licenses/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `product_permalink=${GUMROAD_PRODUCT_ID}&license_key=${purchaseCode}`
  });

  const data = await res.json();
  return data.success; // true, jei vartotojas tikrai nusipirkęs
}

// AI analizės endpoint
app.post("/api/analyze", async (req, res) => {
  const { code, license } = req.body;

  if (!code) return res.status(400).json({ error: "No code provided" });
  if (!license) return res.status(403).json({ error: "Premium required! Please buy a license." });

  // Patikrinam licenciją
  const valid = await checkGumroadLicense(license);
  if (!valid) return res.status(403).json({ error: "Invalid license! Please buy premium." });

  try {
    const aiResponse = await fetch("http://127.0.0.1:8080/v1/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `
Return ONLY valid JSON in this exact format:
{
  "score": number (0-100),
  "issues": [
    {"type":"error|warning|info","title":"string","description":"string"}
  ],
  "suggestions": ["string"],
  "summary": "string"
}

Analyze this code:
${code}
        `,
        max_tokens: 300
      })
    });

    const data = await aiResponse.json();
    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI server unreachable" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Serveris veikia: http://localhost:${PORT}`));
