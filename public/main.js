let reviewHistory = [];
let statistics = { totalReviews: 0, averageScore: 0 };

const analyzeBtn = document.getElementById("analyzeBtn");
const codeInput = document.getElementById("codeInput");
const resultsPanel = document.getElementById("resultsPanel");
const totalReviewsEl = document.getElementById("totalReviews");
const avgScoreEl = document.getElementById("avgScore");

analyzeBtn.addEventListener("click", analyzeCode);

// Load from localStorage
loadFromStorage();
updateStatsUI();

async function analyzeCode() {
  const code = codeInput.value.trim();
  const license = prompt("Enter your premium license key"); // or save license in localStorage

  if (!code) { 
    alert("Please paste your code!"); 
    return; 
  }

  resultsPanel.innerHTML = "Analyzing...";

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, license })
    });

    const data = await response.json();

    if (data.error) {
      resultsPanel.innerHTML = `❌ ${data.error}`;
      return;
    }

    let aiResponse;
    try { 
      aiResponse = JSON.parse(data.choices[0].text); 
    } catch {
      aiResponse = {
        score: 70,
        issues: [],
        suggestions: [],
        summary: "AI did not return valid JSON."
      }; 
    }

    renderResult(aiResponse);
    saveReview(aiResponse);

  } catch (err) {
    console.error(err);
    resultsPanel.textContent = "❌ Error connecting to the AI server.";
  }
}



function renderResult(result) {
  let html = `<h3>Score: ${result.score}</h3>`;
  html += `<p>${result.summary}</p>`;

  if (result.issues && result.issues.length > 0) {
    html += `<h4>Issues:</h4>`;
    result.issues.forEach(issue => {
      html += `<div class="issue ${issue.type}"><strong>${issue.title}</strong>: ${issue.description}</div>`;
    });
  }

  if (result.suggestions && result.suggestions.length > 0) {
    html += `<h4>Suggestions:</h4><ul>`;
    result.suggestions.forEach(s => html += `<li>${s}</li>`);
    html += `</ul>`;
  }

  resultsPanel.innerHTML = html;
}

function saveReview(result) {
  reviewHistory.push(result);
  statistics.totalReviews++;
  statistics.averageScore = reviewHistory.reduce((sum, r) => sum + r.score, 0) / statistics.totalReviews;
  saveToStorage();
  updateStatsUI();
}

// ---- LocalStorage ----
function loadFromStorage() {
  try {
    const historyData = localStorage.getItem("pro-review-history");
    const statsData = localStorage.getItem("pro-review-stats");
    if (historyData) reviewHistory = JSON.parse(historyData);
    if (statsData) statistics = JSON.parse(statsData);
  } catch (e) {
    console.log("Starting fresh");
  }
}

function saveToStorage() {
  try {
    localStorage.setItem("pro-review-history", JSON.stringify(reviewHistory));
    localStorage.setItem("pro-review-stats", JSON.stringify(statistics));
  } catch (e) {
    console.log("Save failed");
  }
}

function updateStatsUI() {
  totalReviewsEl.textContent = statistics.totalReviews;
  avgScoreEl.textContent = statistics.totalReviews ? Math.round(statistics.averageScore) : '--';
}
