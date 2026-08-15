// =========================================================
// arXiv Technical Report
// Main JavaScript
//
// Required HTML order:
//
// <script src="scientific-dictionary.js"></script>
// <script src="arxiv.js"></script>
//
// Features:
//
// - arXiv category browsing
// - newest paper for selected category
// - 5 latest papers in left sidebar
// - clickable latest papers
// - keyword search
// - search-all
// - pagination
// - random paper
// - scientific dictionary simplification
// - academic phrase simplification
// - related Wikipedia articles
// - light / dark theme
//
// No Compromise dependency.
// =========================================================


const API =
  "https://export.arxiv.org/api/query";

const PROXY =
  "https://corsproxy.io/?";

const WIKIPEDIA_API =
  "https://en.wikipedia.org/w/api.php";


const PAGE_SIZE = 10;

const LATEST_COUNT = 5;


// =========================================================
// DOM
// =========================================================

const categorySelect =
  document.getElementById("category-select");

const keywordInput =
  document.getElementById("keyword-input");

const searchBtn =
  document.getElementById("search-btn");

const searchAllBtn =
  document.getElementById("search-all-btn");


const paperStatus =
  document.getElementById("paper-status");

const paperContent =
  document.getElementById("paper-content");


const resultsSection =
  document.getElementById("results-section");

const resultsBox =
  document.getElementById("results-box");

const resultsInfo =
  document.getElementById("results-info");


const prevBtn =
  document.getElementById("prev-btn");

const nextBtn =
  document.getElementById("next-btn");


const themeToggle =
  document.getElementById("theme-toggle");

const randomPaperBtn =
  document.getElementById("random-paper-btn");


const summarizeBtn =
  document.getElementById("summarize-btn");

const summaryBox =
  document.getElementById("summary-box");


const latestList =
  document.getElementById("latest-list");

const latestCategory =
  document.getElementById("latest-category");


const wikipediaList =
  document.getElementById("wikipedia-list");


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

  document.documentElement
    .setAttribute(
      "data-theme",
      theme
    );


  if (themeToggle) {

    themeToggle.textContent =
      theme === "dark"
        ? "Light"
        : "Dark";
  }


  try {

    localStorage.setItem(
      "arxiv-theme",
      theme
    );

  } catch (error) {

    // Ignore localStorage errors.
  }
}


(function initTheme() {

  let saved =
    "light";


  try {

    saved =
      localStorage.getItem(
        "arxiv-theme"
      ) || "light";

  } catch (error) {}


  applyTheme(saved);

})();


if (themeToggle) {

  themeToggle.addEventListener(
    "click",
    function () {

      const current =
        document.documentElement
          .getAttribute("data-theme") ||
        "light";


      applyTheme(
        current === "dark"
          ? "light"
          : "dark"
      );

    }
  );

}


// =========================================================
// CATEGORY NAME
// =========================================================

function getCategoryName() {

  if (!categorySelect) {
    return "";
  }


  const option =
    categorySelect.options[
      categorySelect.selectedIndex
    ];


  return option
    ? option.textContent.trim()
    : categorySelect.value;
}


// =========================================================
// STATUS
// =========================================================

function showStatus(message) {

  if (paperContent) {
    paperContent.hidden = true;
  }


  if (paperStatus) {

    paperStatus.hidden = false;

    paperStatus.textContent =
      message;
  }
}


// =========================================================
// PAPER DISPLAY
// =========================================================

function showPaper(paper) {

  currentPaper =
    paper;


  if (paperStatus) {
    paperStatus.hidden = true;
  }


  if (paperContent) {
    paperContent.hidden = false;
  }


  const idEl =
    document.getElementById(
      "paper-id"
    );

  const dateEl =
    document.getElementById(
      "paper-date"
    );

  const catsEl =
    document.getElementById(
      "paper-cats"
    );

  const titleEl =
    document.getElementById(
      "paper-title"
    );

  const authorsEl =
    document.getElementById(
      "paper-authors"
    );

  const abstractEl =
    document.getElementById(
      "paper-abstract"
    );


  if (idEl) {
    idEl.textContent =
      paper.arxivId || "";
  }


  if (dateEl) {
    dateEl.textContent =
      paper.published || "";
  }


  if (catsEl) {
    catsEl.textContent =
      paper.cats || "";
  }


  if (titleEl) {
    titleEl.textContent =
      paper.title || "";
  }


  if (authorsEl) {
    authorsEl.textContent =
      paper.authors || "";
  }


 if (abstractEl) {
  abstractEl.innerHTML =
    renderBasicLatex(paper.summary || "");
}


  const absLink =
    document.getElementById(
      "paper-abs-link"
    );

  const pdfLink =
    document.getElementById(
      "paper-pdf-link"
    );


  if (absLink) {

    absLink.href =
      "https://arxiv.org/abs/" +
      paper.arxivId;
  }


  if (pdfLink) {

    pdfLink.href =
      "https://arxiv.org/pdf/" +
      paper.arxivId +
      ".pdf";
  }


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
      'Click “Sum up” for a short, plain-English version of the abstract.' +
      "</p>";
  }
}


