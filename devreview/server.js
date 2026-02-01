import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API OK");
});

app.post("/api/analyze", async (req, res) => {
  const { code } = req.body;

  const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "user", content: code }
      ]
    })
  });

  const data = await aiRes.json();
  res.json({ text: data.choices[0].message.content });
});

app.listen(3000, () => {
  console.log("RUNNING http://localhost:3000");
});
