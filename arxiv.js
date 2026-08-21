// =========================================================
// arXiv Technical Report
// =========================================================
const ARXIV_PROXY = "https://arxiv-summarizer.libremaths.workers.dev/arxiv";
const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const SUMMARY_WORKER_URL = "https://arxiv-summarizer.libremaths.workers.dev";
const PAGE_SIZE = 10;
const LATEST_COUNT = 5;

// =========================================================
// DOM
// =========================================================
const categorySelect = document.getElementById("category-select");
const keywordInput = document.getElementById("keyword-input");
const searchBtn = document.getElementById("search-btn");
const searchAllBtn = document.getElementById("search-all-btn");
const paperStatus = document.getElementById("paper-status");
const paperContent = document.getElementById("paper-content");
const resultsSection = document.getElementById("results-section");
const resultsBox = document.getElementById("results-box");
const resultsInfo = document.getElementById("results-info");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const themeToggle = document.getElementById("theme-toggle");
const randomPaperBtn = document.getElementById("random-paper-btn");
const summarizeBtn = document.getElementById("summarize-btn");
const summaryBox = document.getElementById("summary-box");
const latestList = document.getElementById("latest-list");
const latestCategory = document.getElementById("latest-category");
const wikipediaList = document.getElementById("wikipedia-list");

// =========================================================
// STATE
// =========================================================
let currentStart = 0;
let lastIsAll = false;
let latestPapers = [];
let currentPaper = null;
let latestRequestId = 0;

// =========================================================
// THEME
// =========================================================
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "Light" : "Dark";
  }
  try {
    localStorage.setItem("arxiv-theme", theme);
  } catch (error) {}
}

(function initTheme() {
  let saved = "light";
  try {
    saved = localStorage.getItem("arxiv-theme") || "light";
  } catch (error) {}
  applyTheme(saved);
})();

if (themeToggle) {
  themeToggle.addEventListener("click", function () {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

// =========================================================
// CATEGORY NAME
// =========================================================
function getCategoryName() {
  if (!categorySelect) return "";
  const option = categorySelect.options[categorySelect.selectedIndex];
  return option ? option.textContent.trim() : categorySelect.value;
}

// =========================================================
// STATUS
// =========================================================
function showStatus(message) {
  if (paperContent) paperContent.hidden = true;
  if (paperStatus) {
    paperStatus.hidden = false;
    paperStatus.textContent = message;
  }
}

// =========================================================
// BASIC LATEX → HTML
// =========================================================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderBasicLatex(text) {
  if (!text) return "";
  let html = escapeHtml(text);

  // Subscripts: $_{...}$ or $_...
  html = html.replace(/\$\_\{([^}]+)\}\$/g, "<sub>$1</sub>");
  html = html.replace(/\$\_([A-Za-z0-9+\-]+)/g, "<sub>$1</sub>");

  // Superscripts: $^{...}$ or $^...
  html = html.replace(/\$\^\{([^}]+)\}\$/g, "<sup>$1</sup>");
  html = html.replace(/\$\^([A-Za-z0-9+\-]+)/g, "<sup>$1</sup>");

  // Simple $x$ → italic
  html = html.replace(/\$([^$]+)\$/g, "<i>$1</i>");

  return html;
}

// =========================================================
// PAPER DISPLAY
// =========================================================
function showPaper(paper) {
  currentPaper = paper;
  if (paperStatus) paperStatus.hidden = true;
  if (paperContent) paperContent.hidden = false;

  const idEl = document.getElementById("paper-id");
  const dateEl = document.getElementById("paper-date");
  const catsEl = document.getElementById("paper-cats");
  const titleEl = document.getElementById("paper-title");
  const authorsEl = document.getElementById("paper-authors");
  const abstractEl = document.getElementById("paper-abstract");

  if (idEl) idEl.textContent = paper.arxivId || "";
  if (dateEl) dateEl.textContent = paper.published || "";
  if (catsEl) catsEl.textContent = paper.cats || "";
  if (titleEl) titleEl.textContent = paper.title || "";
  if (authorsEl) authorsEl.textContent = paper.authors || "";
  if (abstractEl) {
    abstractEl.innerHTML = renderBasicLatex(paper.summary || "");
  }

  const absLink = document.getElementById("paper-abs-link");
  const pdfLink = document.getElementById("paper-pdf-link");
  if (absLink) absLink.href = "https://arxiv.org/abs/" + paper.arxivId;
  if (pdfLink) pdfLink.href = "https://arxiv.org/pdf/" + paper.arxivId + ".pdf";

  resetSummary();
  loadWikipediaArticles(paper);
  refreshLatestHighlight();
}

