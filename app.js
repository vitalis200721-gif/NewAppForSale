import { useState } from "react";

function App() {
  const [code, setCode] = useState("console.log('Hello world');");
  const [result, setResult] = useState("");

  const analyzeCode = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }) 
      });

      const data = await res.json();
      setResult(data.summary || data.error);
    } catch (err) {
      console.error("Fetch error:", err);
      setResult("Server error");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>AI Code Analyzer</h1>
      <textarea
        rows={10}
        cols={50}
        value={code}
        onChange={e => setCode(e.target.value)}
      />
      <br />
      <button onClick={analyzeCode}>Analyze Code</button>
      <h2>Result:</h2>
      <pre>{result}</pre>
    </div>
  );
}

export default App;
