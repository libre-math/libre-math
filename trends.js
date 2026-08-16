// =========================================================
// arXiv Subject Trends
//
// Fetches the last 50 papers (all of arXiv or one main archive)
// and builds a frequency table of the subjects/categories
// that appear on those papers.
// =========================================================

const API   = "https://export.arxiv.org/api/query";
const PROXY = "https://corsproxy.io/?";
const PAPER_LIMIT = 50;

// Full official names (subset of the most common ones).
// Unknown codes simply show the short code.
const CATEGORY_NAMES = {
  "cs.AI":  "Artificial Intelligence",
  "cs.AR":  "Hardware Architecture",
  "cs.CC":  "Computational Complexity",
  "cs.CE":  "Computational Engineering, Finance, and Science",
  "cs.CG":  "Computational Geometry",
  "cs.CL":  "Computation and Language",
  "cs.CR":  "Cryptography and Security",
  "cs.CV":  "Computer Vision and Pattern Recognition",
  "cs.CY":  "Computers and Society",
  "cs.DB":  "Databases",
  "cs.DC":  "Distributed, Parallel, and Cluster Computing",
  "cs.DL":  "Digital Libraries",
  "cs.DM":  "Discrete Mathematics",
  "cs.DS":  "Data Structures and Algorithms",
  "cs.ET":  "Emerging Technologies",
  "cs.FL":  "Formal Languages and Automata Theory",
  "cs.GL":  "General Literature",
  "cs.GR":  "Graphics",
  "cs.GT":  "Computer Science and Game Theory",
  "cs.HC":  "Human-Computer Interaction",
  "cs.IR":  "Information Retrieval",
  "cs.IT":  "Information Theory",
  "cs.LG":  "Machine Learning",
  "cs.LO":  "Logic in Computer Science",
  "cs.MA":  "Multiagent Systems",
  "cs.MM":  "Multimedia",
  "cs.MS":  "Mathematical Software",
  "cs.NA":  "Numerical Analysis",
  "cs.NE":  "Neural and Evolutionary Computing",
  "cs.NI":  "Networking and Internet Architecture",
  "cs.OH":  "Other Computer Science",
  "cs.OS":  "Operating Systems",
  "cs.PF":  "Performance",
  "cs.PL":  "Programming Languages",
  "cs.RO":  "Robotics",
  "cs.SC":  "Symbolic Computation",
  "cs.SD":  "Sound",
  "cs.SE":  "Software Engineering",
  "cs.SI":  "Social and Information Networks",
  "cs.SY":  "Systems and Control",
  "math.AG": "Algebraic Geometry",
  "math.AT": "Algebraic Topology",
  "math.AP": "Analysis of PDEs",
  "math.CT": "Category Theory",
  "math.CA": "Classical Analysis and ODEs",
  "math.CO": "Combinatorics",
  "math.AC": "Commutative Algebra",
  "math.CV": "Complex Variables",
  "math.DG": "Differential Geometry",
  "math.DS": "Dynamical Systems",
  "math.FA": "Functional Analysis",
  "math.GM": "General Mathematics",
  "math.GN": "General Topology",
  "math.GT": "Geometric Topology",
  "math.GR": "Group Theory",
  "math.HO": "History and Overview",
  "math.IT": "Information Theory",
  "math.KT": "K-Theory and Homology",
  "math.LO": "Logic",
  "math.MP": "Mathematical Physics",
  "math.MG": "Metric Geometry",
  "math.NT": "Number Theory",
  "math.NA": "Numerical Analysis",
  "math.OA": "Operator Algebras",
  "math.OC": "Optimization and Control",
  "math.PR": "Probability",
  "math.QA": "Quantum Algebra",
  "math.RT": "Representation Theory",
  "math.RA": "Rings and Algebras",
  "math.SP": "Spectral Theory",
  "math.ST": "Statistics Theory",
  "math.SG": "Symplectic Geometry",
  "stat.AP": "Applications",
  "stat.CO": "Computation",
  "stat.ML": "Machine Learning",
  "stat.ME": "Methodology",
  "stat.OT": "Other Statistics",
  "stat.TH": "Statistics Theory",
  "eess.AS": "Audio and Speech Processing",
  "eess.IV": "Image and Video Processing",
  "eess.SP": "Signal Processing",
  "eess.SY": "Systems and Control",
  "q-bio.BM": "Biomolecules",
  "q-bio.CB": "Cell Behavior",
  "q-bio.GN": "Genomics",
  "q-bio.MN": "Molecular Networks",
  "q-bio.NC": "Neurons and Cognition",
  "q-bio.OT": "Other Quantitative Biology",
  "q-bio.PE": "Populations and Evolution",
  "q-bio.QM": "Quantitative Methods",
  "q-bio.SC": "Subcellular Processes",
  "q-bio.TO": "Tissues and Organs",
  "q-fin.CP": "Computational Finance",
  "q-fin.EC": "Economics",
  "q-fin.GN": "General Finance",
  "q-fin.MF": "Mathematical Finance",
  "q-fin.PM": "Portfolio Management",
  "q-fin.PR": "Pricing of Securities",
  "q-fin.RM": "Risk Management",
  "q-fin.ST": "Statistical Finance",
  "q-fin.TR": "Trading and Market Microstructure",
  "econ.EM": "Econometrics",
  "econ.GN": "General Economics",
  "econ.TH": "Theoretical Economics",
  "astro-ph.CO": "Cosmology and Nongalactic Astrophysics",
  "astro-ph.EP": "Earth and Planetary Astrophysics",
  "astro-ph.GA": "Astrophysics of Galaxies",
  "astro-ph.HE": "High Energy Astrophysical Phenomena",
  "astro-ph.IM": "Instrumentation and Methods for Astrophysics",
  "astro-ph.SR": "Solar and Stellar Astrophysics",
  "cond-mat.dis-nn": "Disordered Systems and Neural Networks",
  "cond-mat.mes-hall": "Mesoscale and Nanoscale Physics",
  "cond-mat.mtrl-sci": "Materials Science",
  "cond-mat.other": "Other Condensed Matter",
  "cond-mat.quant-gas": "Quantum Gases",
  "cond-mat.soft": "Soft Condensed Matter",
  "cond-mat.stat-mech": "Statistical Mechanics",
  "cond-mat.str-el": "Strongly Correlated Electrons",
  "cond-mat.supr-con": "Superconductivity",
  "gr-qc": "General Relativity and Quantum Cosmology",
  "hep-ex": "High Energy Physics - Experiment",
  "hep-lat": "High Energy Physics - Lattice",
  "hep-ph": "High Energy Physics - Phenomenology",
  "hep-th": "High Energy Physics - Theory",
  "math-ph": "Mathematical Physics",
  "nlin.AO": "Adaptation and Self-Organizing Systems",
  "nlin.CG": "Cellular Automata and Lattice Gases",
  "nlin.CD": "Chaotic Dynamics",
  "nlin.SI": "Exactly Solvable and Integrable Systems",
  "nlin.PS": "Pattern Formation and Solitons",
  "nucl-ex": "Nuclear Experiment",
  "nucl-th": "Nuclear Theory",
  "physics.acc-ph": "Accelerator Physics",
  "physics.ao-ph": "Atmospheric and Oceanic Physics",
  "physics.app-ph": "Applied Physics",
  "physics.atm-clus": "Atomic and Molecular Clusters",
  "physics.atom-ph": "Atomic Physics",
  "physics.bio-ph": "Biological Physics",
  "physics.chem-ph": "Chemical Physics",
  "physics.class-ph": "Classical Physics",
  "physics.comp-ph": "Computational Physics",
  "physics.data-an": "Data Analysis, Statistics and Probability",
  "physics.flu-dyn": "Fluid Dynamics",
  "physics.gen-ph": "General Physics",
  "physics.geo-ph": "Geophysics",
  "physics.hist-ph": "History and Philosophy of Physics",
  "physics.ins-det": "Instrumentation and Detectors",
  "physics.med-ph": "Medical Physics",
  "physics.optics": "Optics",
  "physics.ed-ph": "Physics Education",
  "physics.soc-ph": "Physics and Society",
  "physics.plasm-ph": "Plasma Physics",
  "physics.pop-ph": "Popular Physics",
  "physics.space-ph": "Space Physics",
  "quant-ph": "Quantum Physics"
};

