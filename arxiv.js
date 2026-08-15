// =========================================================
// arXiv Technical Report
// Main JavaScript
//
// Requirements in arxiv.html:
//
// <script src="scientific-dictionary.js"></script>
// <script src="arxiv.js"></script>
//
// Compromise is OPTIONAL.
// The simplifier works without it.
// =========================================================


const API = "https://export.arxiv.org/api/query";
const PROXY = "https://corsproxy.io/?";


// =========================================================
// DOM ELEMENTS
// =========================================================

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


// =========================================================
// STATE
// =========================================================

let currentStart = 0;
let lastIsAll = false;

const PAGE_SIZE = 10;


// =========================================================
// THEME
// =========================================================

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);

  if (themeToggle) {
    themeToggle.textContent =
      theme === "dark" ? "Light" : "Dark";
  }

  try {
    localStorage.setItem("arxiv-theme", theme);
  } catch (e) {
    // localStorage may be unavailable.
  }
}


(function initTheme() {
  let saved = "light";

  try {
    saved =
      localStorage.getItem("arxiv-theme") || "light";
  } catch (e) {}

  applyTheme(saved);
})();


if (themeToggle) {
  themeToggle.addEventListener("click", function () {

    const current =
      document.documentElement.getAttribute("data-theme") ||
      "light";

    applyTheme(
      current === "dark" ? "light" : "dark"
    );
  });
}


// =========================================================
// STATUS / PAPER DISPLAY
// =========================================================

