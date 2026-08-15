// =========================================================
// arXiv Technical Report
// Main JavaScript
//
// Files required:
//
// <script src="scientific-dictionary.js"></script>
// <script src="arxiv.js"></script>
//
// No Compromise.
// No external NLP library.
// No AI API.
// No subscription.
// =========================================================


const API =
  "https://export.arxiv.org/api/query";

const PROXY =
  "https://corsproxy.io/?";

const WIKIPEDIA_API =
  "https://en.wikipedia.org/w/api.php";


// =========================================================
// DOM ELEMENTS
// =========================================================

const categorySelect =
  document.getElementById(
    "category-select"
  );

const keywordInput =
  document.getElementById(
    "keyword-input"
  );

const searchBtn =
  document.getElementById(
    "search-btn"
  );

const searchAllBtn =
  document.getElementById(
    "search-all-btn"
  );


const paperStatus =
  document.getElementById(
    "paper-status"
  );

const paperContent =
  document.getElementById(
    "paper-content"
  );


const resultsSection =
  document.getElementById(
    "results-section"
  );

const resultsBox =
  document.getElementById(
    "results-box"
  );

const resultsInfo =
  document.getElementById(
    "results-info"
  );


const prevBtn =
  document.getElementById(
    "prev-btn"
  );

const nextBtn =
  document.getElementById(
    "next-btn"
  );


const themeToggle =
  document.getElementById(
    "theme-toggle"
  );

const randomPaperBtn =
  document.getElementById(
    "random-paper-btn"
  );


const summarizeBtn =
  document.getElementById(
    "summarize-btn"
  );

const summaryBox =
  document.getElementById(
    "summary-box"
  );


const latestList =
  document.getElementById(
    "latest-list"
  );


const wikiList =
  document.getElementById(
    "wiki-list"
  );


// =========================================================
// STATE
// =========================================================

let currentStart = 0;

let lastIsAll = false;

let currentPaper = null;

const PAGE_SIZE = 10;


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

    // Ignore storage errors.
  }
}


(function initTheme() {

  let saved = "light";


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
          .getAttribute(
            "data-theme"
          ) || "light";


      applyTheme(
        current === "dark"
          ? "light"
          : "dark"
      );

    }
  );
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
// SHOW PAPER
// =========================================================