// =========================================================
// RESET SUMMARY
// =========================================================
function resetSummary() {
  if (summaryBox) {
    summaryBox.innerHTML =
      '<p class="summary-placeholder">' +
      'Click “Extract” to show the first and last sentence of the abstract.' +
      "</p>";
  }
}

// =========================================================
// XML PARSER
// =========================================================
function parseEntries(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror")) {
    console.error("Could not parse arXiv XML.");
    return [];
  }
  return Array.from(doc.querySelectorAll("entry")).map(function (entry) {
    const idNode = entry.querySelector("id");
    const idUrl = idNode ? idNode.textContent.trim() : "";
    const arxivId = idUrl.split("/abs/").pop().split("?")[0] || idUrl;

    const titleNode = entry.querySelector("title");
    const title = titleNode
      ? titleNode.textContent.replace(/\s+/g, " ").trim()
      : "";

    const summaryNode = entry.querySelector("summary");
    const summary = summaryNode
      ? summaryNode.textContent.replace(/\s+/g, " ").trim()
      : "";

    const publishedNode = entry.querySelector("published");
    const published = publishedNode
      ? publishedNode.textContent.slice(0, 10)
      : "";

    const authors = Array.from(entry.querySelectorAll("author name"))
      .map(function (node) {
        return node.textContent.trim();
      })
      .join(", ");

    const cats = Array.from(entry.querySelectorAll("category"))
      .map(function (node) {
        return node.getAttribute("term");
      })
      .filter(Boolean)
      .join(", ");

    return {
      arxivId: arxivId,
      title: title,
      summary: summary,
      published: published,
      authors: authors,
      cats: cats
    };
  });
}

// =========================================================
// CATEGORY QUERY (FIXED)
// =========================================================
function getCategoryQuery(category) {
  if (category === "q-fin") {
    return (
      "(cat:q-fin.CP OR cat:q-fin.MF OR cat:q-fin.PM OR " +
      "cat:q-fin.PR OR cat:q-fin.RM OR cat:q-fin.ST OR " +
      "cat:q-fin.TR OR cat:q-fin.GN)"
    );
  }

  const needsWildcard = new Set([
    "physics",
    "math",
    "cs",
    "q-bio",
    "stat",
    "eess",
    "econ",
    "nlin",
    "astro-ph",
    "cond-mat"
  ]);

  if (needsWildcard.has(category)) {
    if (category === "math" || category === "cs") {
      return "cat:" + category + ".*";
    }
    return "cat:" + category + "*";
  }

  return "cat:" + category;
}

// =========================================================
// ARXIV FETCH
// =========================================================
async function fetchArxiv(searchQuery, start, maxResults) {
  const params = new URLSearchParams({
    search_query: searchQuery,
    sortBy: "submittedDate",
    sortOrder: "descending",
    start: String(start),
    max_results: String(maxResults)
  });

  const url = ARXIV_PROXY + "?" + params.toString();
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("arXiv HTTP " + response.status);
  }
  const text = await response.text();
  return parseEntries(text);
}

// =========================================================
// LOAD LATEST FIVE
// =========================================================
async function loadLatestPapers() {
  if (!categorySelect) return;
  const requestId = ++latestRequestId;
  const category = categorySelect.value;
  const categoryName = getCategoryName();

  if (latestCategory) latestCategory.textContent = categoryName;
  if (latestList) {
    latestList.innerHTML =
      '<div class="latest-loading">Loading latest papers…</div>';
  }

  try {
    const papers = await fetchArxiv(
      getCategoryQuery(category),
      0,
      LATEST_COUNT
    );
    if (requestId !== latestRequestId) return;
    latestPapers = papers;
    renderLatestPapers(papers);
  } catch (error) {
    console.error("Latest papers error:", error);
    if (latestList) {
      latestList.innerHTML =
        '<div class="latest-loading">Could not load latest papers.</div>';
    }
  }
}