// =========================================================
// DOM
// =========================================================
const scopeSelect = document.getElementById("scope-select");
const refreshBtn  = document.getElementById("refresh-btn");
const statusEl    = document.getElementById("trends-status");
const contentEl   = document.getElementById("trends-content");
const tbodyEl     = document.getElementById("trends-tbody");
const scopeLabel  = document.getElementById("scope-label");

// =========================================================
// STATE
// =========================================================
let currentScope = "all";
const cache = {};           // scope → { counts, paperCount }

// =========================================================
// QUERY BUILDERS
// =========================================================
function buildSearchQuery(scope) {
  if (scope === "all") {
    return 'all:""';          // matches everything
  }
  // Main archives need a wildcard so we catch all sub-categories
  return "cat:" + scope + "*";
}

// =========================================================
// FETCH LAST 50 PAPERS
// =========================================================
async function fetchRecentPapers(scope) {
  const searchQuery = buildSearchQuery(scope);
  const query =
    "search_query=" + encodeURIComponent(searchQuery) +
    "&start=0" +
    "&max_results=" + PAPER_LIMIT +
    "&sortBy=submittedDate" +
    "&sortOrder=descending";

  const url = PROXY + encodeURIComponent(API + "?" + query);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("arXiv HTTP " + response.status);
  }

  const text = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "application/xml");

  if (doc.querySelector("parsererror")) {
    throw new Error("Could not parse arXiv XML.");
  }

  const entries = Array.from(doc.getElementsByTagName("entry"));
  return entries;
}

