const currentLanguage = "javascript"; // arba gali pritaikyti dropdown pasirinkimui

document.getElementById('analyzeBtn').addEventListener('click', async () => {
    const code = document.getElementById('codeInput').value.trim();
    const customPrompt = document.getElementById('customPrompt').value.trim();

    if (!code) return alert('Įveskite kodą analizei!');

    const resultsPanel = document.getElementById('resultsPanel');
    resultsPanel.innerHTML = `<div class="loading"><span>AI analizuoja kodą...</span></div>`;

    try {
        const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, language: currentLanguage, customPrompt })
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const data = await res.json();

        resultsPanel.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (err) {
        console.error(err);
        resultsPanel.innerHTML = `<div class="error">Nepavyko atlikti AI analizės: ${err.message}</div>`;
    }
});