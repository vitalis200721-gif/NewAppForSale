import express from "express";
import cors from "cors";



const app = express();
app.use(cors()); // <-- pridėti
app.use(express.json());
app.use(express.static("public"));

app.post("/api/analyze", (req, res) => {
  console.log("GOT:", req.body);
  res.json({
    content: [
      {
        text: JSON.stringify({
          score: 90,
          issues: [
            {
              type: "success",
              title: "Testinė analizė",
              description: "Kodas atrodo tvarkingas!"
            }
          ],
          suggestions: ["Galėtum optimizuoti funkcijų pavadinimus"],
          summary: "Kodas patikrintas sėkmingai."
        })
      }
    ]
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveris veikia: http://localhost:${PORT}`);
});






