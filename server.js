import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// TEST route (nebūtina, bet labai padeda)
app.get("/", (req, res) => {
  res.send("API veikia 🚀");
});

// AI ANALYZE ROUTE (TAVO KODAS)
app.post("/api/analyze", async (req, res) => {
  try {
    const { code, language, customPrompt } = req.body;

    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a senior software engineer analyzing code."
          },
          {
            role: "user",
            content: `
Analyze this ${language} code.
${customPrompt || ""}

CODE:
${code}
`
          }
        ]
      })
    });

    const aiData = await aiRes.json();

    res.json({
      summary: aiData.choices?.[0]?.message?.content || "No response from AI"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI analysis failed" });
  }
});

// PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Serveris paleistas ant porto", PORT);
});