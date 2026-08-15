// =========================================================
// arXiv Technical Report — complete version
// =========================================================

const API = "https://export.arxiv.org/api/query";
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
const randomPaperBtn = document.getElementById("random-paper-btn");
const summarizeBtn   = document.getElementById("summarize-btn");
const summaryBox     = document.getElementById("summary-box");

let currentStart = 0;
let lastIsAll = false;

const PAGE_SIZE = 10;


// =========================================================
// Theme
// =========================================================

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
    const current =
      document.documentElement.getAttribute("data-theme") || "light";

    applyTheme(current === "dark" ? "light" : "dark");
  });
}


// =========================================================
// Helpers
// =========================================================

function showStatus(msg) {
  if (paperContent) {
    paperContent.hidden = true;
  }

  if (paperStatus) {
    paperStatus.hidden = false;
    paperStatus.textContent = msg;
  }
}


function showPaper(paper) {
  if (paperStatus) {
    paperStatus.hidden = true;
  }

  if (paperContent) {
    paperContent.hidden = false;
  }

  document.getElementById("paper-id").textContent =
    paper.arxivId || "";

  document.getElementById("paper-date").textContent =
    paper.published || "";

  document.getElementById("paper-cats").textContent =
    paper.cats || "";

  document.getElementById("paper-title").textContent =
    paper.title || "";

  document.getElementById("paper-authors").textContent =
    paper.authors || "";

  document.getElementById("paper-abstract").textContent =
    paper.summary || "";

  const absLink = document.getElementById("paper-abs-link");
  const pdfLink = document.getElementById("paper-pdf-link");

  if (absLink) {
    absLink.href =
      "https://arxiv.org/abs/" + paper.arxivId;
  }

  if (pdfLink) {
    pdfLink.href =
      "https://arxiv.org/pdf/" + paper.arxivId + ".pdf";
  }

  // Reset summary
  if (summaryBox) {
    summaryBox.innerHTML =
      '<p class="summary-placeholder">' +
      'Click “Sum up” for a short, plain-English version of the abstract.' +
      "</p>";
  }
}