function showPaper(paper) {

  currentPaper = paper;


  if (paperStatus) {

    paperStatus.hidden = true;
  }


  if (paperContent) {

    paperContent.hidden = false;
  }


  const paperId =
    document.getElementById(
      "paper-id"
    );

  const paperDate =
    document.getElementById(
      "paper-date"
    );

  const paperCats =
    document.getElementById(
      "paper-cats"
    );

  const paperTitle =
    document.getElementById(
      "paper-title"
    );

  const paperAuthors =
    document.getElementById(
      "paper-authors"
    );

  const paperAbstract =
    document.getElementById(
      "paper-abstract"
    );


  if (paperId) {

    paperId.textContent =
      paper.arxivId || "";
  }


  if (paperDate) {

    paperDate.textContent =
      paper.published || "";
  }


  if (paperCats) {

    paperCats.textContent =
      paper.cats || "";
  }


  if (paperTitle) {

    paperTitle.textContent =
      paper.title || "";
  }


  if (paperAuthors) {

    paperAuthors.textContent =
      paper.authors || "";
  }


  if (paperAbstract) {

    paperAbstract.textContent =
      paper.summary || "";
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


  if (summaryBox) {

    summaryBox.innerHTML =
      '<p class="summary-placeholder">' +
      'Click “Sum up” for a short, plain-English version of the abstract.' +
      "</p>";
  }


  /*
   * Every time the main paper changes,
   * find new Wikipedia articles.
   */

  loadRelatedWikipedia(paper);
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
        ? idNode.textContent
        : "";


    const arxivId =
      idUrl
        .split("/abs/")
        .pop() ||
      idUrl;


    const titleNode =
      entry.querySelector(
        "title"
      );


    const title =
      titleNode
        ? titleNode.textContent
            .replace(
              /\s+/g,
              " "
            )
            .trim()
        : "";


    const summaryNode =
      entry.querySelector(
        "summary"
      );


    const summary =
      summaryNode
        ? summaryNode.textContent
            .replace(
              /\s+/g,
              " "
            )
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

        return node.textContent
          .trim();

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
// LOAD MAIN PAPER
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
    encodeURIComponent(
      catQuery
    ) +

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
        "HTTP " +
        res.status
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
// LOAD FIVE LATEST PAPERS
// =========================================================

async function loadLatestPapers(
  category
) {

  if (!latestList) {
    return;
  }


  latestList.innerHTML =
    '<div class="latest-loading">' +
    "Loading…" +
    "</div>";


  const catQuery =
    getCategoryQuery(
      category
    );


  const query =
    "search_query=" +
    encodeURIComponent(
      catQuery
    ) +

    "&sortBy=submittedDate" +

    "&sortOrder=descending" +

    "&start=0" +

    "&max_results=5";


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
        "HTTP " +
        res.status
      );
    }


    const text =
      await res.text();


    const papers =
      parseEntries(text);


    if (!papers.length) {

      latestList.innerHTML =
        '<div class="latest-empty">' +
        "No recent papers." +
        "</div>";

      return;
    }


    latestList.innerHTML =
      "";


    papers.forEach(
      function (paper) {

        const button =
          document.createElement(
            "button"
          );


        button.type =
          "button";


        button.className =
          "latest-item";


        button.innerHTML =

          '<span class="latest-title">' +
          escapeHtml(
            paper.title
          ) +
          "</span>" +

          '<span class="latest-date">' +
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


  } catch (error) {

    console.error(
      "Latest papers error:",
      error
    );


    latestList.innerHTML =
      '<div class="latest-error">' +
      "Could not load recent papers." +
      "</div>";
  }
}


// =========================================================
// SEARCH
// =========================================================

async function runSearch(
  start
) {

  if (
    typeof start !==
    "number"
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

    resultsSection.hidden =
      false;
  }


  if (resultsBox) {

    resultsBox.innerHTML =
      '<div class="status" style="padding:1rem">' +
      "Searching…" +
      "</div>";
  }


  if (resultsInfo) {

    resultsInfo.textContent =
      "";
  }


  if (prevBtn) {

    prevBtn.disabled =
      true;
  }


  if (nextBtn) {

    nextBtn.disabled =
      true;
  }


  let searchQuery;


  if (lastIsAll) {

    const cats =
      Array.from(
        categorySelect.options
      )
      .map(function (
        option
      ) {

        return option.value;

      });


    const catPart =
      cats
        .map(function (
          category
        ) {

          return getCategoryQuery(
            category
          );

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
      getCategoryQuery(
        category
      ) +

      ' AND ti:"' +
      keyword +
      '"';
  }


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
        "HTTP " +
        res.status
      );
    }


    const text =
      await res.text();


    const papers =
      parseEntries(text);


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

        (start +
          papers.length);
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
// ABSTRACT SUMMARY
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

    summarizeBtn.disabled =
      true;
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

          /*
           * Keep the Wikipedia panel intact.
           * Only replace the actual summary text.
           */

          const wikiPanel =
            summaryBox.parentElement
              ? summaryBox.parentElement
                .querySelector(
                  ".wiki-panel"
                )
              : null;


          summaryBox.innerHTML =
            '<p class="summary-result">' +
            escapeHtml(
              summary
            ) +
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

          summarizeBtn.disabled =
            false;
        }
      }

    },
    50
  );
}


