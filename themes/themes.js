/* themes/themes.js
   Central theme registry + switching logic shared by index.html (call board)
   and control.html (console). Selecting a theme in the console dropdown
   saves it to localStorage; both windows apply it immediately, and the
   "storage" event keeps them in sync live (same mechanism already used
   elsewhere in script.js for game state). */

const BINGO_THEMES = {
  default: {
    label: "Default",
    board: "themes/default/board.css",
    control: "themes/default/control.css"
  },
  holiday: {
    label: "Holiday",
    board: "themes/holiday/board.css",
    control: "themes/holiday/control.css"
  },
  western: {
    label: "Western",
    board: "themes/western/board.css",
    control: "themes/western/control.css"
  },
  anniversary: {
    label: "25th Anniversary",
    board: "themes/anniversary/board.css",
    control: "themes/anniversary/control.css"
  }
};

const THEME_STORAGE_KEY = "bingoTheme";

// Kept as "holiday" so existing deployments don't visually change
// the moment this update goes live; pick "25th Anniversary" from the
// console dropdown whenever you're ready to switch the live look.
const FALLBACK_THEME = "holiday";

function getCurrentTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return (saved && BINGO_THEMES[saved]) ? saved : FALLBACK_THEME;
}

function applyTheme(name) {
  const key = BINGO_THEMES[name] ? name : FALLBACK_THEME;
  const theme = BINGO_THEMES[key];

  const boardLink = document.getElementById("theme-board-css");
  if (boardLink) boardLink.setAttribute("href", theme.board);

  const controlLink = document.getElementById("theme-control-css");
  if (controlLink) controlLink.setAttribute("href", theme.control);

  document.documentElement.setAttribute("data-theme", key);

  const select = document.getElementById("theme-select");
  if (select && select.value !== key) select.value = key;
}

function setTheme(name) {
  localStorage.setItem(THEME_STORAGE_KEY, name);
  applyTheme(name);
}

// Apply as soon as this script runs. The <link> tags it targets must already
// be present in the HTML above this <script> tag.
applyTheme(getCurrentTheme());

// Once the rest of the page (like the theme <select>) exists, sync it up.
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(getCurrentTheme());
});

// Live sync between the call board window and the control panel window.
window.addEventListener("storage", (e) => {
  if (e.key === THEME_STORAGE_KEY) {
    applyTheme(e.newValue || FALLBACK_THEME);
  }
});
