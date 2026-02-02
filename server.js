import express from "express";
import cors from "cors";
import fetch from "node-fetch"; // npm install node-fetch

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.post("/api/analyze", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided" });

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

    // tiesiogiai grąžiname LLaMA atsakymą front-end
    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI server unreachable" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveris veikia: http://localhost:${PORT}`);
});