// =========================================================
// ABSTRACT SIMPLIFIER
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

        return (
          sentence.length >= 35
        );

      }
    );


  if (!sentences.length) {

    return simplifySentence(
      text
    );
  }


  const ranked =
    sentences
      .map(function (
        sentence,
        index
      ) {

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

      })
      .sort(function (
        a,
        b
      ) {

        return (
          b.score -
          a.score
        );

      });


  const selected = [];


  function addBest(
    predicate
  ) {

    const match =
      ranked.find(
        function (item) {

          return (

            !selected.some(
              function (
                chosen
              ) {

                return (
                  chosen.index ===
                  item.index
                );

              }
            ) &&

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


  // Problem.

  addBest(
    function (text) {

      return (

        text.includes(
          "problem"
        ) ||

        text.includes(
          "challenge"
        ) ||

        text.includes(
          "difficult"
        ) ||

        text.includes(
          "difficulty"
        ) ||

        text.includes(
          "limited"
        ) ||

        text.includes(
          "lack"
        ) ||

        text.includes(
          "avoid"
        ) ||

        text.includes(
          "cannot"
        ) ||

        text.includes(
          "hard"
        )

      );
    }
  );


  // Method.

  addBest(
    function (text) {

      return (

        text.includes(
          "we propose"
        ) ||

        text.includes(
          "we present"
        ) ||

        text.includes(
          "we introduce"
        ) ||

        text.includes(
          "we develop"
        ) ||

        text.includes(
          "we use"
        ) ||

        text.includes(
          "we apply"
        ) ||

        text.includes(
          "method"
        ) ||

        text.includes(
          "approach"
        ) ||

        text.includes(
          "model"
        ) ||

        text.includes(
          "system"
        )

      );
    }
  );


  // Results.

  addBest(
    function (text) {

      return (

        text.includes(
          "result"
        ) ||

        text.includes(
          "results"
        ) ||

        text.includes(
          "find"
        ) ||

        text.includes(
          "show"
        ) ||

        text.includes(
          "demonstrate"
        ) ||

        text.includes(
          "improve"
        ) ||

        text.includes(
          "increase"
        ) ||

        text.includes(
          "reduce"
        )

      );
    }
  );


  // Fill remaining slots.

  ranked.forEach(
    function (item) {

      if (
        selected.length >= 4
      ) {

        return;
      }


      const exists =
        selected.some(
          function (
            chosen
          ) {

            return (
              chosen.index ===
              item.index
            );

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

      return (
        a.index -
        b.index
      );

    }
  );


  let simplified =
    selected
      .slice(0, 4)
      .map(function (
        item
      ) {

        return simplifySentence(
          item.sentence
        );

      })
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
    result.split(
      /\s+/
    );


  if (
    words.length > 115
  ) {

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

function splitIntoSentences(
  text
) {

  /*
   * No Compromise.
   *
   * Scientific abstracts frequently contain:
   *
   * "e.g."
   * "i.e."
   * "Fig."
   * "Eq."
   * decimal numbers
   *
   * so protect common abbreviations first.
   */

  let protectedText =
    text
      .replace(
        /\be\.g\./gi,
        "eg§"
      )
      .replace(
        /\bi\.e\./gi,
        "ie§"
      )
      .replace(
        /\bFig\./g,
        "Fig§"
      )
      .replace(
        /\bEq\./g,
        "Eq§"
      )
      .replace(
        /\bDr\./g,
        "Dr§"
      )
      .replace(
        /\bProf\./g,
        "Prof§"
      );


  protectedText =
    protectedText
      .replace(
        /\s+/g,
        " "
      )
      .trim();


  const sentences =
    protectedText
      .split(
        /(?<=[.!?])\s+(?=[A-Z0-9])/g
      )
      .map(
        function (sentence) {

          return sentence

            .replace(
              /eg§/gi,
              "e.g."
            )

            .replace(
              /ie§/gi,
              "i.e."
            )

            .replace(
              /Fig§/g,
              "Fig."
            )

            .replace(
              /Eq§/g,
              "Eq."
            )

            .replace(
              /Dr§/g,
              "Dr."
            )

            .replace(
              /Prof§/g,
              "Prof."
            )

            .trim();

        }
      )
      .filter(Boolean);


  return sentences;
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


  let score = 0;


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
    "potential",

    "we formulate",
    "we study",
    "we investigate",
    "we analyze",
    "we analyse"

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
    /\bwe\s+(show|demonstrate|find|propose)\b/i
      .test(sentence)
  ) {

    score += 3;
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

        return (
          b.length -
          a.length
        );

      }
    );


  terms.forEach(
    function (term) {

      const replacement =
        SCIENTIFIC_DICTIONARY[
          term
        ];


      if (
        typeof replacement !==
        "string"
      ) {

        return;
      }


      const escaped =
        term.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );


      /*
       * Use word boundaries when possible.
       * This prevents "model" from changing
       * part of "modeling".
       */

      const regex =
        new RegExp(
          "(^|\\s)" +
          escaped +
          "(?=\\s|[,.!?;:]|$)",
          "gi"
        );


      result =
        result.replace(
          regex,
          function (
            match,
            prefix
          ) {

            return (
              prefix +
              replacement
            );

          }
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
    function (
      replacement
    ) {

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
    result
      .replace(
        /\s+/g,
        " "
      )
      .trim();


  result =
    simplifyAcademicPhrases(
      result
    );


  /*
   * Dictionary is deliberately applied
   * after academic phrase rewrites.
   */

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
    function (
      replacement
    ) {

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


  if (
    result.length > 0
  ) {

    result =
      result.charAt(0)
        .toUpperCase() +

      result.slice(1);
  }


  return result;
}


// =========================================================
// REMOVE DUPLICATE SENTENCES
// =========================================================

function removeDuplicateSentences(
  sentences
) {

  const result = [];


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


  let common = 0;


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
// WIKIPEDIA SEARCH
// =========================================================

async function wikipediaSearch(
  search,
  limit
) {

  if (!search) {

    return [];
  }


  const params =
    new URLSearchParams({

      action:
        "opensearch",

      search:
        search,

      namespace:
        "0",

      limit:
        String(
          limit || 5
        ),

      format:
        "json",

      origin:
        "*"

    });


  const url =
    WIKIPEDIA_API +
    "?" +
    params.toString();


  const response =
    await fetch(
      url
    );


  if (!response.ok) {

    throw new Error(
      "Wikipedia HTTP " +
      response.status
    );
  }


  const data =
    await response.json();


  const titles =
    Array.isArray(
      data[1]
    )
      ? data[1]
      : [];


  const descriptions =
    Array.isArray(
      data[2]
    )
      ? data[2]
      : [];


  const urls =
    Array.isArray(
      data[3]
    )
      ? data[3]
      : [];


  return titles.map(
    function (
      title,
      index
    ) {

      return {

        title:
          title,

        description:
          descriptions[
            index
          ] || "",

        url:
          urls[
            index
          ] || ""

      };

    }
  );
}


// =========================================================
// MERGE WIKIPEDIA RESULTS
// =========================================================

function mergeWikipediaResults(
  first,
  second
) {

  const result = [];

  const seen =
    new Set();


  first
    .concat(second)
    .forEach(
      function (article) {

        if (
          !article ||
          !article.title
        ) {

          return;
        }


        const key =
          article.title
            .toLowerCase()
            .trim();


        if (
          seen.has(key)
        ) {

          return;
        }


        seen.add(key);

        result.push(
          article
        );

      }
    );


  return result;
}


// =========================================================
// WIKIPEDIA KEYWORD EXTRACTION
// =========================================================

function extractWikipediaKeywords(
  paper
) {

  const combined =
    (
      (paper.title || "") +
      " " +
      (paper.summary || "")
    )
      .replace(
        /[^a-zA-Z0-9\s-]/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();


  const stopWords =
    new Set([

      "about",
      "after",
      "again",
      "also",
      "among",
      "because",
      "been",
      "being",
      "between",
      "could",
      "different",
      "during",
      "each",
      "from",
      "have",
      "into",
      "more",
      "most",
      "other",
      "paper",
      "results",
      "show",
      "shows",
      "such",
      "than",
      "that",
      "their",
      "these",
      "they",
      "this",
      "through",
      "using",
      "which",
      "with",
      "would",
      "study",
      "method",
      "methods",
      "system",
      "systems",
      "approach",
      "proposed",
      "present",
      "introduce",
      "introduced",
      "develop",
      "developed",
      "we",
      "our",
      "the",
      "and",
      "for",
      "are",
      "was",
      "were",
      "its",
      "has",
      "can",
      "may",
      "not",
      "from",
      "under",
      "within"

    ]);


  const words =
    combined
      .toLowerCase()
      .split(/\s+/)
      .filter(
        function (word) {

          return (

            word.length >= 6 &&

            !stopWords.has(
              word
            )

          );

        }
      );


  const frequency =
    new Map();


  words.forEach(
    function (word) {

      frequency.set(
        word,
        (frequency.get(word) || 0) +
        1
      );

    }
  );


  return Array.from(
    frequency.entries()
  )
  .sort(
    function (a, b) {

      return b[1] - a[1];

    }
  )
  .slice(0, 10)
  .map(
    function (entry) {

      return entry[0];

    }
  );
}


// =========================================================
// RELATED WIKIPEDIA ARTICLES
// =========================================================

async function loadRelatedWikipedia(
  paper
) {

  if (!wikiList) {

    return;
  }


  wikiList.innerHTML =
    '<div class="wiki-loading">' +
    "Finding related articles…" +
    "</div>";


  if (
    !paper ||
    !paper.title
  ) {

    wikiList.innerHTML =
      '<div class="wiki-empty">' +
      "No paper information available." +
      "</div>";

    return;
  }


  try {

    /*
     * First search the complete title.
     * This is usually the strongest query.
     */

    let results =
      await wikipediaSearch(
        paper.title,
        5
      );


    /*
     * Then search important terms from
     * the title + abstract.
     */

    const keywords =
      extractWikipediaKeywords(
        paper
      );


    /*
     * Search several of the strongest terms.
     * This gives much better results than
     * simply searching the whole abstract.
     */

    for (
      let i = 0;
      i < Math.min(
        keywords.length,
        4
      );
      i++
    ) {

      if (
        results.length >= 8
      ) {

        break;
      }


      const extra =
        await wikipediaSearch(
          keywords[i],
          3
        );


      results =
        mergeWikipediaResults(
          results,
          extra
        );
    }


    /*
     * If title search found nothing useful,
     * search a compact keyword combination.
     */

    if (
      results.length < 5 &&
      keywords.length >= 2
    ) {

      const keywordQuery =
        keywords
          .slice(0, 4)
          .join(" ");


      const extra =
        await wikipediaSearch(
          keywordQuery,
          10
        );


      results =
        mergeWikipediaResults(
          results,
          extra
        );
    }


    results =
      results.slice(
        0,
        5
      );


    if (!results.length) {

      wikiList.innerHTML =
        '<div class="wiki-empty">' +
        "No related Wikipedia articles found." +
        "</div>";

      return;
    }


    renderWikipediaResults(
      results
    );


  } catch (error) {

    console.error(
      "Wikipedia search error:",
      error
    );


    wikiList.innerHTML =
      '<div class="wiki-error">' +
      "Could not load related articles." +
      "</div>";
  }
}


// =========================================================
// RENDER WIKIPEDIA
// =========================================================

function renderWikipediaResults(
  articles
) {

  if (!wikiList) {

    return;
  }


  wikiList.innerHTML =
    "";


  articles
    .slice(0, 5)
    .forEach(
      function (article) {

        const link =
          document.createElement(
            "a"
          );


        link.className =
          "wiki-item";


        link.href =
          article.url;


        link.target =
          "_blank";


        link.rel =
          "noopener noreferrer";


        const title =
          document.createElement(
            "span"
          );


        title.className =
          "wiki-title";


        title.textContent =
          article.title;


        link.appendChild(
          title
        );


        if (
          article.description
        ) {

          const description =
            document.createElement(
              "span"
            );


          description.className =
            "wiki-description";


          description.textContent =
            article.description;


          link.appendChild(
            description
          );
        }


        wikiList.appendChild(
          link
        );

      }
    );
}


// =========================================================
// EVENTS
// =========================================================

if (categorySelect) {

  categorySelect.addEventListener(
    "change",
    function () {

      const category =
        categorySelect.value;


      loadPaper(
        category,
        false
      );


      loadLatestPapers(
        category
      );

    }
  );
}


if (searchBtn) {

  searchBtn.addEventListener(
    "click",
    function () {

      lastIsAll =
        false;


      runSearch(
        0
      );

    }
  );
}


if (searchAllBtn) {

  searchAllBtn.addEventListener(
    "click",
    function () {

      lastIsAll =
        true;


      runSearch(
        0
      );

    }
  );
}


if (keywordInput) {

  keywordInput.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key ===
        "Enter"
      ) {

        lastIsAll =
          false;


        runSearch(
          0
        );
      }

    }
  );
}


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


if (randomPaperBtn) {

  randomPaperBtn.addEventListener(
    "click",
    function () {

      if (!categorySelect) {

        return;
      }


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

  const category =
    categorySelect.value;


  /*
   * Main paper.
   */

  loadPaper(
    category,
    false
  );


  /*
   * Five newest papers for the
   * selected category.
   */

  loadLatestPapers(
    category
  );
}
