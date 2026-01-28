import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Statinių failų servinimas iš public aplanko
app.use(express.static(path.join(__dirname, "public")));

const PORT = 3000;

app.post("/api/analyze", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Nėra kodo!" });

  const fakeAIResponse = {
    summary: `Analizė sėkminga! Kodo ilgis: ${code.length} simbolių.`,
    issues: [],
    suggestion: "Viskas atrodo gerai testinėje versijoje.",
  };

  res.json(fakeAIResponse);
});

app.listen(PORT, () => {
  console.log(`Serveris veikia http://localhost:${PORT}`);
});