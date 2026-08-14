// =========================================================
// arXiv Technical Report — complete clean version
// =========================================================

const API = "https://export.arxiv.org/api/query";
// Simple public CORS proxy (needed because arXiv blocked browser CORS in 2026)
const PROXY = "https://corsproxy.io/?";

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

// ---------- Theme (completely independent from the rest of the site) ----------
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "Light" : "Dark";
  }
  try {
    localStorage.setItem("arxiv-theme", theme);
  } catch (e) {}
}

(function initTheme() {
  let saved = "light";
  try {
    saved = localStorage.getItem("arxiv-theme") || "light";
  } catch (e) {}
  applyTheme(saved);
})();

if (themeToggle) {
  themeToggle.addEventListener("click", function () {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

// ---------- Helpers ----------
function showStatus(msg) {
  if (paperContent) paperContent.hidden = true;
  if (paperStatus) {
    paperStatus.hidden = false;
    paperStatus.textContent = msg;
  }
}

function showPaper(paper) {
  if (paperStatus) paperStatus.hidden = true;
  if (paperContent) paperContent.hidden = false;

  document.getElementById("paper-id").textContent = paper.arxivId || "";
  document.getElementById("paper-date").textContent = paper.published || "";
  document.getElementById("paper-cats").textContent = paper.cats || "";
  document.getElementById("paper-title").textContent = paper.title || "";
  document.getElementById("paper-authors").textContent = paper.authors || "";
  document.getElementById("paper-abstract").textContent = paper.summary || "";

  const absLink = document.getElementById("paper-abs-link");
  const pdfLink = document.getElementById("paper-pdf-link");
  if (absLink) absLink.href = "https://arxiv.org/abs/" + paper.arxivId;
  if (pdfLink) pdfLink.href = "https://arxiv.org/pdf/" + paper.arxivId + ".pdf";
}

function parseEntries(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");

  if (doc.querySelector("parsererror")) {
    console.error("XML parse error");
    return [];
  }

  const entries = Array.from(doc.querySelectorAll("entry"));
  return entries.map(function (entry) {
    const idUrl = (entry.querySelector("id") && entry.querySelector("id").textContent) || "";
    const arxivId = idUrl.split("/abs/").pop() || idUrl;
    const title = ((entry.querySelector("title") && entry.querySelector("title").textContent) || "")
      .replace(/\s+/g, " ").trim();
    const summary = ((entry.querySelector("summary") && entry.querySelector("summary").textContent) || "")
      .replace(/\s+/g, " ").trim();
    const published = ((entry.querySelector("published") && entry.querySelector("published").textContent) || "").slice(0, 10);
    const authorNodes = entry.querySelectorAll("author name");
    const authors = Array.from(authorNodes).map(function (n) { return n.textContent.trim(); }).join(", ");
    const catNodes = entry.querySelectorAll("category");
    const cats = Array.from(catNodes).map(function (c) { return c.getAttribute("term"); }).filter(Boolean).join(", ");
    return { arxivId: arxivId, title: title, summary: summary, published: published, authors: authors, cats: cats };
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------- Newest paper ----------
async function loadNewest(category) {
  showStatus("Loading newest paper…");
  if (resultsSection) resultsSection.hidden = true;

  const query = "search_query=cat:" + encodeURIComponent(category) +
                "&sortBy=submittedDate&sortOrder=descending&max_results=1";
  const url = PROXY + encodeURIComponent(API + "?" + query);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const text = await res.text();
    const papers = parseEntries(text);

    if (!papers || papers.length === 0) {
      showStatus("No papers found in this category.");
      return;
    }
    showPaper(papers[0]);
  } catch (err) {
    console.error("loadNewest error:", err);
    showStatus("Could not reach arXiv (CORS or network). See console.");
  }
}

// ---------- Search ----------
async function runSearch(start) {
  start = start || 0;
  const keyword = keywordInput.value.trim();
  if (!keyword) return;

  currentStart = start;
  lastQuery = keyword;

  if (resultsSection) resultsSection.hidden = false;
  resultsBox.innerHTML = '<div class="status" style="padding:1rem">Searching…</div>';
  resultsInfo.textContent = "";
  prevBtn.disabled = true;
  nextBtn.disabled = true;

  let searchQuery;
  if (lastIsAll) {
    const cats = Array.from(categorySelect.options).map(function (o) { return o.value; });
    const catPart = cats.map(function (c) { return "cat:" + c; }).join(" OR ");
    searchQuery = "(" + catPart + ") AND (ti:\"" + keyword + "\" OR abs:\"" + keyword + "\")";
  } else {
    const cat = categorySelect.value;
    searchQuery = "cat:" + cat + " AND (ti:\"" + keyword + "\" OR abs:\"" + keyword + "\")";
  }

  const query = "search_query=" + encodeURIComponent(searchQuery) +
                "&sortBy=submittedDate&sortOrder=descending&start=" + start +
                "&max_results=" + PAGE_SIZE;
  const url = PROXY + encodeURIComponent(API + "?" + query);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const text = await res.text();
    const papers = parseEntries(text);

    resultsBox.innerHTML = "";
    if (!papers || papers.length === 0) {
      resultsBox.innerHTML = '<div class="status" style="padding:1rem">No results.</div>';
      return;
    }

    papers.forEach(function (p) {
      const div = document.createElement("div");
      div.className = "result-item";
      div.innerHTML =
        '<div class="result-title">' + escapeHtml(p.title) + '</div>' +
        '<div class="result-meta">' + escapeHtml(p.authors) + " · " + p.published + " · " + escapeHtml(p.cats) + "</div>";
      div.addEventListener("click", function () {
        showPaper(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      resultsBox.appendChild(div);
    });

    resultsInfo.textContent = (start + 1) + "–" + (start + papers.length);
    prevBtn.disabled = start === 0;
    nextBtn.disabled = papers.length < PAGE_SIZE;
  } catch (err) {
    console.error("search error:", err);
    resultsBox.innerHTML = '<div class="status" style="padding:1rem">Search failed.</div>';
  }
}

// ---------- Events ----------
if (categorySelect) {
  categorySelect.addEventListener("change", function () {
    loadNewest(categorySelect.value);
  });
}

if (searchBtn) {
  searchBtn.addEventListener("click", function () {
    lastIsAll = false;
    runSearch(0);
  });
}

if (searchAllBtn) {
  searchAllBtn.addEventListener("click", function () {
    lastIsAll = true;
    runSearch(0);
  });
}

if (keywordInput) {
  keywordInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      lastIsAll = false;
      runSearch(0);
    }
  });
}

if (prevBtn) {
  prevBtn.addEventListener("click", function () {
    if (currentStart >= PAGE_SIZE) runSearch(currentStart - PAGE_SIZE);
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", function () {
    runSearch(currentStart + PAGE_SIZE);
  });
}

// ---------- Start ----------
if (categorySelect) {
  loadNewest(categorySelect.value);
}