// =========================================================
// XML PARSER
// =========================================================

function parseEntries(xmlText) {

  const parser =
    new DOMParser();


  const doc =
    parser.parseFromString(
      xmlText,
      "application/xml"
    );


  if (
    doc.querySelector(
      "parsererror"
    )
  ) {

    console.error(
      "Could not parse arXiv XML."
    );

    return [];
  }


  return Array.from(
    doc.querySelectorAll(
      "entry"
    )
  ).map(function (entry) {

    const idNode =
      entry.querySelector(
        "id"
      );


    const idUrl =
      idNode
        ? idNode.textContent.trim()
        : "";


    const arxivId =
      idUrl
        .split("/abs/")
        .pop()
        .split("?")[0] ||
      idUrl;


    const titleNode =
      entry.querySelector(
        "title"
      );


    const title =
      titleNode
        ? titleNode.textContent
            .replace(/\s+/g, " ")
            .trim()
        : "";


    const summaryNode =
      entry.querySelector(
        "summary"
      );


    const summary =
      summaryNode
        ? summaryNode.textContent
            .replace(/\s+/g, " ")
            .trim()
        : "";


    const publishedNode =
      entry.querySelector(
        "published"
      );


    const published =
      publishedNode
        ? publishedNode.textContent
            .slice(0, 10)
        : "";


    const authors =
      Array.from(
        entry.querySelectorAll(
          "author name"
        )
      )
      .map(function (node) {

        return node.textContent.trim();

      })
      .join(", ");


    const cats =
      Array.from(
        entry.querySelectorAll(
          "category"
        )
      )
      .map(function (node) {

        return node.getAttribute(
          "term"
        );

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
// HTML ESCAPING
// =========================================================

function escapeHtml(str) {

  return String(str)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );
}

// =========================================================
// BASIC LATEX → HTML (subscripts / superscripts)
// =========================================================
function renderBasicLatex(text) {
  if (!text) return "";

  // Escape HTML first so we stay safe
  let html = escapeHtml(text);

  // Subscripts: $_{...}$  or  $_...$
  html = html.replace(
    /\$\_\{([^}]+)\}\$/g,
    "<sub>$1</sub>"
  );
  html = html.replace(
    /\$\_([A-Za-z0-9+\-]+)/g,
    "<sub>$1</sub>"
  );

  // Superscripts: $^{...}$  or  $^...$
  html = html.replace(
    /\$\^\{([^}]+)\}\$/g,
    "<sup>$1</sup>"
  );
  html = html.replace(
    /\$\^([A-Za-z0-9+\-]+)/g,
    "<sup>$1</sup>"
  );

  // Simple math mode leftovers: $x$ → just the content (or italic)
  html = html.replace(
    /\$([^$]+)\$/g,
    "<i>$1</i>"
  );

  return html;
}
// =========================================================
// CATEGORY QUERY
//
// IMPORTANT:
// Keep the category system intact.
//
// q-fin is special because its parent category is not
// directly usable in the same way as a normal arXiv
// category.
// =========================================================

function getCategoryQuery(category) {
  // Special case already present
  if (category === "q-fin") {
    return (
      "(cat:q-fin.CP OR " +
      "cat:q-fin.MF OR " +
      "cat:q-fin.PM OR " +
      "cat:q-fin.PR OR " +
      "cat:q-fin.RM OR " +
      "cat:q-fin.ST OR " +
      "cat:q-fin.TR OR " +
      "cat:q-fin.GN)"
    );
  }

  // Top-level archives that need a wildcard
  const needsWildcard = new Set([
    "physics",
    "math",
    "cs",
    "q-bio",
    "stat",
    "eess",
    "econ",
    "nlin",
    "astro-ph",   // optional but safer
    "cond-mat"
  ]);

  if (needsWildcard.has(category)) {
    // physics* works; math.* and cs.* are the conventional forms
    if (category === "math" || category === "cs") {
      return "cat:" + category + ".*";
    }
    return "cat:" + category + "*";
  }

  // Leaf categories (hep-th, quant-ph, cs.LG, …)
  return "cat:" + category;
}

// =========================================================
// ARXIV FETCH
// =========================================================

async function fetchArxiv(
  searchQuery,
  start,
  maxResults
) {

  const query =
    "search_query=" +
    encodeURIComponent(
      searchQuery
    ) +

    "&sortBy=submittedDate" +

    "&sortOrder=descending" +

    "&start=" +
    start +

    "&max_results=" +
    maxResults;


  const url =
    PROXY +
    encodeURIComponent(
      API + "?" + query
    );


  const response =
    await fetch(url);


  if (!response.ok) {

    throw new Error(
      "arXiv HTTP " +
      response.status
    );
  }


  const text =
    await response.text();


  return parseEntries(text);
}


// =========================================================
// LOAD LATEST FIVE
// =========================================================
//
// This is separate from loadPaper().
// Therefore the sidebar always contains the actual newest
// five papers even when the main paper is randomly selected.
// =========================================================

async function loadLatestPapers() {

  if (!categorySelect) {
    return;
  }


  const requestId =
    ++latestRequestId;


  const category =
    categorySelect.value;


  const categoryName =
    getCategoryName();


  if (latestCategory) {

    latestCategory.textContent =
      categoryName;
  }


  if (latestList) {

    latestList.innerHTML =
      '<div class="latest-loading">' +
      "Loading latest papers…" +
      "</div>";
  }


  try {

    const papers =
      await fetchArxiv(
        getCategoryQuery(category),
        0,
        LATEST_COUNT
      );


    // Ignore old requests when user changes category
    // quickly.

    if (
      requestId !== latestRequestId
    ) {
      return;
    }


    latestPapers =
      papers;


    renderLatestPapers(
      papers
    );


  } catch (error) {

    console.error(
      "Latest papers error:",
      error
    );


    if (latestList) {

      latestList.innerHTML =
        '<div class="latest-loading">' +
        "Could not load latest papers." +
        "</div>";
    }
  }
}


// =========================================================
// RENDER LATEST FIVE
// =========================================================

function renderLatestPapers(
  papers
) {

  if (!latestList) {
    return;
  }


  latestList.innerHTML =
    "";


  if (!papers.length) {

    latestList.innerHTML =
      '<div class="latest-loading">' +
      "No recent papers found." +
      "</div>";

    return;
  }


  papers.forEach(
    function (paper, index) {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "latest-item";


      button.dataset.arxivId =
        paper.arxivId;


      button.innerHTML =

        '<span class="latest-item-number">' +
        String(index + 1).padStart(2, "0") +
        "</span>" +

        '<span class="latest-item-title">' +
        escapeHtml(
          paper.title
        ) +
        "</span>" +

        '<span class="latest-item-date">' +
        escapeHtml(
          paper.published
        ) +
        "</span>";


      button.addEventListener(
        "click",
        function () {

          showPaper(
            paper
          );


          window.scrollTo({

            top: 0,

            behavior: "smooth"

          });

        }
      );


      latestList.appendChild(
        button
      );

    }
  );


  refreshLatestHighlight();
}


// =========================================================
// HIGHLIGHT CURRENT PAPER IN LATEST LIST
// =========================================================

function refreshLatestHighlight() {

  if (!latestList) {
    return;
  }


  const items =
    latestList.querySelectorAll(
      ".latest-item"
    );


  items.forEach(
    function (item) {

      item.classList.toggle(
        "active",
        currentPaper &&
        item.dataset.arxivId ===
        currentPaper.arxivId
      );

    }
  );
}


// =========================================================
// LOAD NEWEST / RANDOM MAIN PAPER
// =========================================================

async function loadPaper(
  category,
  random
) {

  showStatus(
    random
      ? "Loading random paper…"
      : "Loading newest paper…"
  );


  if (resultsSection) {
    resultsSection.hidden = true;
  }


  const catQuery =
    getCategoryQuery(
      category
    );


  let start =
    0;


  if (random) {

    start =
      Math.floor(
        Math.random() * 200
      );
  }


  try {

    const papers =
      await fetchArxiv(
        catQuery,
        start,
        1
      );


    if (!papers.length) {

      showStatus(
        "No papers found in this category."
      );

      return;
    }


    showPaper(
      papers[0]
    );


  } catch (error) {

    console.error(
      error
    );


    showStatus(
      "Could not reach arXiv. See console."
    );
  }
}


// =========================================================
// SEARCH
// =========================================================

async function runSearch(
  start
) {

  if (
    typeof start !== "number"
  ) {

    start = 0;
  }


  const keyword =
    keywordInput
      ? keywordInput.value.trim()
      : "";


  if (!keyword) {

    alert(
      "Please type a keyword first."
    );

    return;
  }


  currentStart =
    start;


  if (resultsSection) {
    resultsSection.hidden = false;
  }


  if (resultsBox) {

    resultsBox.innerHTML =
      '<div class="status" style="padding:1rem">' +
      "Searching…" +
      "</div>";
  }


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


  // -------------------------------------------------------
  // Search all categories
  // -------------------------------------------------------

  if (lastIsAll) {

    const cats =
      Array.from(
        categorySelect.options
      )
      .map(
        function (option) {
          return option.value;
        }
      );


    const catPart =
      cats
        .map(
          function (category) {
            return getCategoryQuery(
              category
            );
          }
        )
        .join(" OR ");


    searchQuery =
      "(" +
      catPart +
      ") AND ti:\"" +
      keyword +
      "\"";


  } else {

    const category =
      categorySelect.value;


    searchQuery =
      getCategoryQuery(
        category
      ) +

      ' AND ti:"' +
      keyword +
      '"';
  }


  try {

    const papers =
      await fetchArxiv(
        searchQuery,
        start,
        PAGE_SIZE
      );


    if (!resultsBox) {
      return;
    }


    resultsBox.innerHTML =
      "";


    if (!papers.length) {

      resultsBox.innerHTML =
        '<div class="status" style="padding:1rem">' +
        "No results." +
        "</div>";

      return;
    }


    papers.forEach(
      function (paper) {

        const div =
          document.createElement(
            "div"
          );


        div.className =
          "result-item";


        div.innerHTML =

          '<div class="result-title">' +

          escapeHtml(
            paper.title
          ) +

          "</div>" +

          '<div class="result-meta">' +

          escapeHtml(
            paper.authors
          ) +

          " · " +

          escapeHtml(
            paper.published
          ) +

          " · " +

          escapeHtml(
            paper.cats
          ) +

          "</div>";


        div.addEventListener(
          "click",
          function () {

            showPaper(
              paper
            );


            window.scrollTo({

              top: 0,

              behavior: "smooth"

            });

          }
        );


        resultsBox.appendChild(
          div
        );

      }
    );


    if (resultsInfo) {

      resultsInfo.textContent =
        (start + 1) +
        "–" +
        (start + papers.length);
    }


    if (prevBtn) {

      prevBtn.disabled =
        start === 0;
    }


    if (nextBtn) {

      nextBtn.disabled =
        papers.length <
        PAGE_SIZE;
    }


  } catch (error) {

    console.error(
      error
    );


    if (resultsBox) {

      resultsBox.innerHTML =
        '<div class="status" style="padding:1rem">' +
        "Search failed." +
        "</div>";
    }
  }
}


// =========================================================
// ABSTRACT SIMPLIFIER
// =========================================================

function summarizeAbstract() {

  const abstractEl =
    document.getElementById(
      "paper-abstract"
    );


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


  setTimeout(
    function () {

      try {

        const summary =
          simplifyAbstract(
            abstract
          );


        if (!summary) {

          throw new Error(
            "No simplified text was produced."
          );
        }


        if (summaryBox) {

          summaryBox.innerHTML =
            '<p class="summary-result">' +
            escapeHtml(summary) +
            "</p>";
        }


      } catch (error) {

        console.error(
          "Simplification error:",
          error
        );


        if (summaryBox) {

          summaryBox.innerHTML =
            '<p class="summary-placeholder">' +
            "I could not simplify this abstract." +
            "</p>";
        }


      } finally {

        if (summarizeBtn) {
          summarizeBtn.disabled = false;
        }

      }

    },
    50
  );
}


// =========================================================
// MAIN ABSTRACT SIMPLIFIER
// =========================================================

function simplifyAbstract(text) {

  let sentences =
    splitIntoSentences(
      text
    );


  if (!sentences.length) {

    return simplifySentence(
      text
    );
  }


  sentences =
    sentences.filter(
      function (sentence) {

        return sentence.length >= 35;

      }
    );


  if (!sentences.length) {

    return simplifySentence(
      text
    );
  }


  const ranked =
    sentences

      .map(
        function (sentence, index) {

          return {

            sentence:
              sentence,

            index:
              index,

            score:
              scoreSentence(
                sentence,
                index,
                sentences.length
              )

          };

        }
      )

      .sort(
        function (a, b) {

          return b.score -
            a.score;

        }
      );


  const selected = [];


  function addBest(
    predicate
  ) {

    const match =
      ranked.find(
        function (item) {

          return (

            !selected.some(
              function (chosen) {

                return chosen.index ===
                  item.index;

              }
            )

            &&

            predicate(
              item.sentence
                .toLowerCase()
            )

          );

        }
      );


    if (match) {

      selected.push(
        match
      );
    }
  }


  // Problem / motivation

  addBest(
    function (text) {

      return (

        text.includes("problem") ||
        text.includes("challenge") ||
        text.includes("difficult") ||
        text.includes("difficulty") ||
        text.includes("limited") ||
        text.includes("lack") ||
        text.includes("avoid") ||
        text.includes("cannot") ||
        text.includes("hard")

      );

    }
  );


  // Method

  addBest(
    function (text) {

      return (

        text.includes("we propose") ||
        text.includes("we present") ||
        text.includes("we introduce") ||
        text.includes("we develop") ||
        text.includes("we use") ||
        text.includes("we apply") ||
        text.includes("method") ||
        text.includes("approach") ||
        text.includes("model") ||
        text.includes("system")

      );

    }
  );


  // Results

  addBest(
    function (text) {

      return (

        text.includes("result") ||
        text.includes("results") ||
        text.includes("find") ||
        text.includes("show") ||
        text.includes("demonstrate") ||
        text.includes("improve") ||
        text.includes("increase") ||
        text.includes("reduce")

      );

    }
  );


  ranked.forEach(
    function (item) {

      if (selected.length >= 4) {
        return;
      }


      const exists =
        selected.some(
          function (chosen) {

            return chosen.index ===
              item.index;

          }
        );


      if (!exists) {

        selected.push(
          item
        );
      }

    }
  );


  selected.sort(
    function (a, b) {

      return a.index -
        b.index;

    }
  );


  let simplified =
    selected

      .slice(0, 4)

      .map(
        function (item) {

          return simplifySentence(
            item.sentence
          );

        }
      )

      .filter(Boolean);


  simplified =
    removeDuplicateSentences(
      simplified
    );


  let result =
    simplified.join(" ");


  result =
    result

      .replace(
        /\s+/g,
        " "
      )

      .replace(
        /\s+([,.!?])/g,
        "$1"
      )

      .trim();


  const words =
    result.split(/\s+/);


  if (words.length > 115) {

    result =
      words
        .slice(0, 110)
        .join(" ") +
      "…";
  }


  return result;
}


// =========================================================
// SENTENCE SPLITTING
// =========================================================
//
// Compromise is intentionally NOT required.
//
// This fixes the previous CDN/MIME problem because the
// simplifier never depends on compromise.min.js.
// =========================================================

function splitIntoSentences(text) {

  return text

    .replace(
      /\s+/g,
      " "
    )

    .trim()

    .split(
      /(?<=[.!?])\s+(?=[A-Z])/ 
    )

    .map(
      function (sentence) {

        return sentence.trim();

      }
    )

    .filter(Boolean);
}


// =========================================================
// SENTENCE SCORING
// =========================================================

function scoreSentence(
  sentence,
  index,
  total
) {

  const lower =
    sentence.toLowerCase();


  let score =
    0;


  if (index === 0) {
    score += 5;
  }


  if (index === 1) {
    score += 2;
  }


  const importantTerms = [

    "problem",
    "challenge",
    "difficult",
    "difficulty",
    "limited",
    "limit",
    "avoid",
    "lack",
    "cannot",
    "unable",

    "we propose",
    "we present",
    "we introduce",
    "we develop",
    "we use",
    "we apply",

    "result",
    "results",
    "find",
    "found",
    "show",
    "shows",
    "demonstrate",
    "improve",
    "improvement",
    "increase",
    "reduce",
    "performance",

    "important",
    "useful",
    "benefit",
    "potential"

  ];


  importantTerms.forEach(
    function (term) {

      if (
        lower.includes(term)
      ) {

        score += 2;
      }

    }
  );


  if (
    /\bhere,\s+we\s+(show|demonstrate|present)\b/i
      .test(sentence)
  ) {

    score += 5;
  }


  if (
    sentence.length < 220
  ) {

    score += 2;
  }


  if (
    sentence.length > 450
  ) {

    score -= 3;
  }


  if (
    /\b(as shown in|see also|according to)\b/i
      .test(lower)
  ) {

    score -= 2;
  }


  return score;
}


// =========================================================
// SCIENTIFIC DICTIONARY
// =========================================================
//
// THIS IS WHERE scientific-dictionary.js IS USED.
//
// The HTML loads:
// scientific-dictionary.js
//
// before:
// arxiv.js
//
// So SCIENTIFIC_DICTIONARY is available here.
// =========================================================

function applyScientificDictionary(
  text
) {

  if (
    typeof SCIENTIFIC_DICTIONARY ===
      "undefined" ||

    !SCIENTIFIC_DICTIONARY
  ) {

    console.warn(
      "scientific-dictionary.js was not loaded."
    );

    return text;
  }


  let result =
    text;


  const terms =
    Object.keys(
      SCIENTIFIC_DICTIONARY
    )
    .sort(
      function (a, b) {

        return b.length -
          a.length;

      }
    );


  terms.forEach(
    function (term) {

      const replacement =
        SCIENTIFIC_DICTIONARY[
          term
        ];


      const escaped =
        term.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );


      const regex =
        new RegExp(
          "\\b" +
          escaped +
          "\\b",
          "gi"
        );


      result =
        result.replace(
          regex,
          replacement
        );

    }
  );


  return result;
}


// =========================================================
// ACADEMIC PHRASES
// =========================================================

function simplifyAcademicPhrases(
  text
) {

  let result =
    text;


  const replacements = [

    [
      /\bhere,\s+we\s+show\b/gi,
      "this paper shows"
    ],

    [
      /\bhere,\s+we\s+demonstrate\b/gi,
      "this paper shows"
    ],

    [
      /\bin this work,\s+we\b/gi,
      "in this study, we"
    ],

    [
      /\bin this paper,\s+we\b/gi,
      "this paper"
    ],

    [
      /\bwe investigate\b/gi,
      "we study"
    ],

    [
      /\bwe examine\b/gi,
      "we study"
    ],

    [
      /\bwe analyze\b/gi,
      "we study"
    ],

    [
      /\bwe analyse\b/gi,
      "we study"
    ],

    [
      /\bwe propose\b/gi,
      "we suggest"
    ],

    [
      /\bwe introduce\b/gi,
      "we present"
    ],

    [
      /\bwe develop\b/gi,
      "we create"
    ],

    [
      /\bwe demonstrate\b/gi,
      "we show"
    ],

    [
      /\bwe establish\b/gi,
      "we show"
    ],

    [
      /\bwe utilize\b/gi,
      "we use"
    ],

    [
      /\bfurthermore\b/gi,
      "also"
    ],

    [
      /\bmoreover\b/gi,
      "also"
    ],

    [
      /\btherefore\b/gi,
      "so"
    ],

    [
      /\bconsequently\b/gi,
      "so"
    ],

    [
      /\bnevertheless\b/gi,
      "however"
    ],

    [
      /\bthus\b/gi,
      "so"
    ],

    [
      /\bhence\b/gi,
      "so"
    ],

    [
      /\bin order to\b/gi,
      "to"
    ],

    [
      /\bwith respect to\b/gi,
      "about"
    ],

    [
      /\bin the context of\b/gi,
      "in"
    ],

    [
      /\bin terms of\b/gi,
      "for"
    ],

    [
      /\bin accordance with\b/gi,
      "following"
    ],

    [
      /\bwith the aim of\b/gi,
      "to"
    ],

    [
      /\bfor the purpose of\b/gi,
      "to"
    ],

    [
      /\bprior to\b/gi,
      "before"
    ],

    [
      /\bsubsequently\b/gi,
      "later"
    ],

    [
      /\bapproximately\b/gi,
      "about"
    ],

    [
      /\ba large number of\b/gi,
      "many"
    ],

    [
      /\ba small number of\b/gi,
      "few"
    ],

    [
      /\bour results demonstrate that\b/gi,
      "our results show that"
    ],

    [
      /\bour results indicate that\b/gi,
      "our results show that"
    ],

    [
      /\bthe results demonstrate that\b/gi,
      "the results show that"
    ],

    [
      /\bthe results indicate that\b/gi,
      "the results show that"
    ],

    [
      /\bthe findings suggest that\b/gi,
      "the results suggest that"
    ],

    [
      /\bthe findings demonstrate that\b/gi,
      "the results show that"
    ],

    [
      /\bplays a crucial role\b/gi,
      "is very important"
    ],

    [
      /\bplays an important role\b/gi,
      "is important"
    ],

    [
      /\bplays a significant role\b/gi,
      "is important"
    ],

    [
      /\bhas the potential to\b/gi,
      "could"
    ],

    [
      /\bhas the ability to\b/gi,
      "can"
    ],

    [
      /\bin order for\b/gi,
      "so that"
    ],

    [
      /\bfundamentally alters\b/gi,
      "changes"
    ],

    [
      /\bfundamentally change\b/gi,
      "change"
    ],

    [
      /\bfundamentally changes\b/gi,
      "changes"
    ],

    [
      /\bobscuring\b/gi,
      "making it harder to see"
    ],

    [
      /\bgenerating extreme sensitivity\b/gi,
      "making the system very sensitive"
    ],

    [
      /\bextreme sensitivity to\b/gi,
      "strong sensitivity to"
    ],

    [
      /\bcan be harnessed as key resources\b/gi,
      "can actually be useful"
    ],

    [
      /\bcan be harnessed\b/gi,
      "can be used"
    ],

    [
      /\bkey resources\b/gi,
      "useful tools"
    ],

    [
      /\bincorporating\b/gi,
      "with"
    ],

    [
      /\bconsisting of\b/gi,
      "made of"
    ],

    [
      /\bcomposed of\b/gi,
      "made of"
    ]

  ];


  replacements.forEach(
    function (replacement) {

      result =
        result.replace(
          replacement[0],
          replacement[1]
        );

    }
  );


  return result;
}


// =========================================================
// SIMPLIFY ONE SENTENCE
// =========================================================

function simplifySentence(
  sentence
) {

  let result =
    sentence;


  result =
    result.replace(
      /\[[0-9,\-\s]+\]/g,
      ""
    );


  result =
    result.replace(
      /\s+/g,
      " "
    )
    .trim();


  result =
    simplifyAcademicPhrases(
      result
    );


  // IMPORTANT:
  // Dictionary is applied here.

  result =
    applyScientificDictionary(
      result
    );


  const generalReplacements = [

    [
      /\bnovel approach\b/gi,
      "new method"
    ],

    [
      /\bnovel method\b/gi,
      "new method"
    ],

    [
      /\bnovel framework\b/gi,
      "new system"
    ],

    [
      /\bstate-of-the-art\b/gi,
      "very advanced"
    ],

    [
      /\bhighly accurate\b/gi,
      "very accurate"
    ],

    [
      /\bconsiderably\b/gi,
      "a lot"
    ],

    [
      /\bsignificantly\b/gi,
      "clearly"
    ],

    [
      /\bsubstantial\b/gi,
      "large"
    ],

    [
      /\bprior work\b/gi,
      "earlier research"
    ],

    [
      /\bexisting approaches\b/gi,
      "current methods"
    ],

    [
      /\bexisting methods\b/gi,
      "current methods"
    ],

    [
      /\bunderlying\b/gi,
      "basic"
    ],

    [
      /\bcorresponding\b/gi,
      "matching"
    ],

    [
      /\brespectively\b/gi,
      "in the same order"
    ]

  ];


  generalReplacements.forEach(
    function (replacement) {

      result =
        result.replace(
          replacement[0],
          replacement[1]
        );

    }
  );


  result =
    result

      .replace(
        /\s+/g,
        " "
      )

      .replace(
        /\s+([,.!?])/g,
        "$1"
      )

      .trim();


  if (result.length > 0) {

    result =
      result.charAt(0)
        .toUpperCase() +
      result.slice(1);

  }


  return result;
}


// =========================================================
// REMOVE DUPLICATES
// =========================================================

function removeDuplicateSentences(
  sentences
) {

  const result =
    [];


  sentences.forEach(
    function (sentence) {

      const normalized =
        sentence
          .toLowerCase()
          .replace(
            /[^a-z0-9 ]/g,
            ""
          )
          .trim();


      const duplicate =
        result.some(
          function (existing) {

            return (
              textSimilarity(
                normalized,
                existing
              ) > 0.70
            );

          }
        );


      if (!duplicate) {

        result.push(
          sentence
        );
      }

    }
  );


  return result;
}


// =========================================================
// TEXT SIMILARITY
// =========================================================

function textSimilarity(
  a,
  b
) {

  const wordsA =
    new Set(
      a
        .split(/\s+/)
        .filter(Boolean)
    );


  const wordsB =
    new Set(
      b
        .split(/\s+/)
        .filter(Boolean)
    );


  if (
    !wordsA.size ||
    !wordsB.size
  ) {

    return 0;
  }


  let common =
    0;


  wordsA.forEach(
    function (word) {

      if (
        wordsB.has(word)
      ) {

        common++;
      }

    }
  );


  return (
    common /
    Math.max(
      wordsA.size,
      wordsB.size
    )
  );
}


// =========================================================
// WIKIPEDIA — RELATED ARTICLES
// =========================================================
//
// Uses Wikipedia's public MediaWiki API.
//
// We search using:
//   1. title
//   2. important words from abstract
//
// Then display five results.
//
// No Wikipedia library is required.
// =========================================================

async function loadWikipediaArticles(
  paper
) {

  if (!wikipediaList) {
    return;
  }


  wikipediaList.innerHTML =
    '<div class="wiki-loading">' +
    "Finding related articles…" +
    "</div>";


  const query =
    buildWikipediaQuery(
      paper
    );


  if (!query) {

    wikipediaList.innerHTML =
      '<div class="wiki-placeholder">' +
      "No related topic found." +
      "</div>";

    return;
  }


  try {

    const url =
      WIKIPEDIA_API +
      "?action=query" +
      "&list=search" +
      "&srsearch=" +
      encodeURIComponent(query) +
      "&srlimit=8" +
      "&srnamespace=0" +
      "&format=json" +
      "&origin=*";


    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        "Wikipedia HTTP " +
        response.status
      );
    }


    const data =
      await response.json();


    const results =
      data &&
      data.query &&
      Array.isArray(
        data.query.search
      )
        ? data.query.search
        : [];


    renderWikipediaArticles(
      results.slice(0, 5)
    );


  } catch (error) {

    console.error(
      "Wikipedia search error:",
      error
    );


    wikipediaList.innerHTML =
      '<div class="wiki-placeholder">' +
      "Wikipedia articles could not be loaded." +
      "</div>";
  }
}


