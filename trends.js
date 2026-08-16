// =========================================================
// arXiv Category Trends
//
// Fetches how many papers were submitted per category over
// the last N days, using arXiv's own reported result count
// (opensearch:totalResults) rather than downloading every
// paper — one lightweight request per category.
//
// Renders a hand-rolled SVG pie chart (no chart library
// needed) plus a legend.
// =========================================================


const API =
  "https://export.arxiv.org/api/query";

const PROXY =
  "https://corsproxy.io/?";

const WINDOW_DAYS = 14;

const MAX_SLICES = 8;

const CONCURRENCY = 5;


// =========================================================
// CATEGORY LISTS
//
// Keep these in sync with the <option> values in index.html's
// #category-select if categories are ever added or removed
// there.
//
// MAIN_CATEGORIES are the 8 top-level arXiv archives. They
// never overlap with each other, so a "Main Categories" pie
// is a clean partition (modulo cross-listing between them,
// which is rare across such broad archives).
//
// ALL_CATEGORIES also includes narrower, already-nested
// subcategories (e.g. cs.LG sits inside cs) — useful for
// seeing which specific subfields are active, but slices can
// overlap, which is why that mode is captioned on the page.
// =========================================================

const MAIN_CATEGORIES = [

  { value: "physics", label: "Physics" },
  { value: "math", label: "Mathematics" },
  { value: "cs", label: "Computer Science" },
  { value: "q-bio", label: "Quantitative Biology" },
  { value: "q-fin", label: "Quantitative Finance" },
  { value: "stat", label: "Statistics" },
  { value: "eess", label: "Electrical Engineering" },
  { value: "econ", label: "Economics" }

];


const ALL_CATEGORIES =
  MAIN_CATEGORIES.concat([

    { value: "astro-ph", label: "Astrophysics" },
    { value: "cond-mat", label: "Condensed Matter" },
    { value: "gr-qc", label: "General Relativity" },
    { value: "hep-ph", label: "High Energy Physics - Phenomenology" },
    { value: "hep-th", label: "High Energy Physics - Theory" },
    { value: "hep-ex", label: "High Energy Physics - Experiment" },
    { value: "quant-ph", label: "Quantum Physics" },
    { value: "nlin", label: "Nonlinear Sciences" },
    { value: "nucl-th", label: "Nuclear Theory" },
    { value: "nucl-ex", label: "Nuclear Experiment" },
    { value: "math.NA", label: "Numerical Analysis" },
    { value: "cs.LG", label: "Machine Learning" },
    { value: "cs.AI", label: "Artificial Intelligence" },
    { value: "eess.SP", label: "Signal Processing" }

  ]);


// Muted, editorial palette to match the archival-report theme.

const PALETTE = [

  "#8b1a1a",
  "#3a5a40",
  "#4a6fa5",
  "#b08a3e",
  "#7c5295",
  "#2a7f7f",
  "#a3502b",
  "#5c5548",
  "#6b6b6b"

];


// =========================================================
// DOM
// =========================================================

const modeAllBtn =
  document.getElementById("mode-all-btn");

const modeMainBtn =
  document.getElementById("mode-main-btn");

const refreshBtn =
  document.getElementById("refresh-btn");

const statusEl =
  document.getElementById("trends-status");

const contentEl =
  document.getElementById("trends-content");

const chartEl =
  document.getElementById("trends-chart");

const legendEl =
  document.getElementById("trends-legend");

const windowLabelEl =
  document.getElementById("trends-window-label");


// =========================================================
// STATE
//
// Results are cached per mode after the first successful
// load, so switching the toggle doesn't re-fetch unless the
// user clicks Refresh.
// =========================================================

let currentMode = "all";

const cache = {
  all: null,
  main: null
};


// =========================================================
// CATEGORY QUERY (same rule as the main explorer: bare
// archive names need a wildcard, fully-qualified subcategory
// codes don't).
// =========================================================

function getCategoryQuery(category) {

  if (category.indexOf(".") === -1) {

    return "cat:" + category + "*";
  }


  return "cat:" + category;
}


// =========================================================
// DATE RANGE
// =========================================================

function pad(n) {

  return String(n).padStart(2, "0");
}


function formatArxivDate(date) {

  return (

    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes())

  );
}


function getDateRange(days) {

  const end =
    new Date();

  const start =
    new Date(
      end.getTime() -
      days * 24 * 60 * 60 * 1000
    );


  return {

    startStr: formatArxivDate(start),

    endStr: formatArxivDate(end)

  };
}


// =========================================================
// FETCH ONE CATEGORY'S TOTAL COUNT
// =========================================================

