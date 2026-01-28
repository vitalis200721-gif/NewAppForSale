const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(".")); // leidžia atidaryti index.html

app.post("/api/analyze", async (req, res) => {
  const { code, language, customPrompt } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  let prompt = `
You are a professional ${language} code reviewer.
Review the following code and respond STRICTLY in JSON format.

JSON format:
{
  "score": number (0-100),
  "issues": [
    { "type": "error|warning|success", "title": "...", "description": "..." }
  ],
  "suggestions": ["..."],
  "summary": "..."
}
`;

  if (customPrompt) {
    prompt += `\nSpecial focus: ${customPrompt}\n`;
  }

  prompt += `\nCODE:\n\`\`\`${language}\n${code}\n\`\`\``;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    res.json(result ?? { error: "Invalid AI response", raw: text });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI request failed" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});