function parseEntries(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");

  if (doc.querySelector("parsererror")) {
    return [];
  }

  return Array.from(doc.querySelectorAll("entry")).map(function (entry) {
    const idUrl =
      (entry.querySelector("id") &&
        entry.querySelector("id").textContent) ||
      "";

    const arxivId =
      idUrl.split("/abs/").pop() || idUrl;

    const title =
      ((entry.querySelector("title") &&
        entry.querySelector("title").textContent) || "")
        .replace(/\s+/g, " ")
        .trim();

    const summary =
      ((entry.querySelector("summary") &&
        entry.querySelector("summary").textContent) || "")
        .replace(/\s+/g, " ")
        .trim();

    const published =
      ((entry.querySelector("published") &&
        entry.querySelector("published").textContent) || "")
        .slice(0, 10);

    const authors =
      Array.from(entry.querySelectorAll("author name"))
        .map(function (n) {
          return n.textContent.trim();
        })
        .join(", ");

    const cats =
      Array.from(entry.querySelectorAll("category"))
        .map(function (c) {
          return c.getAttribute("term");
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


function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


// =========================================================
// Load paper
// =========================================================

async function loadPaper(category, random) {
  showStatus(
    random
      ? "Loading random paper…"
      : "Loading newest paper…"
  );

  if (resultsSection) {
    resultsSection.hidden = true;
  }

  let catQuery = "cat:" + category;

  if (category === "q-fin") {
    catQuery =
      "(cat:q-fin.CP OR cat:q-fin.MF OR cat:q-fin.PM OR " +
      "cat:q-fin.PR OR cat:q-fin.RM OR cat:q-fin.ST OR " +
      "cat:q-fin.TR OR cat:q-fin.GN)";
  }

  let start = 0;

  if (random) {
    start = Math.floor(Math.random() * 200);
  }

  const query =
    "search_query=" +
    encodeURIComponent(catQuery) +
    "&sortBy=submittedDate" +
    "&sortOrder=descending" +
    "&start=" +
    start +
    "&max_results=1";

  const url =
    PROXY +
    encodeURIComponent(API + "?" + query);

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const text = await res.text();
    const papers = parseEntries(text);

    if (!papers || papers.length === 0) {
      showStatus(
        "No papers found in this category."
      );
      return;
    }

    showPaper(papers[0]);

  } catch (err) {
    console.error(err);

    showStatus(
      "Could not reach arXiv. See console."
    );
  }
}


// =========================================================
// Search
// =========================================================

async function runSearch(start) {
  start = start || 0;

  const keyword =
    keywordInput && keywordInput.value
      ? keywordInput.value.trim()
      : "";

  if (!keyword) {
    alert("Please type a keyword first.");
    return;
  }

  currentStart = start;

  if (resultsSection) {
    resultsSection.hidden = false;
  }

  resultsBox.innerHTML =
    '<div class="status" style="padding:1rem">Searching…</div>';

  if (resultsInfo) {
    resultsInfo.textContent = "";
  }

  if (prevBtn) {
    prevBtn.disabled = true;
  }

  if (nextBtn) {
    nextBtn.disabled = true;
  }

  let searchQuery;

  if (lastIsAll) {
    const cats =
      Array.from(categorySelect.options)
        .map(function (o) {
          return o.value;
        });

    const catPart =
      cats.map(function (c) {
        return "cat:" + c;
      }).join(" OR ");

    searchQuery =
      "(" +
      catPart +
      ') AND ti:"' +
      keyword +
      '"';

  } else {

    const cat = categorySelect.value;

    if (cat === "q-fin") {

      searchQuery =
        "(cat:q-fin.CP OR cat:q-fin.MF OR cat:q-fin.PM OR " +
        "cat:q-fin.PR OR cat:q-fin.RM OR cat:q-fin.ST OR " +
        "cat:q-fin.TR OR cat:q-fin.GN) AND ti:\"" +
        keyword +
        "\"";

    } else {

      searchQuery =
        "cat:" +
        cat +
        ' AND ti:"' +
        keyword +
        '"';
    }
  }

  const query =
    "search_query=" +
    encodeURIComponent(searchQuery) +
    "&sortBy=submittedDate" +
    "&sortOrder=descending" +
    "&start=" +
    start +
    "&max_results=" +
    PAGE_SIZE;

  const url =
    PROXY +
    encodeURIComponent(API + "?" + query);

  try {

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const text = await res.text();
    const papers = parseEntries(text);

    resultsBox.innerHTML = "";

    if (!papers || papers.length === 0) {

      resultsBox.innerHTML =
        '<div class="status" style="padding:1rem">' +
        "No results." +
        "</div>";

      return;
    }

    papers.forEach(function (p) {

      const div = document.createElement("div");

      div.className = "result-item";

      div.innerHTML =
        '<div class="result-title">' +
        escapeHtml(p.title) +
        "</div>" +

        '<div class="result-meta">' +
        escapeHtml(p.authors) +
        " · " +
        p.published +
        " · " +
        escapeHtml(p.cats) +
        "</div>";

      div.addEventListener("click", function () {

        showPaper(p);

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      });

      resultsBox.appendChild(div);
    });

    if (resultsInfo) {
      resultsInfo.textContent =
        (start + 1) +
        "–" +
        (start + papers.length);
    }

    if (prevBtn) {
      prevBtn.disabled = start === 0;
    }

    if (nextBtn) {
      nextBtn.disabled =
        papers.length < PAGE_SIZE;
    }

  } catch (err) {

    console.error(err);

    resultsBox.innerHTML =
      '<div class="status" style="padding:1rem">' +
      "Search failed." +
      "</div>";
  }
}


// =========================================================
// Simple local summarizer
// Uses Compromise for sentence analysis.
// No API, no model, no server.
// =========================================================

function summarizeAbstract() {

  const abstractEl =
    document.getElementById("paper-abstract");

  const abstract =
    abstractEl
      ? abstractEl.textContent.trim()
      : "";

  if (!abstract) {

    if (summaryBox) {
      summaryBox.innerHTML =
        '<p class="summary-placeholder">' +
        "No abstract to simplify." +
        "</p>";
    }

    return;
  }

  if (summarizeBtn) {
    summarizeBtn.disabled = true;
  }

  if (summaryBox) {
    summaryBox.innerHTML =
      '<p class="summary-loading">' +
      "Making it simpler…" +
      "</p>";
  }

  setTimeout(function () {

    try {

      const summary =
        simplifyWithCompromise(abstract);

      if (summaryBox) {

        summaryBox.innerHTML =
          '<p class="summary-result">' +
          escapeHtml(summary) +
          "</p>";
      }

    } catch (err) {

      console.error(
        "Simplification error:",
        err
      );

      if (summaryBox) {

        summaryBox.innerHTML =
          '<p class="summary-placeholder">' +
          "I could not simplify this abstract." +
          "</p>";
      }

    }

    if (summarizeBtn) {
      summarizeBtn.disabled = false;
    }

  }, 50);
}


// =========================================================
// Main simplification
// =========================================================

function simplifyWithCompromise(text) {

  if (typeof nlp !== "function") {
    throw new Error(
      "Compromise.js was not loaded."
    );
  }

  // Create NLP document.
  const doc = nlp(text);

  // Remove obvious citation references.
  let cleanText = text
    .replace(/\[[0-9,\-\s]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Parse cleaned text.
  const cleanDoc = nlp(cleanText);

  let sentences =
    cleanDoc
      .sentences()
      .out("array")
      .map(function (sentence) {
        return sentence
          .replace(/\s+/g, " ")
          .trim();
      })
      .filter(function (sentence) {
        return sentence.length > 30;
      });

  if (!sentences.length) {
    return simplifySentence(text);
  }


  // -------------------------------------------------------
  // Important concepts
  // -------------------------------------------------------

  const importantTerms = [
    "study",
    "investigate",
    "examine",
    "analyze",
    "analyse",
    "propose",
    "present",
    "develop",
    "introduce",
    "show",
    "shows",
    "find",
    "finds",
    "found",
    "result",
    "results",
    "experiment",
    "experiments",
    "data",
    "dataset",
    "datasets",
    "model",
    "models",
    "method",
    "methods",
    "approach",
    "performance",
    "improve",
    "improvement",
    "reduce",
    "reduction",
    "increase",
    "predict",
    "prediction",
    "demonstrate",
    "demonstrates",
    "conclude",
    "conclusion"
  ];


  // -------------------------------------------------------
  // Score sentences
  // -------------------------------------------------------

  function sentenceScore(sentence, index) {

    const lower =
      sentence.toLowerCase();

    let score = 0;


    // Important scientific words.
    importantTerms.forEach(function (term) {

      if (
        new RegExp(
          "\\b" +
          term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
          "\\b",
          "i"
        ).test(lower)
      ) {
        score += 2;
      }
    });


    // First sentence usually gives the problem.
    if (index === 0) {
      score += 5;
    }


    // Second sentence often gives the approach.
    if (index === 1) {
      score += 3;
    }


    // Later sentences are often results.
    if (index >= 2) {
      if (
        /\b(results?|find|found|show|shows|demonstrate|demonstrates|conclude|conclusion)\b/i
          .test(lower)
      ) {
        score += 5;
      }
    }


    // Sentences with "we" often describe what researchers did.
    if (/\bwe\b/i.test(lower)) {
      score += 2;
    }


    // Prefer readable sentence lengths.
    if (sentence.length < 220) {
      score += 3;
    }

    if (sentence.length > 400) {
      score -= 3;
    }


    // Penalize sentences that are mostly setup.
    if (
      /\bhowever\b|\balthough\b|\bwhile\b/i.test(lower)
    ) {
      score -= 1;
    }


    return score;
  }


  // -------------------------------------------------------
  // Rank sentences
  // -------------------------------------------------------

  const ranked =
    sentences
      .map(function (sentence, index) {

        return {
          sentence: sentence,
          index: index,
          score: sentenceScore(
            sentence,
            index
          )
        };

      })
      .sort(function (a, b) {

        return b.score - a.score;

      });


  // -------------------------------------------------------
  // Select sentences
  // -------------------------------------------------------

  let selected =
    ranked
      .slice(0, Math.min(4, ranked.length))
      .sort(function (a, b) {
        return a.index - b.index;
      });


  // -------------------------------------------------------
  // Simplify selected sentences
  // -------------------------------------------------------

  let result =
    selected
      .map(function (item) {
        return simplifySentence(
          item.sentence
        );
      })
      .join(" ");


  // -------------------------------------------------------
  // Additional cleanup
  // -------------------------------------------------------

  result = result
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();


  // Limit to roughly 110 words.
  const words =
    result.split(/\s+/);

  if (words.length > 110) {

    result =
      words
        .slice(0, 105)
        .join(" ") +
      "…";
  }


  return result;
}


// =========================================================
// Vocabulary and phrase simplification
// =========================================================

function simplifySentence(sentence) {

  let result = sentence;


  // -------------------------------------------------------
  // Research phrases
  // -------------------------------------------------------

  const replacements = [

    [/\bwe investigate\b/gi, "we study"],
    [/\bwe examine\b/gi, "we study"],
    [/\bwe analyze\b/gi, "we study"],
    [/\bwe analyse\b/gi, "we study"],

    [/\bwe propose\b/gi, "we suggest"],
    [/\bwe introduce\b/gi, "we present"],
    [/\bwe develop\b/gi, "we create"],
    [/\bwe demonstrate\b/gi, "we show"],
    [/\bwe establish\b/gi, "we show"],
    [/\bwe utilize\b/gi, "we use"],

    [/\bthis paper investigates\b/gi, "this paper studies"],
    [/\bthis work investigates\b/gi, "this work studies"],
    [/\bthis study investigates\b/gi, "this study looks at"],

    [/\bthe authors investigate\b/gi, "the authors study"],
    [/\bthe authors propose\b/gi, "the authors suggest"],
    [/\bthe authors demonstrate\b/gi, "the authors show"],


    // -----------------------------------------------------
    // Academic vocabulary
    // -----------------------------------------------------

    [/\butilize\b/gi, "use"],
    [/\butilizes\b/gi, "uses"],
    [/\butilized\b/gi, "used"],

    [/\bmethodology\b/gi, "method"],
    [/\bmethodologies\b/gi, "methods"],

    [/\bframework\b/gi, "system"],
    [/\bframeworks\b/gi, "systems"],

    [/\bnovel\b/gi, "new"],
    [/\binnovative\b/gi, "new"],

    [/\bempirical\b/gi, "based on real data"],
    [/\bquantitative\b/gi, "based on numbers"],
    [/\bqualitative\b/gi, "based on descriptions"],

    [/\bfeasible\b/gi, "possible"],
    [/\brobust\b/gi, "reliable"],
    [/\bcomplexity\b/gi, "difficulty"],
    [/\bcomplex\b/gi, "complicated"],
    [/\boptimal\b/gi, "best"],

    [/\bapproximately\b/gi, "about"],
    [/\bsubsequently\b/gi, "later"],
    [/\bprior to\b/gi, "before"],


    // -----------------------------------------------------
    // Long academic phrases
    // -----------------------------------------------------

    [/\bin order to\b/gi, "to"],
    [/\bwith respect to\b/gi, "about"],
    [/\bin the context of\b/gi, "in"],
    [/\bin terms of\b/gi, "for"],
    [/\bin accordance with\b/gi, "following"],
    [/\bwith the aim of\b/gi, "to"],
    [/\bfor the purpose of\b/gi, "to"],

    [/\ba large number of\b/gi, "many"],
    [/\ba small number of\b/gi, "few"],
    [/\ba significant number of\b/gi, "many"],

    [/\ba significant increase\b/gi, "a clear increase"],
    [/\ba significant decrease\b/gi, "a clear decrease"],


    // -----------------------------------------------------
    // Academic verbs
    // -----------------------------------------------------

    [/\bmitigate\b/gi, "reduce"],
    [/\bmitigates\b/gi, "reduces"],
    [/\bmitigation\b/gi, "reduction"],

    [/\bfacilitate\b/gi, "help"],
    [/\bfacilitates\b/gi, "helps"],

    [/\bimplement\b/gi, "use"],
    [/\bimplements\b/gi, "uses"],
    [/\bimplemented\b/gi, "used"],

    [/\bderive\b/gi, "calculate"],
    [/\bderives\b/gi, "calculates"],
    [/\bderived\b/gi, "calculated"],

    [/\bobtain\b/gi, "get"],
    [/\bobtains\b/gi, "gets"],
    [/\bobtained\b/gi, "got"],


    // -----------------------------------------------------
    // Results / conclusions
    // -----------------------------------------------------

    [/\bfindings\b/gi, "results"],
    [/\bimplications\b/gi, "meaning"],
    [/\bapplications\b/gi, "uses"],
    [/\bbeneficial\b/gi, "helpful"],

    [/\bindicate\b/gi, "show"],
    [/\bindicates\b/gi, "shows"],
    [/\bindicated\b/gi, "showed"],

    [/\bsuggest\b/gi, "suggest"],
    [/\bconsequently\b/gi, "so"],


    // -----------------------------------------------------
    // Connectors
    // -----------------------------------------------------

    [/\bfurthermore\b/gi, "also"],
    [/\bmoreover\b/gi, "also"],
    [/\btherefore\b/gi, "so"],
    [/\bnevertheless\b/gi, "however"],
    [/\bthus\b/gi, "so"],
    [/\bhence\b/gi, "so"]
  ];


  replacements.forEach(function (replacement) {

    result =
      result.replace(
        replacement[0],
        replacement[1]
      );

  });


  // -------------------------------------------------------
  // Compromise-assisted cleanup
  // -------------------------------------------------------

  try {

    const doc = nlp(result);

    // Remove repeated spaces.
    result =
      doc.text()
        .replace(/\s+/g, " ")
        .trim();

  } catch (e) {
    // If Compromise fails, keep the existing result.
  }


  return result
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}


// =========================================================
// Events
// =========================================================

if (categorySelect) {

  categorySelect.addEventListener(
    "change",
    function () {

      loadPaper(
        categorySelect.value,
        false
      );

    }
  );
}


if (searchBtn) {

  searchBtn.addEventListener(
    "click",
    function () {

      lastIsAll = false;

      runSearch(0);

    }
  );
}


if (searchAllBtn) {

  searchAllBtn.addEventListener(
    "click",
    function () {

      lastIsAll = true;

      runSearch(0);

    }
  );
}


if (keywordInput) {

  keywordInput.addEventListener(
    "keydown",
    function (e) {

      if (e.key === "Enter") {

        lastIsAll = false;

        runSearch(0);

      }

    }
  );
}


if (prevBtn) {

  prevBtn.addEventListener(
    "click",
    function () {

      if (currentStart >= PAGE_SIZE) {

        runSearch(
          currentStart - PAGE_SIZE
        );

      }

    }
  );
}


if (nextBtn) {

  nextBtn.addEventListener(
    "click",
    function () {

      runSearch(
        currentStart + PAGE_SIZE
      );

    }
  );
}


if (randomPaperBtn) {

  randomPaperBtn.addEventListener(
    "click",
    function () {

      loadPaper(
        categorySelect.value,
        true
      );

    }
  );
}


if (summarizeBtn) {

  summarizeBtn.addEventListener(
    "click",
    summarizeAbstract
  );
}


// =========================================================
// Start
// =========================================================

if (categorySelect) {

  loadPaper(
    categorySelect.value,
    false
  );

}