async function fetchCategoryCount(category, dateRange) {

  const searchQuery =
    "(" +
    getCategoryQuery(category) +
    ") AND submittedDate:[" +
    dateRange.startStr +
    " TO " +
    dateRange.endStr +
    "]";


  const query =
    "search_query=" +
    encodeURIComponent(searchQuery) +
    "&start=0" +
    "&max_results=1";


  const url =
    PROXY +
    encodeURIComponent(
      API + "?" + query
    );


  const response =
    await fetch(url);


  if (!response.ok) {

    throw new Error(
      "arXiv HTTP " + response.status
    );
  }


  const text =
    await response.text();


  const parser =
    new DOMParser();

  const doc =
    parser.parseFromString(
      text,
      "application/xml"
    );


  if (doc.querySelector("parsererror")) {

    throw new Error(
      "Could not parse arXiv XML."
    );
  }


  const totalNode =
    doc.getElementsByTagName(
      "opensearch:totalResults"
    )[0];


  const total =
    totalNode
      ? parseInt(totalNode.textContent, 10)
      : NaN;


  if (isNaN(total)) {

    throw new Error(
      "No totalResults found for " + category
    );
  }


  return total;
}


// =========================================================
// LIMITED-CONCURRENCY MAP
//
// 21 categories, each needing its own request, run through a
// free CORS proxy — running all of them at once risks getting
// throttled. This processes a few at a time instead, and
// reports progress as it goes.
// =========================================================

async function mapWithConcurrency(items, limit, worker, onProgress) {

  const results =
    new Array(items.length);

  let nextIndex =
    0;

  let completed =
    0;


  async function runNext() {

    const index =
      nextIndex++;


    if (index >= items.length) {
      return;
    }


    try {

      results[index] =
        { ok: true, value: await worker(items[index], index) };

    } catch (error) {

      results[index] =
        { ok: false, error: error };
    }


    completed++;


    if (onProgress) {

      onProgress(
        completed,
        items.length
      );
    }


    await runNext();
  }


  const runners =
    [];

  for (
    let i = 0;
    i < Math.min(limit, items.length);
    i++
  ) {

    runners.push(
      runNext()
    );
  }


  await Promise.all(
    runners
  );


  return results;
}


// =========================================================
// LOAD DATA FOR A MODE
// =========================================================

async function loadTrends(mode, forceRefresh) {

  currentMode =
    mode;


  updateToggleUI(
    mode
  );


  if (
    cache[mode] &&
    !forceRefresh
  ) {

    renderTrends(
      cache[mode]
    );

    return;
  }


  const categories =
    mode === "main"
      ? MAIN_CATEGORIES
      : ALL_CATEGORIES;


  const dateRange =
    getDateRange(WINDOW_DAYS);


  if (windowLabelEl) {

    windowLabelEl.textContent =
      "last " + WINDOW_DAYS + " days";
  }


  contentEl.hidden =
    true;

  statusEl.hidden =
    false;

  statusEl.textContent =
    "Loading category data… (0 / " +
    categories.length +
    ")";


  const results =
    await mapWithConcurrency(
      categories,
      CONCURRENCY,

      function (category) {

        return fetchCategoryCount(
          category.value,
          dateRange
        );

      },

      function (completed, total) {

        statusEl.textContent =
          "Loading category data… (" +
          completed +
          " / " +
          total +
          ")";

      }
    );


  const data =
    [];

  let failedCount =
    0;


  results.forEach(
    function (result, index) {

      if (result.ok) {

        data.push({

          label: categories[index].label,

          value: result.value

        });

      } else {

        failedCount++;

        console.warn(
          "Failed to load count for " +
          categories[index].value +
          ":",
          result.error
        );

      }

    }
  );


  if (!data.length) {

    statusEl.textContent =
      "Could not load category data. See console for details.";

    return;
  }


  const payload =
    {

      data: data,

      failedCount: failedCount,

      totalCategories: categories.length

    };


  cache[mode] =
    payload;


  renderTrends(
    payload
  );
}


// =========================================================
// UPDATE TOGGLE BUTTON STYLING
// =========================================================

function updateToggleUI(mode) {

  if (modeAllBtn) {

    modeAllBtn.classList.toggle(
      "active",
      mode === "all"
    );

    modeAllBtn.classList.toggle(
      "btn-outline",
      mode !== "all"
    );
  }


  if (modeMainBtn) {

    modeMainBtn.classList.toggle(
      "active",
      mode === "main"
    );

    modeMainBtn.classList.toggle(
      "btn-outline",
      mode !== "main"
    );
  }
}


// =========================================================
// RENDER
// =========================================================