// =========================================================
// COUNT CATEGORIES
// =========================================================
function countCategories(entries) {
  const counts = Object.create(null);

  entries.forEach(function (entry) {
    // All <category> elements (primary + secondary)
    const cats = entry.getElementsByTagName("category");
    for (let i = 0; i < cats.length; i++) {
      const term = cats[i].getAttribute("term");
      if (!term) continue;
      // Skip non-arXiv schemes if any appear
      const scheme = cats[i].getAttribute("scheme") || "";
      if (scheme && scheme.indexOf("arxiv.org") === -1) continue;

      counts[term] = (counts[term] || 0) + 1;
    }
  });

  return counts;
}

// =========================================================
// LOAD + RENDER
// =========================================================
async function loadTrends(scope, forceRefresh) {
  currentScope = scope;

  // Update label
  if (scopeLabel) {
    const opt = scopeSelect.querySelector('option[value="' + scope + '"]');
    scopeLabel.textContent = scope === "all"
      ? "(all of arXiv)"
      : "(" + (opt ? opt.textContent : scope) + ")";
  }

  if (cache[scope] && !forceRefresh) {
    renderTable(cache[scope]);
    return;
  }

  contentEl.hidden = true;
  statusEl.hidden = false;
  statusEl.textContent = "Loading last " + PAPER_LIMIT + " papers…";

  try {
    const entries = await fetchRecentPapers(scope);
    const counts  = countCategories(entries);

    const payload = {
      counts: counts,
      paperCount: entries.length
    };

    cache[scope] = payload;
    renderTable(payload);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to load data: " + err.message;
  }
}

function renderTable(payload) {
  const { counts, paperCount } = payload;

  if (!paperCount) {
    statusEl.hidden = false;
    statusEl.textContent = "No papers returned.";
    contentEl.hidden = true;
    return;
  }

  // Sort by frequency descending and keep only the top 10
  const rows = Object.keys(counts)
    .map(function (code) {
      return {
        code: code,
        name: CATEGORY_NAMES[code] || code,
        count: counts[code]
      };
    })
    .sort(function (a, b) {
      return b.count - a.count || a.code.localeCompare(b.code);
    })
    .slice(0, 10);   // ← only the first 10

  tbodyEl.innerHTML = "";

  rows.forEach(function (row, idx) {
    const pct = ((row.count / paperCount) * 100).toFixed(1);
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td class='rank'>" + (idx + 1) + "</td>" +
      "<td class='subject'>" + escapeHtml(row.name) + "</td>" +
      "<td class='code mono'>" + escapeHtml(row.code) + "</td>" +
      "<td class='count mono'>" + row.count + "</td>" +
      "<td class='pct mono'>" + pct + "%</td>";
    tbodyEl.appendChild(tr);
  });

  statusEl.hidden = true;
  contentEl.hidden = false;
}

  // Sort by frequency descending
  const rows = Object.keys(counts)
    .map(function (code) {
      return {
        code: code,
        name: CATEGORY_NAMES[code] || code,
        count: counts[code]
      };
    })
    .sort(function (a, b) {
      return b.count - a.count || a.code.localeCompare(b.code);
    });

  tbodyEl.innerHTML = "";

  rows.forEach(function (row, idx) {
    const pct = ((row.count / paperCount) * 100).toFixed(1);
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td class='mono'>" + (idx + 1) + "</td>" +
      "<td>" + escapeHtml(row.name) + "</td>" +
      "<td class='mono'>" + escapeHtml(row.code) + "</td>" +
      "<td class='mono'>" + row.count + "</td>" +
      "<td class='mono'>" + pct + "%</td>";
    tbodyEl.appendChild(tr);
  });

  statusEl.hidden = true;
  contentEl.hidden = false;
}

// =========================================================
// UTIL
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
if (scopeSelect) {
  scopeSelect.addEventListener("change", function () {
    loadTrends(scopeSelect.value, false);
  });
}

if (refreshBtn) {
  refreshBtn.addEventListener("click", function () {
    loadTrends(currentScope, true);
  });
}

// =========================================================
// START
// =========================================================
loadTrends("all", false);
