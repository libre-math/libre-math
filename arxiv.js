// =========================================================
// arXiv Technical Report — logic
// =========================================================

const API = "https://export.arxiv.org/api/query";

const categorySelect = document.getElementById("category-select");
const keywordInput   = document.getElementById("keyword-input");
const searchBtn      = document.getElementById("search-btn");
const searchAllBtn   = document.getElementById("search-all-btn");
const paperStatus    = document.getElementById("paper-status");
const paperContent   = document.getElementById("paper-content");
const resultsSection = document.getElementById("results-section");
const resultsBox     = document.getElementById("results-box");
const resultsInfo    = document.getElementById("results-info");
const prevBtn        = document.getElementById("prev-btn");
const nextBtn        = document.getElementById("next-btn");
const themeToggle    = document.getElementById("theme-toggle");

let currentStart = 0;
let lastQuery = "";
let lastIsAll = false;
const PAGE_SIZE = 10;

// ---------- Theme ----------
const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "Light" : "Dark";
  try {
    localStorage.setItem("arxiv-theme", theme);
  } catch (e) {}
}

// Load saved preference (default to light)
let savedTheme = "light";
try {
  savedTheme = localStorage.getItem("arxiv-theme") || "light";
} catch (e) {}
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const current = root.getAttribute("data-theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
});

// ---------- Helpers ----------
function parseEntries(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");

  // Check for parser error
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    console.error("XML parse error", parseError.textContent);
    return [];
  }

  const entries = [...doc.querySelectorAll("entry")];
  return entries.map(entry => {
    const idUrl = entry.querySelector("id")?.textContent?.trim() || "";
    const arxivId = idUrl.split("/abs/").pop() || idUrl;
    const title = (entry.querySelector("title")?.textContent || "")
      .replace(/\s+/g, " ").trim();
    const summary = (entry.querySelector("summary")?.textContent || "")
      .replace(/\s+/g, " ").trim();
    const published = (entry.querySelector("published")?.textContent || "").slice(0, 10);
    const authors = [...entry.querySelectorAll("author name")]
      .map(n => n.textContent.trim())
      .join(", ");
    const cats = [...entry.querySelectorAll("category")]
      .map(c => c.getAttribute("term"))
      .filter(Boolean)
      .join(", ");
    return { arxivId, title, summary, published, authors, cats };
  });
}

function showPaper(paper) {
  paperStatus.hidden = true;
  paperContent.hidden = false;

  document.getElementById("paper-id").textContent = paper.arxivId;
  document.getElementById("paper-date").textContent = paper.published;
  document.getElementById("paper-cats").textContent = paper.cats;
  document.getElementById("paper-title").textContent = paper.title;
  document.getElementById("paper-authors").textContent = paper.authors;
  document.getElementById("paper-abstract").textContent = paper.summary;

  document.getElementById("paper-abs-link").href = `https://arxiv.org/abs/${paper.arxivId}`;
  document.getElementById("paper-pdf-link").href = `https://arxiv.org/pdf/${paper.arxivId}.pdf`;
}

function showStatus(msg) {
  paperContent.hidden = true;
  paperStatus.hidden = false;
  paperStatus.textContent = msg;
}

// ---------- Newest paper ----------
async function loadNewest(category) {
  showStatus("Loading newest paper…");
  resultsSection.hidden = true;

  const url = `${API}?search_query=cat:${encodeURIComponent(category)}&sortBy=submittedDate&sortOrder=descending&max_results=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const text = await res.text();
    const papers = parseEntries(text);

    if (!papers || papers.length === 0) {
      showStatus("No papers found in this category.");
      return;
    }
    showPaper(papers[0]);
  } catch (err) {
    console.error("loadNewest error:", err);
    showStatus("Could not reach arXiv. Check the browser console (F12) for details.");
  }
}
// ---------- Search ----------
async function runSearch(start = 0) {
  const keyword = keywordInput.value.trim();
  if (!keyword) return;

  const isAll = lastIsAll;
  currentStart = start;
  lastQuery = keyword;

  resultsSection.hidden = false;
  resultsBox.innerHTML = `<div class="status" style="padding:1rem">Searching…</div>`;
  resultsInfo.textContent = "";
  prevBtn.disabled = true;
  nextBtn.disabled = true;

  let searchQuery;
  if (isAll) {
    // Search across the categories currently in the dropdown
    const cats = [...categorySelect.options].map(o => o.value).filter(v => v !== "math");
    const catPart = cats.map(c => `cat:${c}`).join(" OR ");
    searchQuery = `(${catPart}) AND (ti:"${keyword}" OR abs