function renderTrends(payload) {

  const sorted =
    payload.data

      .slice()

      .sort(
        function (a, b) {

          return b.value - a.value;

        }
      );


  let sliceData =
    sorted.slice(0, MAX_SLICES);


  const rest =
    sorted.slice(MAX_SLICES);


  if (rest.length) {

    const otherTotal =
      rest.reduce(
        function (sum, item) {

          return sum + item.value;

        },
        0
      );


    if (otherTotal > 0) {

      sliceData =
        sliceData.concat([{

          label: "Other",

          value: otherTotal

        }]);
    }
  }


  const grandTotal =
    sliceData.reduce(
      function (sum, item) {

        return sum + item.value;

      },
      0
    );


  if (!grandTotal) {

    statusEl.hidden =
      false;

    statusEl.textContent =
      "No papers found in this window.";

    contentEl.hidden =
      true;

    return;
  }


  statusEl.hidden =
    true;

  contentEl.hidden =
    false;


  chartEl.innerHTML =
    buildPieSvg(
      sliceData,
      grandTotal
    );


  legendEl.innerHTML =
    "";


  sliceData.forEach(
    function (item, index) {

      const color =
        PALETTE[index % PALETTE.length];


      const pct =
        (item.value / grandTotal * 100)
          .toFixed(1);


      const li =
        document.createElement("li");

      li.className =
        "trends-legend-item";


      li.innerHTML =

        '<span class="trends-legend-swatch" style="background:' +
        color +
        '"></span>' +

        '<span class="trends-legend-label">' +
        escapeHtml(item.label) +
        "</span>" +

        '<span class="trends-legend-value mono">' +
        item.value.toLocaleString() +
        " (" + pct + "%)" +
        "</span>";


      legendEl.appendChild(li);

    }
  );


  if (payload.failedCount) {

    const warningLi =
      document.createElement("li");

    warningLi.className =
      "trends-legend-item trends-legend-warning";

    warningLi.textContent =
      payload.failedCount +
      " of " +
      payload.totalCategories +
      " categories could not be loaded and are omitted above.";

    legendEl.appendChild(warningLi);
  }
}


// =========================================================
// SVG PIE CHART
// =========================================================

function polarToCartesian(cx, cy, r, angleDeg) {

  const rad =
    (angleDeg - 90) * Math.PI / 180;


  return {

    x: cx + r * Math.cos(rad),

    y: cy + r * Math.sin(rad)

  };
}


function describeArc(cx, cy, r, startAngle, endAngle) {

  const start =
    polarToCartesian(cx, cy, r, endAngle);

  const end =
    polarToCartesian(cx, cy, r, startAngle);

  const largeArcFlag =
    endAngle - startAngle <= 180 ? "0" : "1";


  return [

    "M", cx, cy,
    "L", start.x.toFixed(2), start.y.toFixed(2),
    "A", r, r, 0, largeArcFlag, 0, end.x.toFixed(2), end.y.toFixed(2),
    "Z"

  ].join(" ");
}


function buildPieSvg(sliceData, grandTotal) {

  const size =
    260;

  const cx =
    size / 2;

  const cy =
    size / 2;

  const r =
    size / 2 - 6;


  let angle =
    0;

  let paths =
    "";


  sliceData.forEach(
    function (item, index) {

      const sweep =
        (item.value / grandTotal) * 360;


      // A full-circle single slice needs a special case —
      // an arc command can't sweep a full 360°.

      if (sweep >= 359.999) {

        paths +=
          '<circle cx="' + cx + '" cy="' + cy +
          '" r="' + r + '" fill="' +
          PALETTE[index % PALETTE.length] + '"></circle>';

        angle +=
          sweep;

        return;
      }


      const color =
        PALETTE[index % PALETTE.length];


      const d =
        describeArc(cx, cy, r, angle, angle + sweep);


      paths +=
        '<path d="' + d + '" fill="' + color +
        '" stroke="var(--bg-paper)" stroke-width="1.5">' +
        "<title>" +
        escapeHtml(item.label) +
        ": " +
        item.value.toLocaleString() +
        "</title>" +
        "</path>";


      angle +=
        sweep;

    }
  );


  return (

    '<svg viewBox="0 0 ' + size + " " + size +
    '" role="img" aria-label="Pie chart of paper counts by category">' +

    paths +

    "</svg>"

  );
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
// EVENTS
// =========================================================

if (modeAllBtn) {

  modeAllBtn.addEventListener(
    "click",
    function () {

      loadTrends("all", false);

    }
  );
}


if (modeMainBtn) {

  modeMainBtn.addEventListener(
    "click",
    function () {

      loadTrends("main", false);

    }
  );
}


if (refreshBtn) {

  refreshBtn.addEventListener(
    "click",
    function () {

      loadTrends(currentMode, true);

    }
  );
}


// =========================================================
// START
// =========================================================

loadTrends("all", false);