function showStatus(message) {

  if (paperContent) {
    paperContent.hidden = true;
  }

  if (paperStatus) {
    paperStatus.hidden = false;
    paperStatus.textContent = message;
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


  const absLink =
    document.getElementById("paper-abs-link");

  const pdfLink =
    document.getElementById("paper-pdf-link");


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


  // Reset summary.

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

  const parser = new DOMParser();

  const doc =
    parser.parseFromString(
      xmlText,
      "application/xml"
    );


  if (doc.querySelector("parsererror")) {
    return [];
  }


  return Array.from(
    doc.querySelectorAll("entry")
  ).map(function (entry) {

    const idNode =
      entry.querySelector("id");

    const idUrl =
      idNode
        ? idNode.textContent
        : "";


    const arxivId =
      idUrl.split("/abs/").pop() ||
      idUrl;


    const titleNode =
      entry.querySelector("title");

    const title =
      titleNode
        ? titleNode.textContent
            .replace(/\s+/g, " ")
            .trim()
        : "";


    const summaryNode =
      entry.querySelector("summary");

    const summary =
      summaryNode
        ? summaryNode.textContent
            .replace(/\s+/g, " ")
            .trim()
        : "";


    const publishedNode =
      entry.querySelector("published");

    const published =
      publishedNode
        ? publishedNode.textContent.slice(0, 10)
        : "";


    const authors =
      Array.from(
        entry.querySelectorAll("author name")
      )
      .map(function (node) {
        return node.textContent.trim();
      })
      .join(", ");


    const cats =
      Array.from(
        entry.querySelectorAll("category")
      )
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
// HTML ESCAPING
// =========================================================

function escapeHtml(str) {

  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// =========================================================
// CATEGORY QUERY
// =========================================================

function getCategoryQuery(category) {

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

  return "cat:" + category;
}


// =========================================================
// LOAD NEWEST / RANDOM PAPER
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


  const catQuery =
    getCategoryQuery(category);


  let start = 0;


  if (random) {
    start =
      Math.floor(
        Math.random() * 200
      );
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
    encodeURIComponent(
      API + "?" + query
    );


  try {

    const res =
      await fetch(url);


    if (!res.ok) {
      throw new Error(
        "HTTP " + res.status
      );
    }


    const text =
      await res.text();


    const papers =
      parseEntries(text);


    if (!papers.length) {

      showStatus(
        "No papers found in this category."
      );

      return;
    }


    showPaper(papers[0]);


  } catch (error) {

    console.error(error);

    showStatus(
      "Could not reach arXiv. See console."
    );
  }
}


// =========================================================
// SEARCH
// =========================================================

async function runSearch(start) {

  if (typeof start !== "number") {
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


  currentStart = start;


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
      .map(function (option) {
        return option.value;
      });


    const catPart =
      cats
        .map(function (category) {
          return getCategoryQuery(category);
        })
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
      getCategoryQuery(category) +
      ' AND ti:"' +
      keyword +
      '"';
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
    encodeURIComponent(
      API + "?" + query
    );


  try {

    const res =
      await fetch(url);


    if (!res.ok) {
      throw new Error(
        "HTTP " + res.status
      );
    }


    const text =
      await res.text();


    const papers =
      parseEntries(text);


    if (!resultsBox) {
      return;
    }


    resultsBox.innerHTML = "";


    if (!papers.length) {

      resultsBox.innerHTML =
        '<div class="status" style="padding:1rem">' +
        "No results." +
        "</div>";

      return;
    }


    papers.forEach(function (paper) {

      const div =
        document.createElement("div");


      div.className =
        "result-item";


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


      div.addEventListener(
        "click",
        function () {

          showPaper(paper);

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        }
      );


      resultsBox.appendChild(div);
    });


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
        papers.length < PAGE_SIZE;
    }


  } catch (error) {

    console.error(error);

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
//
// No AI.
// No API.
// No subscription.
// No model download.
//
// Compromise is optional. If it is loaded, we use it.
// If it isn't loaded, the browser's own sentence splitting
// is used instead.
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


  // Allow browser to paint the loading message.

  setTimeout(function () {

    try {

      const summary =
        simplifyAbstract(abstract);


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

  }, 50);
}


// =========================================================
// MAIN ABSTRACT SIMPLIFIER
// =========================================================

function simplifyAbstract(text) {

  let sentences =
    splitIntoSentences(text);


  if (!sentences.length) {
    return simplifySentence(text);
  }


  // Remove very short fragments.

  sentences =
    sentences.filter(function (sentence) {

      return sentence.length >= 35;
    });


  if (!sentences.length) {
    return simplifySentence(text);
  }


  // Score sentences.

  const ranked =
    sentences
      .map(function (sentence, index) {

        return {
          sentence: sentence,
          index: index,
          score: scoreSentence(
            sentence,
            index,
            sentences.length
          )
        };
      })
      .sort(function (a, b) {

        return b.score - a.score;
      });


  // -------------------------------------------------------
  // Select useful sentences.
  //
  // We don't want four random sentences.
  // We want a mixture of:
  //
  // problem
  // method
  // result
  // importance
  // -------------------------------------------------------

  const selected = [];


  function addBest(predicate) {

    const match =
      ranked.find(function (item) {

        return (
          !selected.some(function (chosen) {
            return chosen.index === item.index;
          }) &&
          predicate(
            item.sentence.toLowerCase()
          )
        );
      });


    if (match) {
      selected.push(match);
    }
  }


  // Problem.

  addBest(function (text) {

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
  });


  // Method.

  addBest(function (text) {

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
  });


  // Results.

  addBest(function (text) {

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
  });


  // Fill remaining slots.

  ranked.forEach(function (item) {

    if (selected.length >= 4) {
      return;
    }


    const exists =
      selected.some(function (chosen) {

        return chosen.index === item.index;
      });


    if (!exists) {
      selected.push(item);
    }
  });


  // Restore original order.

  selected.sort(function (a, b) {

    return a.index - b.index;
  });


  // Simplify.

  let simplified =
    selected
      .slice(0, 4)
      .map(function (item) {

        return simplifySentence(
          item.sentence
        );
      })
      .filter(Boolean);


  // Remove duplicates.

  simplified =
    removeDuplicateSentences(
      simplified
    );


  let result =
    simplified.join(" ");


  // Final cleanup.

  result =
    result
      .replace(/\s+/g, " ")
      .replace(/\s+([,.!?])/g, "$1")
      .trim();


  // Maximum length.

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

function splitIntoSentences(text) {

  // Use Compromise if available.

  if (typeof nlp === "function") {

    try {

      const doc = nlp(text);

      const sentences =
        doc
          .sentences()
          .out("array")
          .map(function (sentence) {

            return sentence
              .replace(/\s+/g, " ")
              .trim();
          });


      if (sentences.length) {
        return sentences;
      }

    } catch (error) {

      console.warn(
        "Compromise failed. Using fallback sentence splitter.",
        error
      );
    }
  }


  // -------------------------------------------------------
  // Fallback.
  //
  // This means your simplifier still works even if the
  // Compromise CDN is blocked.
  // -------------------------------------------------------

  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(function (sentence) {

      return sentence.trim();
    })
    .filter(Boolean);
}


// =========================================================
// SENTENCE SCORING
// =========================================================

function scoreSentence(sentence, index, total) {

  const lower =
    sentence.toLowerCase();


  let score = 0;


  // First sentence usually contains background/problem.

  if (index === 0) {
    score += 5;
  }


  if (index === 1) {
    score += 2;
  }


  // Useful research words.

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

      if (lower.includes(term)) {
        score += 2;
      }
    }
  );


  // "Here, we show..." is particularly useful.

  if (
    /\bhere,\s+we\s+(show|demonstrate|present)\b/i
      .test(sentence)
  ) {
    score += 5;
  }


  // Shorter sentences are easier to simplify.

  if (sentence.length < 220) {
    score += 2;
  }


  if (sentence.length > 450) {
    score -= 3;
  }


  // Prefer sentences that aren't simply references.

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

function applyScientificDictionary(text) {

  // The dictionary is in scientific-dictionary.js.

  if (
    typeof SCIENTIFIC_DICTIONARY === "undefined" ||
    !SCIENTIFIC_DICTIONARY
  ) {

    console.warn(
      "scientific-dictionary.js was not loaded."
    );

    return text;
  }


  let result = text;


  // Longer phrases MUST be replaced first.

  const terms =
    Object.keys(
      SCIENTIFIC_DICTIONARY
    )
    .sort(function (a, b) {

      return b.length - a.length;
    });


  terms.forEach(function (term) {

    const replacement =
      SCIENTIFIC_DICTIONARY[term];


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
  });


  return result;
}


// =========================================================
// ACADEMIC PHRASE REWRITES
// =========================================================
//
// These are separate from the dictionary because they
// change the structure/meaning of a phrase rather than
// simply replacing one scientific term.
// =========================================================

function simplifyAcademicPhrases(text) {

  let result = text;


  const replacements = [

    // Research language.

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


    // Academic connectors.

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


    // Long academic phrases.

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


    // Research result phrases.

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


    // Common scientific constructions.

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


    // Specific transformations.

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

function simplifySentence(sentence) {

  let result = sentence;


  // Remove citation references.

  result =
    result.replace(
      /\[[0-9,\-\s]+\]/g,
      ""
    );


  // Remove excessive whitespace.

  result =
    result.replace(
      /\s+/g,
      " "
    )
    .trim();


  // Academic phrase transformations.

  result =
    simplifyAcademicPhrases(
      result
    );


  // Scientific dictionary.

  result =
    applyScientificDictionary(
      result
    );


  // More general simplifications.

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


  // Cleanup.

  result =
    result
      .replace(/\s+/g, " ")
      .replace(/\s+([,.!?])/g, "$1")
      .trim();


  // Capitalize.

  if (result.length > 0) {

    result =
      result.charAt(0).toUpperCase() +
      result.slice(1);
  }


  return result;
}


// =========================================================
// REMOVE DUPLICATE SENTENCES
// =========================================================

function removeDuplicateSentences(sentences) {

  const result = [];


  sentences.forEach(function (sentence) {

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
  });


  return result;
}


// =========================================================
// TEXT SIMILARITY
// =========================================================

function textSimilarity(a, b) {

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


  let common = 0;


  wordsA.forEach(function (word) {

    if (wordsB.has(word)) {
      common++;
    }
  });


  return (
    common /
    Math.max(
      wordsA.size,
      wordsB.size
    )
  );
}


// =========================================================
// EVENTS
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
    function (event) {

      if (event.key === "Enter") {

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

      if (
        currentStart >= PAGE_SIZE
      ) {

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
// START
// =========================================================

if (categorySelect) {

  loadPaper(
    categorySelect.value,
    false
  );
}