// =========================================================
// RENDER LATEST FIVE
// =========================================================
function renderLatestPapers(papers) {
  if (!latestList) return;
  latestList.innerHTML = "";

  if (!papers.length) {
    latestList.innerHTML =
      '<div class="latest-loading">No recent papers found.</div>';
    return;
  }

  papers.forEach(function (paper, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "latest-item";
    button.dataset.arxivId = paper.arxivId;
    button.innerHTML =
      '<span class="latest-item-number">' +
      String(index + 1).padStart(2, "0") +
      "</span>" +
      '<span class="latest-item-title">' +
      escapeHtml(paper.title) +
      "</span>" +
      '<span class="latest-item-date">' +
      escapeHtml(paper.published) +
      "</span>";

    button.addEventListener("click", function () {
      showPaper(paper);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    latestList.appendChild(button);
  });

  refreshLatestHighlight();
}

// =========================================================
// HIGHLIGHT CURRENT PAPER
// =========================================================
function refreshLatestHighlight() {
  if (!latestList) return;
  const items = latestList.querySelectorAll(".latest-item");
  items.forEach(function (item) {
    item.classList.toggle(
      "active",
      currentPaper && item.dataset.arxivId === currentPaper.arxivId
    );
  });
}

// =========================================================
// LOAD NEWEST / RANDOM
// =========================================================
async function loadPaper(category, random) {
  showStatus(random ? "Loading random paper…" : "Loading newest paper…");
  if (resultsSection) resultsSection.hidden = true;

  const catQuery = getCategoryQuery(category);
  let start = 0;
  if (random) {
    start = Math.floor(Math.random() * 200);
  }

  try {
    const papers = await fetchArxiv(catQuery, start, 1);
    if (!papers.length) {
      showStatus("No papers found in this category.");
      return;
    }
    showPaper(papers[0]);
  } catch (error) {
    console.error(error);
    showStatus("Could not reach arXiv. See console.");
  }
}

// =========================================================
// SEARCH
// =========================================================
async function runSearch(start) {
  if (typeof start !== "number") start = 0;

  const keyword = keywordInput ? keywordInput.value.trim() : "";
  if (!keyword) {
    alert("Please type a keyword first.");
    return;
  }

  currentStart = start;
  if (resultsSection) resultsSection.hidden = false;
  if (resultsBox) {
    resultsBox.innerHTML =
      '<div class="status" style="padding:1rem">Searching…</div>';
  }
  if (resultsInfo) resultsInfo.textContent = "";
  if (prevBtn) prevBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = true;

  let searchQuery;
  if (lastIsAll) {
    const cats = Array.from(categorySelect.options).map(function (option) {
      return option.value;
    });
    const catPart = cats
      .map(function (category) {
        return getCategoryQuery(category);
      })
      .join(" OR ");
    searchQuery = "(" + catPart + ') AND ti:"' + keyword + '"';
  } else {
    const category = categorySelect.value;
    searchQuery = getCategoryQuery(category) + ' AND ti:"' + keyword + '"';
  }

  try {
    const papers = await fetchArxiv(searchQuery, start, PAGE_SIZE);
    if (!resultsBox) return;
    resultsBox.innerHTML = "";

    if (!papers.length) {
      resultsBox.innerHTML =
        '<div class="status" style="padding:1rem">No results.</div>';
      return;
    }

    papers.forEach(function (paper) {
      const div = document.createElement("div");
      div.className = "result-item";
      div.innerHTML =
        '<div class="result-title">' +
        escapeHtml(paper.title) +
        "</div>" +
        '<div class="result-meta">' +
        escapeHtml(paper.authors) +
        " · " +
        escapeHtml(paper.published) +
        " · " +
        escapeHtml(paper.cats) +
        "</div>";

      div.addEventListener("click", function () {
        showPaper(paper);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      resultsBox.appendChild(div);
    });

    if (resultsInfo) {
      resultsInfo.textContent = start + 1 + "–" + (start + papers.length);
    }
    if (prevBtn) prevBtn.disabled = start === 0;
    if (nextBtn) nextBtn.disabled = papers.length < PAGE_SIZE;
  } catch (error) {
    console.error(error);
    if (resultsBox) {
      resultsBox.innerHTML =
        '<div class="status" style="padding:1rem">Search failed.</div>';
    }
  }
}

// =========================================================
// KEY POINTS = FIRST + LAST SENTENCE
// =========================================================
function splitIntoSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(function (sentence) {
      return sentence.trim();
    })
    .filter(Boolean);
}

async function summarizeAbstract() {

  const abstractEl =
    document.getElementById("paper-abstract");

  const abstract =
    abstractEl ? abstractEl.textContent.trim() : "";

  if (!abstract) {
    if (summaryBox) {
      summaryBox.innerHTML =
        '<p class="summary-placeholder">No abstract to simplify.</p>';
    }
    return;
  }

  if (summarizeBtn) { summarizeBtn.disabled = true; }

  if (summaryBox) {
    summaryBox.innerHTML =
      '<p class="summary-loading">Making it simpler…</p>';
  }

  let summary = "";

  try {

    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 45000);

    const response = await fetch(SUMMARY_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: abstract }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      summary = (data.summary || "").trim();
    }

  } catch (error) {
    console.warn("HF Worker summary failed, falling back to local simplifier:", error);
  }

  if (!summary) {
    try {
      summary = simplifyAbstract(abstract);
    } catch (error) {
      console.error("Local simplification error:", error);
    }
  }

  if (summaryBox) {
    summaryBox.innerHTML = summary
      ? '<p class="summary-result">' + escapeHtml(summary) + "</p>"
      : '<p class="summary-placeholder">I could not simplify this abstract.</p>';
  }

  if (summarizeBtn) { summarizeBtn.disabled = false; }
}
// =========================================================
// WIKIPEDIA
// =========================================================
async function loadWikipediaArticles(paper) {
  if (!wikipediaList) return;
  wikipediaList.innerHTML =
    '<div class="wiki-loading">Finding related articles…</div>';

  const query = buildWikipediaQuery(paper);
  if (!query) {
    wikipediaList.innerHTML =
      '<div class="wiki-placeholder">No related topic found.</div>';
    return;
  }

  try {
    const url =
      WIKIPEDIA_API +
      "?action=query&list=search&srsearch=" +
      encodeURIComponent(query) +
      "&srlimit=8&srnamespace=0&format=json&origin=*";

    const response = await fetch(url);
    if (!response.ok) throw new Error("Wikipedia HTTP " + response.status);

    const data = await response.json();
    const results =
      data && data.query && Array.isArray(data.query.search)
        ? data.query.search
        : [];

    renderWikipediaArticles(results.slice(0, 5));
  } catch (error) {
    console.error("Wikipedia search error:", error);
    wikipediaList.innerHTML =
      '<div class="wiki-placeholder">Wikipedia articles could not be loaded.</div>';
  }
}

function buildWikipediaQuery(paper) {
  if (!paper) return "";
  const title = (paper.title || "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!title) return "";

  const generic = new Set([
    "a", "an", "the", "and", "or", "of", "for", "in", "on", "with",
    "using", "based", "toward", "towards", "study", "studies",
    "analysis", "approach", "method", "methods", "new", "novel"
  ]);

  const titleWords = title
    .split(/\s+/)
    .filter(function (word) {
      return word.length > 3 && !generic.has(word.toLowerCase());
    })
    .slice(0, 8);

  return titleWords.length ? titleWords.join(" ") : "";
}

function renderWikipediaArticles(articles) {
  if (!wikipediaList) return;
  wikipediaList.innerHTML = "";

  if (!articles.length) {
    wikipediaList.innerHTML =
      '<div class="wiki-placeholder">No closely related Wikipedia articles found.</div>';
    return;
  }

  articles.forEach(function (article) {
    const link = document.createElement("a");
    link.className = "wiki-item";
    link.target = "_blank";
    link.rel = "noopener";

    const title = article.title || "";
    link.href =
      "https://en.wikipedia.org/wiki/" +
      encodeURIComponent(title.replace(/ /g, "_"));

    const cleanSnippet = stripHtml(article.snippet || "");
    link.innerHTML =
      '<span class="wiki-item-title">' +
      escapeHtml(title) +
      "</span>" +
      (cleanSnippet
        ? '<span class="wiki-item-description">' +
          escapeHtml(cleanSnippet) +
          "</span>"
        : "");

    wikipediaList.appendChild(link);
  });
}

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "")
    .replace(/\s+/g, " ")
    .trim();
}

// =========================================================
// EVENTS
// =========================================================
if (categorySelect) {
  categorySelect.addEventListener("change", function () {
    lastIsAll = false;
    currentStart = 0;
    if (resultsSection) resultsSection.hidden = true;
    loadLatestPapers();
    loadPaper(categorySelect.value, false);
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
  keywordInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      lastIsAll = false;
      runSearch(0);
    }
  });
}

if (prevBtn) {
  prevBtn.addEventListener("click", function () {
    if (currentStart >= PAGE_SIZE) {
      runSearch(currentStart - PAGE_SIZE);
    }
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", function () {
    runSearch(currentStart + PAGE_SIZE);
  });
}

if (randomPaperBtn) {
  randomPaperBtn.addEventListener("click", function () {
    loadPaper(categorySelect.value, true);
  });
}

if (summarizeBtn) {
  summarizeBtn.addEventListener("click", summarizeAbstract);
}

// =========================================================
// START
// =========================================================
if (categorySelect) {
  loadLatestPapers();
  loadPaper(categorySelect.value, false);
}