// =========================================================
// WIKIPEDIA QUERY BUILDER
// =========================================================

function buildWikipediaQuery(
  paper
) {

  if (!paper) {
    return "";
  }


  const title =
    (paper.title || "")
      .replace(
        /[^\w\s-]/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();


  if (title) {

    // Wikipedia handles a full research title
    // surprisingly well, but we also remove very
    // generic academic words.

    const generic = new Set([

      "a",
      "an",
      "the",
      "and",
      "or",
      "of",
      "for",
      "in",
      "on",
      "with",
      "using",
      "based",
      "toward",
      "towards",
      "study",
      "studies",
      "analysis",
      "approach",
      "method",
      "methods",
      "new",
      "novel"

    ]);


    const titleWords =
      title
        .split(/\s+/)
        .filter(
          function (word) {

            return (
              word.length > 3 &&
              !generic.has(
                word.toLowerCase()
              )
            );

          }
        )
        .slice(0, 8);


    if (titleWords.length) {

      return titleWords.join(" ");
    }
  }


  return "";
}


// =========================================================
// RENDER WIKIPEDIA
// =========================================================

function renderWikipediaArticles(
  articles
) {

  if (!wikipediaList) {
    return;
  }


  wikipediaList.innerHTML =
    "";


  if (!articles.length) {

    wikipediaList.innerHTML =
      '<div class="wiki-placeholder">' +
      "No closely related Wikipedia articles found." +
      "</div>";

    return;
  }


  articles.forEach(
    function (article) {

      const link =
        document.createElement(
          "a"
        );


      link.className =
        "wiki-item";


      link.target =
        "_blank";


      link.rel =
        "noopener";


      const title =
        article.title ||
        "";


      link.href =
        "https://en.wikipedia.org/wiki/" +
        encodeURIComponent(
          title.replace(
            / /g,
            "_"
          )
        );


      const cleanSnippet =
        stripHtml(
          article.snippet || ""
        );


      link.innerHTML =

        '<span class="wiki-item-title">' +
        escapeHtml(title) +
        "</span>" +

        (
          cleanSnippet
            ? '<span class="wiki-item-description">' +
              escapeHtml(
                cleanSnippet
              ) +
              "</span>"
            : ""
        );


      wikipediaList.appendChild(
        link
      );

    }
  );
}


// =========================================================
// STRIP HTML
// =========================================================

function stripHtml(
  html
) {

  const div =
    document.createElement(
      "div"
    );


  div.innerHTML =
    html;


  return (
    div.textContent ||
    div.innerText ||
    ""
  )
  .replace(
    /\s+/g,
    " "
  )
  .trim();
}


// =========================================================
// EVENTS
// =========================================================


// Category changed:
// 1. Load newest main paper.
// 2. Load five latest papers.
// 3. Clear old search state.

if (categorySelect) {

  categorySelect.addEventListener(
    "change",
    function () {

      lastIsAll =
        false;

      currentStart =
        0;


      if (resultsSection) {
        resultsSection.hidden =
          true;
      }


      loadLatestPapers();


      loadPaper(
        categorySelect.value,
        false
      );

    }
  );
}


// Search

if (searchBtn) {

  searchBtn.addEventListener(
    "click",
    function () {

      lastIsAll =
        false;

      runSearch(0);

    }
  );
}


// Search all categories

if (searchAllBtn) {

  searchAllBtn.addEventListener(
    "click",
    function () {

      lastIsAll =
        true;

      runSearch(0);

    }
  );
}


// Enter search

if (keywordInput) {

  keywordInput.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key === "Enter"
      ) {

        lastIsAll =
          false;

        runSearch(0);

      }

    }
  );
}


// Previous

if (prevBtn) {

  prevBtn.addEventListener(
    "click",
    function () {

      if (
        currentStart >=
        PAGE_SIZE
      ) {

        runSearch(
          currentStart -
          PAGE_SIZE
        );

      }

    }
  );
}


// Next

if (nextBtn) {

  nextBtn.addEventListener(
    "click",
    function () {

      runSearch(
        currentStart +
        PAGE_SIZE
      );

    }
  );
}


// Random

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


// Sum up

if (summarizeBtn) {

  summarizeBtn.addEventListener(
    "click",
    summarizeAbstract
  );
}


// =========================================================
// START
// =========================================================
//
// IMPORTANT:
// Both calls happen on startup.
//
// Main:
// newest paper.
//
// Left:
// five newest papers.
//
// They are independent, so the sidebar does not get
// accidentally replaced when the main paper changes.
// =========================================================

if (categorySelect) {

  loadLatestPapers();

  loadPaper(
    categorySelect.value,
    false
  );
}
