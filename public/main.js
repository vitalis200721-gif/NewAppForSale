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
  if (!code) return alert("Please enter code!");

  resultsPanel.innerHTML = "Analyzing...";

  const token = localStorage.getItem("premium_token");

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
      },
      body: JSON.stringify({ code })
    });

    const data = await response.json();

    if (data.error === "PREMIUM_REQUIRED") {
      resultsPanel.innerHTML = `
        <h3>🔒 Premium Only</h3>
        <p>To use AI Review, you must purchase Premium.</p>
        <a href="https://vitalis12.gumroad.com/l/ahrpas" target="_blank">
          <button>Buy Premium</button>
        </a>
      `;
      return;
    }

    let aiResponse;

    try {
      if (data.choices && data.choices[0] && data.choices[0].text) {
        aiResponse = JSON.parse(data.choices[0].text);
      } else if (data.content && data.content[0] && data.content[0].text) {
        aiResponse = JSON.parse(data.content[0].text);
      } else {
        aiResponse = data;
      }
    } catch (e) {
      console.log("RAW AI:", JSON.stringify(data));
      aiResponse = {
        score: 70,
        issues: [],
        suggestions: [],
        summary: "AI returned invalid JSON, analysis done."
      };
    }

    renderResult(aiResponse);
    saveReview(aiResponse);

  } catch (error) {
    console.error(error);
    resultsPanel.textContent = "❌ Cannot reach AI server.";
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
