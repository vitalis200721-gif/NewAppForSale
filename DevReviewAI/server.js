import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("./")); // čia tavo index.html folderis

// AI analizės endpointas
app.post("/api/analyze", async (req, res) => {
    const { code, language, customPrompt } = req.body;

    // čia vieta, kur jungiasi tavo AI API
    // čia pateikiamas tik testinis atsakymas:
    res.json({
        content: [
            {
                text: JSON.stringify({
                    score: 85,
                    issues: [
                        {
                            type: "success",
                            title: "Testinė analizė",
                            description: "Kodas atrodo tvarkingas!"
                        }
                    ],
                    suggestions: ["Galėtum optimizuoti kintamųjų pavadinimus"],
                    summary: "Kodas patikrintas sėkmingai."
                })
            }
        ]
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveris veikia: http://localhost:${PORT}`));
