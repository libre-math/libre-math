// Space Gallery — pulls real mission photos from NASA's public
// Image and Video Library API (images-api.nasa.gov). No API key
// required for this endpoint.
//
// The API's `q` parameter is a free-text search against titles,
// descriptions and keyword tags — not a strict "mission" field —
// so after fetching we double-check each result's own `keywords`
// array for the mission name before showing it, to keep the set
// on-topic.

const MISSIONS = {
  juno: { label: "Juno (Jupiter)", query: "juno jupiter junocam", match: ["juno"] },
  cassini: { label: "Cassini (Saturn)", query: "cassini saturn", match: ["cassini"] },
  voyager: { label: "Voyager 1 & 2", query: "voyager", match: ["voyager"] },
  perseverance: { label: "Perseverance (Mars)", query: "perseverance mars rover", match: ["perseverance"] },
  curiosity: { label: "Curiosity (Mars)", query: "curiosity mars rover", match: ["curiosity"] },
  hubble: { label: "Hubble Space Telescope", query: "hubble space telescope", match: ["hubble"] },
  webb: { label: "James Webb Space Telescope", query: "james webb space telescope", match: ["webb", "jwst"] },
  apollo: { label: "Apollo missions", query: "apollo moon landing", match: ["apollo"] },
};

const frameEl = document.getElementById("gallery-frame");
const imgEl = document.getElementById("gallery-image");
const statusEl = document.getElementById("gallery-status");
const titleEl = document.getElementById("gallery-title");
const dateEl = document.getElementById("gallery-date");
const descEl = document.getElementById("gallery-description");
const nextBtn = document.getElementById("gallery-next");
const missionSelect = document.getElementById("gallery-mission");

let pool = [];
let shown = [];
let currentMission = "juno";

function setStatus(message) {
  statusEl.textContent = message;
  statusEl.hidden = !message;
}

function looksRelevant(item, mission) {
  const data = item.data && item.data[0];
  if (!data) return false;
  const haystack = [
    data.title || "",
    data.description || "",
    ...(data.keywords || []),
  ].join(" ").toLowerCase();
  return MISSIONS[mission].match.some((term) => haystack.includes(term));
}

async function fetchPool(mission) {
  setStatus("Loading images…");
  imgEl.style.opacity = 0;
  const query = encodeURIComponent(MISSIONS[mission].query);
  const url = `https://images-api.nasa.gov/search?q=${query}&media_type=image&page_size=100`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NASA API responded with ${response.status}`);
  }
  const json = await response.json();
  const items = (json.collection && json.collection.items) || [];
  const filtered = items.filter((item) => looksRelevant(item, mission));

  // Fall back to the unfiltered set if keyword-matching left too little to browse.
  return filtered.length >= 5 ? filtered : items;
}

function pickNext() {
  if (pool.length === 0) return null;
  if (shown.length >= pool.length) shown = [];
  const remaining = pool.filter((_, i) => !shown.includes(i));
  const pickIndex = pool.indexOf(remaining[Math.floor(Math.random() * remaining.length)]);
  shown.push(pickIndex);
  return pool[pickIndex];
}

function renderItem(item) {
  const data = item.data[0];
  const links = item.links || [];
  const preview = (links.find((l) => l.rel === "preview") || links[0] || {}).href;

  if (!preview) {
    showNext();
    return;
  }

  imgEl.onload = () => {
    imgEl.style.opacity = 1;
    setStatus("");
  };
  imgEl.onerror = () => showNext();
  imgEl.src = preview;
  imgEl.alt = data.title || "NASA mission photo";

  titleEl.textContent = data.title || "Untitled";
  dateEl.textContent = data.date_created ? new Date(data.date_created).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  }) : "";
  descEl.textContent = data.description || "No description provided.";
}

function showNext() {
  const item = pickNext();
  if (!item) {
    setStatus("No images found for this mission right now.");
    return;
  }
  renderItem(item);
}

async function loadMission(mission) {
  currentMission = mission;
  shown = [];
  nextBtn.disabled = true;
  try {
    pool = await fetchPool(mission);
    nextBtn.disabled = false;
    showNext();
  } catch (err) {
    console.error(err);
    setStatus("Couldn't reach NASA's image library. Try again in a moment.");
  }
}

nextBtn.addEventListener("click", showNext);
missionSelect.addEventListener("change", (e) => loadMission(e.target.value));

// Populate mission dropdown
for (const [key, mission] of Object.entries(MISSIONS)) {
  const option = document.createElement("option");
  option.value = key;
  option.textContent = mission.label;
  if (key === currentMission) option.selected = true;
  missionSelect.appendChild(option);
}

loadMission(currentMission);
