// Dark-mode toggle. Preference is remembered in localStorage,
// with a safe fallback if storage is unavailable (private browsing, etc.).

const toggleButton = document.getElementById("theme-toggle");
const body = document.body;

function getStoredTheme() {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
}

function storeTheme(value) {
  try {
    localStorage.setItem("theme", value);
  } catch {
    // Storage unavailable — theme just won't persist across visits.
  }
}

function applyTheme(isDark) {
  body.classList.toggle("dark", isDark);
  toggleButton.setAttribute("aria-pressed", String(isDark));
  toggleButton.textContent = isDark ? "☀️" : "🌙";
}

// Load saved preference, defaulting to the system preference on first visit.
const savedTheme = getStoredTheme();
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(savedTheme ? savedTheme === "dark" : prefersDark);

toggleButton.addEventListener("click", () => {
  const isDark = !body.classList.contains("dark");
  applyTheme(isDark);
  storeTheme(isDark ? "dark" : "light");
});
