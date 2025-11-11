/* script.js */
const totalNumbers = 75;
const gridContainer = document.getElementById("number-grid");
const cardContainer = document.getElementById("card-view");
const allCardsContainer = document.getElementById("all-cards-view");
const lastCalledDisplay = document.getElementById("last-called");
const controlLastCalled = document.getElementById("control-last-called");
const controlHistory = document.getElementById("control-history");

// --- Voice Helpers ----------------------------------------------------------
function populateVoiceList() {
  const select = document.getElementById("voice-select");
  if (!select || typeof speechSynthesis === "undefined") return;

  const voices = speechSynthesis.getVoices();
  select.innerHTML = "";
  voices.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    select.appendChild(opt);
  });
}

function letterFor(num) {
  return num <= 15 ? "B" : num <= 30 ? "I" : num <= 45 ? "N" : num <= 60 ? "G" : "O";
}

function speakNumber(num) {
  if (typeof speechSynthesis === "undefined") return;
  const toggle = document.getElementById("voice-enabled");
  if (toggle && !toggle.checked) return;

  const letter = letterFor(num);
  const utter = new SpeechSynthesisUtterance(`${letter} ${num}`);
  utter.rate = 0.9;

  const selectedName = document.getElementById("voice-select")?.value;
  const voices = speechSynthesis.getVoices();
  const chosen = voices.find(v => v.name === selectedName);
  if (chosen) utter.voice = chosen;

  speechSynthesis.cancel(); // stop any overlapping speech
  speechSynthesis.speak(utter);
}

// --- Voice init (single handler + remember selection) -----------------------
let __voicesReady = false;

function populateVoiceList() {
  const select = document.getElementById("voice-select");
  if (!select || typeof speechSynthesis === "undefined") return;

  const voices = speechSynthesis.getVoices();
  const prev = localStorage.getItem("bingoVoiceName") || select.value || "";

  select.innerHTML = "";
  voices.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    if (v.name === prev) opt.selected = true;
    select.appendChild(opt);
  });
}

function initVoices() {
  if (typeof speechSynthesis === "undefined") return;

  // Single handler: mark ready + populate list
  speechSynthesis.onvoiceschanged = () => {
    __voicesReady = true;
    populateVoiceList();
  };

  // In some browsers, voices are already available immediately
  if (speechSynthesis.getVoices().length > 0) {
    __voicesReady = true;
    populateVoiceList();
  }

  // Save selection when user changes it
  const select = document.getElementById("voice-select");
  if (select) {
    select.addEventListener("change", () => {
      localStorage.setItem("bingoVoiceName", select.value);
    });
  }
}

// Call once UI exists
window.addEventListener("DOMContentLoaded", initVoices);


function speakText(text, opts = {}) {
  if (typeof speechSynthesis === "undefined") return;

  const go = () => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate  = opts.rate  ?? 0.95;
    utter.pitch = opts.pitch ?? 1.0;

    // Prefer selected voice if present; else first English voice
    const list = speechSynthesis.getVoices();
    const sel = document.getElementById("voice-select")?.value;
    let v = (sel && list.find(x => x.name === sel)) || list.find(x => /^en(-|_|$)/i.test(x.lang));
    if (v) utter.voice = v;

    // Don't aggressively cancel here; it can clip/kill the utterance on some browsers.
    // If you need to stop overlaps, you can pause/clear a queue yourself.
    speechSynthesis.speak(utter);
  };

  // If voices are not ready yet, retry a couple of times quickly
  if (!__voicesReady && speechSynthesis.getVoices().length === 0) {
    setTimeout(go, 120); // brief delay lets voices populate
  } else {
    go();
  }
}

function getSelectedVoice() {
  if (typeof speechSynthesis === "undefined") return null;
  const list = speechSynthesis.getVoices();
  const saved = localStorage.getItem("bingoVoiceName");
  const sel = document.getElementById("voice-select")?.value || saved;
  return (sel && list.find(v => v.name === sel)) || list.find(v => /^en(-|_|$)/i.test(v.lang)) || null;
}

function speakNumber(num) {
  if (typeof speechSynthesis === "undefined") return;
  const toggle = document.getElementById("voice-enabled");
  if (toggle && !toggle.checked) return;

  const utter = new SpeechSynthesisUtterance(`${letterFor(num)} ${num}`);
  utter.rate = 0.9;

  const v = getSelectedVoice();
  if (v) utter.voice = v;

  // Optional: comment out cancel if it seems to silence on your setup
  // speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

function speakText(text, opts = {}) {
  if (typeof speechSynthesis === "undefined") return;

  const go = () => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate  = opts.rate  ?? 0.95;
    utter.pitch = opts.pitch ?? 1.0;
    const v = getSelectedVoice();
    if (v) utter.voice = v;
    speechSynthesis.speak(utter);
  };

  if (!__voicesReady && speechSynthesis.getVoices().length === 0) {
    setTimeout(go, 120);
  } else {
    go();
  }
}


// ===== Confetti trigger via localStorage =====
// Call this from control.html; index.html will listen and pop confetti.
function triggerConfetti() {
  // set a unique value each time
  localStorage.setItem("confettiTriggerAt", String(Date.now()));
}

// ===== Public function for the button =====
function announceBingo() {
  // Voice announcement
  speakText("Bingo!");

  // Also show a quick on-screen note in the control panel
  const announcerDisplay = document.getElementById("announcer-display");
  if (announcerDisplay) {
    announcerDisplay.innerHTML = `
      <div class="announce-letter">🎉</div>
      <div class="announce-ball">BINGO!</div>
    `;
    setTimeout(() => (announcerDisplay.innerHTML = ""), 1800);
  }

  // Fire confetti on the main board page (index.html)
  triggerConfetti();
}


// ===== Lightweight Confetti (no external libs) =====
function runConfetti(durationMs = 1600) {
  // Don't run on the control panel page
  if (document.body.classList && document.body.classList.contains("control-panel")) return;

  // Create an overlay canvas
  let canvas = document.getElementById("confetti-canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "confetti-canvas";
    canvas.style.position = "fixed";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext("2d");

// Size to viewport (account for devicePixelRatio)
const resize = () => {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width  = Math.floor(window.innerWidth  * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale drawings to CSS pixels
};
resize();
window.addEventListener("resize", resize);

// Make particles (spread left/right & go upward)
const colors = ["#f44336","#ff9800","#ffeb3b","#4caf50","#2196f3","#9c27b0"];
const N = 160;
const parts = Array.from({ length: N }, () => {
  const speed = 6 + Math.random() * 6;
  return {
    x: canvas.width / 2,
    y: canvas.height / 4,
    vx: (Math.random() * 2 - 1) * speed,   // negative or positive
    vy: -(8 + Math.random() * 6),          // strong upward burst
    g: 0.22 + Math.random() * 0.25,
    w: 6 + Math.random() * 6,
    h: 10 + Math.random() * 12,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)],
    alpha: 1
  };
});


  const start = performance.now();
  let anim;
  const tick = (t) => {
    const elapsed = t - start;
    const done = elapsed >= durationMs;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts.forEach(p => {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      // fade near the end
      if (elapsed > durationMs * 0.7) p.alpha = Math.max(0, 1 - (elapsed - durationMs * 0.7) / (durationMs * 0.3));

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    });

    if (!done) {
      anim = requestAnimationFrame(tick);
    } else {
      // Cleanup
      cancelAnimationFrame(anim);
      setTimeout(() => {
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }, 50);
    }
  };
  anim = requestAnimationFrame(tick);
}

// Listen for confetti triggers from control.html
window.addEventListener("storage", (e) => {
  if (e.key === "confettiTriggerAt" && e.newValue) {
    // Only main board should run confetti
    if (!document.body.classList.contains("control-panel")) {
      runConfetti();
      // optional: also speak "Bingo!" on the board page
      try { speakText("Bingo!"); } catch (_) {}
    }
  }
});


// --- Pattern Engine ---------------------------------------------------------
const P = {
  // All straight lines (5 rows, 5 cols, 2 diags)
  allLines() {
    const lines = [];
    // rows
    for (let r = 0; r < 5; r++) lines.push([[r,0],[r,1],[r,2],[r,3],[r,4]]);
    // cols
    for (let c = 0; c < 5; c++) lines.push([[0,c],[1,c],[2,c],[3,c],[4,c]]);
    // diags
    lines.push([[0,0],[1,1],[2,2],[3,3],[4,4]]);
    lines.push([[0,4],[1,3],[2,2],[3,1],[4,0]]);
    return lines;
  },
  rowsOnly() {
    const lines = [];
    for (let r = 0; r < 5; r++) lines.push([[r,0],[r,1],[r,2],[r,3],[r,4]]);
    return lines;
  },
  colsOnly() {
    const lines = [];
    for (let c = 0; c < 5; c++) lines.push([[0,c],[1,c],[2,c],[3,c],[4,c]]);
    return lines;
  },
  fourCorners() {
    return [[[0,0],[0,4],[4,0],[4,4]]];
  },
  insideSquare3x3() {
    const cells = [];
    for (let r = 1; r <= 3; r++) for (let c = 1; c <= 3; c++) cells.push([r,c]);
    return [cells];
  },
  outsideSquareBorder() {
    const cells = [];
    for (let c = 0; c < 5; c++) { cells.push([0,c]); cells.push([4,c]); }
    for (let r = 1; r < 4; r++) { cells.push([r,0]); cells.push([r,4]); }
    return [cells];
  },
  layerCakeRows2and4() {
    // Rows 1 and 3 in 0-based => visual rows 2 & 4
    return [[[1,0],[1,1],[1,2],[1,3],[1,4],[3,0],[3,1],[3,2],[3,3],[3,4]]];
  },
  crazyKites() {
    // 4 orientations; each is a "kite" (a diagonal of 5 plus a wing near one end)
    // We'll define compact 5-cell diagonal + 1 wing; total 6 cells per orientation.
    return [
      // NE-SW diag with wing off the [0,0] end to the right
      [[0,0],[1,1],[2,2],[3,3],[4,4],[0,1]],
      // NE-SW with wing off the [4,4] end to the left
      [[0,0],[1,1],[2,2],[3,3],[4,4],[4,3]],
      // NW-SE diag with wing off the [0,4] end to the left
      [[0,4],[1,3],[2,2],[3,1],[4,0],[0,3]],
      // NW-SE with wing off the [4,0] end to the right
      [[0,4],[1,3],[2,2],[3,1],[4,0],[4,1]],
    ];
  },
arrows() {
  // Up arrow: tip at [0,2], head wings at [1,1] and [1,3], shaft down to [4,2]
  const up = [
    [0,2],           // tip
    [1,1],[1,2],[1,3], // head row
    [2,2],[3,2],[4,2]  // shaft
  ];
  // Down arrow: mirror vertically
  const down = up.map(([r,c]) => [4 - r, c]);

  // Left arrow: tip at [2,0], head wings [1,1] & [3,1], shaft across to [2,4]
  const left = [
    [2,0],           // tip
    [1,1],[2,1],[3,1], // head col
    [2,2],[2,3],[2,4]  // shaft
  ];
  // Right arrow: mirror horizontally
  const right = left.map(([r,c]) => [r, 4 - c]);

  return [up, down, left, right];
},

  coverall() {
    const cells = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) cells.push([r,c]);
    return [cells];
  }
};

// Mark check; by default FREE (0) counts as marked.
// For "hard way", FREE shouldn't give a freebie on a line; we require the center number to be called.
function isMarkedNumber(num, called) {
  return num === 0 || called.includes(num);
}
function isMarkedNumberHardWay(num, called) {
  if (num === 0) return false; // free doesn't count
  return called.includes(num);
}

// Return {won:boolean, winningSets: Array<Array<[r,c]>>}
function evaluatePattern(card, called, patternKey) {
  const get = (r,c) => card[r][c];

  // build convenience matrix of booleans
  const marked = card.map(row => row.map(num => isMarkedNumber(num, called)));
  const markedHard = card.map(row => row.map(num => isMarkedNumberHardWay(num, called)));

  const collectIfAllMarked = (sets, useHard = false) => {
    const grid = useHard ? markedHard : marked;
    const winners = [];
    sets.forEach(set => {
      if (set.every(([r,c]) => grid[r][c])) winners.push(set);
    });
    return winners;
  };

  switch (patternKey) {
    case "anyLine": {
      const winners = collectIfAllMarked(P.allLines());
      return { won: winners.length > 0, winningSets: winners };
    }
    case "doubleBingo": {
      const winners = collectIfAllMarked(P.allLines());
      return { won: winners.length >= 2, winningSets: winners.slice(0,2) };
    }
    case "hardWay": {
  // rows or cols only; center (2,2) does NOT help. Require all other cells in the line.
  const removeCenter = set => set.filter(([r,c]) => !(r === 2 && c === 2));
  const rowSets = P.rowsOnly().map(removeCenter);
  const colSets = P.colsOnly().map(removeCenter);
  const winners = [
    ...collectIfAllMarked(rowSets, true),  // useHard => free doesn't count anywhere
    ...collectIfAllMarked(colSets, true),
  ];
  return { won: winners.length > 0, winningSets: winners };
}

    case "fourCorners": {
      const winners = collectIfAllMarked(P.fourCorners());
      return { won: winners.length > 0, winningSets: winners };
    }
    case "insideSquare": {
      const winners = collectIfAllMarked(P.insideSquare3x3());
      return { won: winners.length > 0, winningSets: winners };
    }
    case "outsideSquare": {
      const winners = collectIfAllMarked(P.outsideSquareBorder());
      return { won: winners.length > 0, winningSets: winners };
    }
    case "layerCake": {
      const winners = collectIfAllMarked(P.layerCakeRows2and4());
      return { won: winners.length > 0, winningSets: winners };
    }
    case "crazyKite": {
      const winners = collectIfAllMarked(P.crazyKites());
      return { won: winners.length > 0, winningSets: winners };
    }
    case "arrow": {
      const winners = collectIfAllMarked(P.arrows());
      return { won: winners.length > 0, winningSets: winners };
    }
    case "coverall": {
      const winners = collectIfAllMarked(P.coverall());
      return { won: winners.length > 0, winningSets: winners };
    }
    default: { // fallback to classic
      const winners = collectIfAllMarked(P.allLines());
      return { won: winners.length > 0, winningSets: winners };
    }
  }
}

// convenience for UI text
const PATTERN_LABELS = {
  anyLine: "Any Line (Row/Col/Diag)",
  doubleBingo: "Double Bingo",
  hardWay: "Hard Way",
  fourCorners: "Four Corners",
  insideSquare: "Inside Square (3×3)",
  outsideSquare: "Outside Square (Border)",
  layerCake: "Layer Cake (Rows 2 & 4)",
  crazyKite: "Crazy Kite",
  arrow: "Arrow",
  coverall: "Coverall",
};

// --- Pattern Preview ---------------------------------------------------------
let previewIndex = 0;
let previewTimer = null;

function pairLines(lines) {
  // lines: Array<Array<[r,c]>>
  const pairs = [];
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      // union of two lines
      const set = new Set([...lines[i], ...lines[j]].map(([r,c]) => `${r},${c}`));
      pairs.push([...set].map(s => s.split(',').map(n => parseInt(n,10))));
    }
  }
  return pairs; // up to 66 pairs for 12 lines; rotates nicely
}

function getPatternSetsForPreview(patternKey) {
  switch (patternKey) {
    case "anyLine":       return P.allLines();
    case "doubleBingo":   return pairLines(P.allLines());
    case "hardWay": {
      const removeCenter = set => set.filter(([r,c]) => !(r===2 && c===2));
      return [...P.rowsOnly().map(removeCenter), ...P.colsOnly().map(removeCenter)];
    }
    case "fourCorners":    return P.fourCorners();
    case "insideSquare":   return P.insideSquare3x3();
    case "outsideSquare":  return P.outsideSquareBorder();
    case "layerCake":      return P.layerCakeRows2and4();
    case "crazyKite":      return P.crazyKites();
    case "arrow":          return P.arrows();
    case "coverall":       return P.coverall();
    default:               return P.allLines();
  }
}

function renderPatternPreview() {
  const target = document.getElementById("pattern-preview-flyout");
  if (!target) return;

  const state = getState();
  const key = state.currentPattern || "anyLine";
  const sets = getPatternSetsForPreview(key);
  if (!sets || sets.length === 0) {
    target.innerHTML = "";
    return;
  }

  const idx = sets.length > 0 ? (previewIndex % sets.length) : 0;
  const active = sets[idx] || [];
  const isDouble = key === "doubleBingo";

  let html = `
    <div class="pf-title">${PATTERN_LABELS[key] || key}</div>
    ${isDouble ? '<div class="pf-note">Win with any <strong>two lines</strong>.</div>' : ''}
    <div class="mini-card">
  `;

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const on = active.some(([rr,cc]) => rr === r && cc === c);
      const isFree = (r === 2 && c === 2);
      html += `<div class="mini-cell${on ? ' on' : ''}${isFree ? ' free' : ''}"></div>`;
    }
  }
  html += `</div>`;

  target.innerHTML = html;
}



function startPatternPreviewCycle() {
  // Clear any existing loop
  if (previewTimer) clearInterval(previewTimer);
  previewIndex = 0;

  const state = getState();
  const sets = getPatternSetsForPreview(state.currentPattern || "anyLine");
  renderPatternPreview();

  // Single-shape patterns don't need rotation
  if (!sets || sets.length <= 1) return;

  previewTimer = setInterval(() => {
    previewIndex++;
    renderPatternPreview();
  }, 1400); // rotate every 1.4s; tweak to taste
}

function getState() {
  const s = JSON.parse(localStorage.getItem("bingoState") || "{}");
  if (!s.currentPattern) s.currentPattern = "anyLine";
  if (!s.winnersByPattern) s.winnersByPattern = {}; // { [pattern]: { [cardId]: drawCount } }
  if (!s.calledNumbers) s.calledNumbers = [];
  return s;
}

function setState(state) {
  const pattern = state.currentPattern || "anyLine";
  if (!state.winnersByPattern) state.winnersByPattern = {};
  const winners = state.winnersByPattern[pattern] || {};

  for (const [id, card] of Object.entries(cardData)) {
    const { won } = evaluatePattern(card, state.calledNumbers || [], pattern);
    if (won && !winners[id]) {
      winners[id] = (state.calledNumbers || []).length; // first time achieved
    }
  }

  state.winnersByPattern[pattern] = winners;
  localStorage.setItem("bingoState", JSON.stringify(state));
  updateDisplays();
}

function applySelectedPattern() {
  const sel = document.getElementById("pattern-select");
  if (!sel) return;
  const value = sel.value;
  const state = getState();
  state.currentPattern = value;
  setState(state); // re-evaluate winners for this pattern
}

function syncPatternUI() {
  const state = getState();
  const banner = document.getElementById("pattern-display");
  if (banner) banner.textContent = PATTERN_LABELS[state.currentPattern] || state.currentPattern;

  const sel = document.getElementById("pattern-select");
  if (sel) sel.value = state.currentPattern;
}


function callNextNumber() {
  let state = getState();
  let available = [];
  for (let i = 1; i <= totalNumbers; i++) {
    if (!state.calledNumbers?.includes(i)) available.push(i);
  }
  if (available.length === 0) return alert("All numbers called!");
  const next = available[Math.floor(Math.random() * available.length)];
  callNumber(next);
}

function callManualNumber() {
  const input = document.getElementById("manual-input").value;
  const num = parseInt(input);
  if (!num || num < 1 || num > 75) return alert("Invalid number");
  callNumber(num);
}

function callNumber(num) {
  let state = getState();
  if (!state.calledNumbers) state.calledNumbers = [];
  if (!state.calledNumbers.includes(num)) {
    state.calledNumbers.push(num);
  }
  state.lastCalled = num;
  setState(state);

  // 🔊 Say the number
  speakNumber(num);
}

function toggleView() {
  let state = getState();
  state.activeView = state.activeView === "card" ? "grid" : "card";
  setState(state);
}

function toggleAllCardsView() {
  let state = getState();
  state.activeView = state.activeView === "all" ? "grid" : "all";
  setState(state);
}

function showCard() {
  const cardId = document.getElementById("card-id-input").value;
  if (!cardData[cardId]) return alert("Card not found");
  let state = getState();
  state.currentCardId = cardId;
  state.activeView = "card";
  setState(state);
}

function renderCard(cardId) {
  const card = cardData[cardId];
  const state = getState();
  const called = state.calledNumbers || [];

  const { winningSets } = evaluatePattern(card, called, state.currentPattern);
  const winningCells = new Set(
    winningSets.flat().map(([r,c]) => `${r},${c}`)
  );

  cardContainer.innerHTML = `<h2>Card ${cardId}</h2><div class="card-grid"></div>`;
  const grid = cardContainer.querySelector(".card-grid");

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const num = card[r][c];
      const cell = document.createElement("div");
      let classList = "card-cell";

      // Marked?
      if (isMarkedNumber(num, called)) classList += " marked";

      // Winner cell?
      if (winningCells.has(`${r},${c}`)) classList += " winner";

      cell.className = classList;
      cell.textContent = num === 0 ? "" : num;
      grid.appendChild(cell);
    }
  }
}

function ensurePatternFlyout() {
  if (document.getElementById("pattern-flyout")) return;

  const fly = document.createElement("div");
  fly.id = "pattern-flyout";
  fly.innerHTML = `
    <div class="pf-head">
      <span class="pf-drag-handle">🎯 Pattern Preview</span>
      <div class="pf-actions">
        <button class="pf-btn pf-min" title="Minimize">—</button>
        <button class="pf-btn pf-close" title="Close">×</button>
      </div>
    </div>
    <div class="pf-body">
      <div id="pattern-preview-flyout"></div>
    </div>
  `;
  document.body.appendChild(fly);

  const body = fly.querySelector(".pf-body");
  fly.querySelector(".pf-close").addEventListener("click", () => fly.remove());
  fly.querySelector(".pf-min").addEventListener("click", () => body.classList.toggle("hidden"));

  makeDraggable(fly, fly.querySelector(".pf-drag-handle"));
}



function makeDraggable(el, handle) {
  let startX=0, startY=0, originX=0, originY=0, dragging=false;

  const onDown = (e) => {
    dragging = true;
    const ev = e.touches ? e.touches[0] : e;
    startX = ev.clientX; startY = ev.clientY;
    const rect = el.getBoundingClientRect();
    originX = rect.left; originY = rect.top;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, {passive:false});
    document.addEventListener("touchend", onUp);
  };

  const onMove = (e) => {
    if (!dragging) return;
    const ev = e.touches ? e.touches[0] : e;
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    el.style.left = `${originX + dx}px`;
    el.style.top  = `${originY + dy}px`;
  };

  const onUp = () => {
    dragging = false;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("touchend", onUp);
  };

  handle.addEventListener("mousedown", onDown);
  handle.addEventListener("touchstart", onDown, {passive:false});
}

// call this whenever you refresh UI
function showPatternFlyout() {
  ensurePatternFlyout();
  renderPatternPreview();
}


function renderAllCards(container, calledNumbers) {
  container.innerHTML = "";

  const cards = Object.entries(cardData).map(([id, card]) => {
    const isWinner = hasBingo(card, calledNumbers);

    const wrapper = document.createElement("div");
    wrapper.className = "card-wrapper" + (isWinner ? " winner" : "");
    wrapper.innerHTML = `<div class="card-title">Card ${id}</div>`;

    const grid = document.createElement("div");
    grid.className = "card-grid";

    for (let row of card) {
      for (let num of row) {
        const cell = document.createElement("div");
        const isMarked = num === 0 || calledNumbers.includes(num);
        cell.className = "card-cell" + (isMarked ? " marked" : "");
        cell.textContent = num === 0 ? "FREE" : num;
        grid.appendChild(cell);
      }
    }

    wrapper.appendChild(grid);

    if (isWinner) {
      const badge = document.createElement("div");
      badge.textContent = "BINGO!";
      badge.className = "winner-badge";
      wrapper.appendChild(badge);
    }

    return { element: wrapper, isWinner };
  });

  // Sort: winners first
  cards.sort((a, b) => b.isWinner - a.isWinner);

  // Append to container
  cards.forEach(({ element }) => container.appendChild(element));
}

function resetGame() {
  const newState = {
    calledNumbers: [],
    lastCalled: null,
    activeView: "grid",  // default to grid view
    currentCardId: null
  };
  setState(newState);
}

function updateDisplays() {
  const state = getState();

  // Ensure winners are updated
  if (!state.winners) state.winners = {};
  for (const [id, card] of Object.entries(cardData)) {
    if (!state.winners[id] && hasBingo(card, state.calledNumbers || [])) {
      state.winners[id] = state.calledNumbers.length;
    }
  }
  localStorage.setItem("bingoState", JSON.stringify(state));

  // === Update last ball circle ===
  if (lastCalledDisplay) {
    const last = state.lastCalled;
    lastCalledDisplay.textContent = last || "-";
    lastCalledDisplay.classList.remove("B", "I", "N", "G", "O");
    if (last) {
      const group = last <= 15 ? "B" : last <= 30 ? "I" : last <= 45 ? "N" : last <= 60 ? "G" : "O";
      lastCalledDisplay.classList.add("last-ball", group);
    } else {
      lastCalledDisplay.classList.remove("last-ball");
    }
  }

  // === Control Panel ===
  if (controlLastCalled) controlLastCalled.textContent = state.lastCalled || "-";

  const controlHistory = document.getElementById("control-history");
  if (controlHistory) controlHistory.textContent = state.calledNumbers?.join(", ") || "-";

  const controlCount = document.getElementById("control-count");
  if (controlCount) controlCount.textContent = state.calledNumbers?.length || 0;

  // === Announcer Display ===
  const announcerDisplay = document.getElementById("announcer-display");
  if (announcerDisplay && state.lastCalled) {
    const letter = state.lastCalled <= 15 ? "B" :
                   state.lastCalled <= 30 ? "I" :
                   state.lastCalled <= 45 ? "N" :
                   state.lastCalled <= 60 ? "G" : "O";

    const colorClass = letter;

    announcerDisplay.innerHTML = `
      <div class="announce-letter ${colorClass}">${letter}</div>
      <div class="announce-ball ${colorClass}">${state.lastCalled}</div>
    `;
  } else if (announcerDisplay) {
    announcerDisplay.innerHTML = "";
  }

  // === Winner List ===
const winnerList = document.getElementById("winner-list");
if (winnerList) {
  winnerList.innerHTML = "";
  const pattern = state.currentPattern || "anyLine";
  const winners = (state.winnersByPattern && state.winnersByPattern[pattern]) || {};
  const sorted = Object.entries(winners).sort((a, b) => a[1] - b[1]);
  for (let [cardId, drawCount] of sorted) {
    const li = document.createElement("li");
    li.textContent = `Card ${cardId}: ${drawCount} draws (${PATTERN_LABELS[pattern] || pattern})`;
    winnerList.appendChild(li);
  }
}


  // === View Toggles ===
  const cardView = document.getElementById("card-view");
  const gridView = document.getElementById("number-grid");

  if (cardView && state.activeView === "card") {
    cardView.classList.remove("hidden");
    gridView?.classList.add("hidden");
    allCardsContainer?.classList.add("hidden");

    if (state.currentCardId && cardData[state.currentCardId]) {
      renderCard(state.currentCardId);
    } else {
      cardContainer.innerHTML = "<p>No card selected</p>";
    }

  } else if (state.activeView === "all") {
    allCardsContainer?.classList.remove("hidden");
    cardView?.classList.add("hidden");
    gridView?.classList.add("hidden");

    renderAllCards(allCardsContainer, state.calledNumbers || []);

// === View: Grid ===
} else if (gridView) {
  cardView?.classList.add("hidden");
  allCardsContainer?.classList.add("hidden");
  gridView.classList.remove("hidden");

  // Re-render grid
  gridView.innerHTML = "";
  const ranges = [
    { label: 'B', start: 1,  end: 15, class: 'B' },
    { label: 'I', start: 16, end: 30, class: 'I' },
    { label: 'N', start: 31, end: 45, class: 'N' },
    { label: 'G', start: 46, end: 60, class: 'G' },
    { label: 'O', start: 61, end: 75, class: 'O' },
  ];

  ranges.forEach(range => {
    const row = document.createElement("div");
    row.className = `grid-row ${range.class}`;

    const label = document.createElement("div");
    label.className = "row-label";
    label.textContent = range.label;
    row.appendChild(label);

    for (let i = range.start; i <= range.end; i++) {
      const div = document.createElement("div");
      let classList = "number";
      if (state.calledNumbers?.includes(i)) classList += ` called ${range.class}`;
      div.className = classList;
      div.textContent = i;
      row.appendChild(div);
    }

    gridView.appendChild(row);
  });

  // ✅ Do this once, after building the grid
  syncPatternUI();
}

}

// === Auto Play (Control Panel only) =========================================
(function setupAutoPlay() {
  // Only run on control panel
  if (!document.body.classList.contains("control-panel")) return;

  const KEY_ENABLED = "bingoAutoEnabled";
  const KEY_SECONDS = "bingoAutoSeconds";

  const chk = document.getElementById("autoplay-enabled");
  const sec = document.getElementById("autoplay-seconds");
  const cd  = document.getElementById("autoplay-countdown");

  if (!chk || !sec || !cd) return; // UI not present

  // Internal state
  let timerId = null;
  let targetAtMs = 0;

  // Helpers
  function getSeconds() {
    const v = parseInt(sec.value, 10);
    return isFinite(v) ? Math.min(120, Math.max(2, v)) : 7;
  }
  function allNumbersCalled() {
    const s = getState();
    const count = s.calledNumbers ? s.calledNumbers.length : 0;
    return count >= totalNumbers;
  }
  function savePrefs() {
    localStorage.setItem(KEY_ENABLED, chk.checked ? "1" : "0");
    localStorage.setItem(KEY_SECONDS, String(getSeconds()));
  }
  function loadPrefs() {
    const en = localStorage.getItem(KEY_ENABLED);
    const ss = localStorage.getItem(KEY_SECONDS);
    if (en !== null) chk.checked = en === "1";
    if (ss !== null) sec.value = ss;
  }

  function setCountdownLabel(msLeft) {
    if (!chk.checked) {
      cd.textContent = "(idle)";
      return;
    }
    if (allNumbersCalled()) {
      cd.textContent = "All numbers called";
      return;
    }
    const secs = Math.max(0, Math.ceil(msLeft / 1000));
    cd.textContent = `${secs}s`;
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    setCountdownLabel(0);
  }

  function scheduleNextTick(fullReset = false) {
    // If we've already finished all numbers, stop.
    if (allNumbersCalled()) {
      stopTimer();
      return;
    }

    const now = performance.now();
    const periodMs = getSeconds() * 1000;

    if (fullReset || targetAtMs <= now) {
      targetAtMs = now + periodMs;
    }

    if (!timerId) {
      timerId = setInterval(() => {
        const now = performance.now();
        const msLeft = targetAtMs - now;

        // Update label
        setCountdownLabel(msLeft);

        if (msLeft <= 0) {
          // Time to call next number
          // Safety: if no numbers left, stop.
          if (allNumbersCalled()) {
            stopTimer();
            return;
          }
          callNextNumber();

          // Reset next cycle
          targetAtMs = performance.now() + periodMs;
          setCountdownLabel(periodMs);
        }
      }, 200); // smooth-ish updates without being heavy
    }
  }

  function startTimer() {
    if (!chk.checked) return;
    scheduleNextTick(true);
  }

  // Event bindings
  chk.addEventListener("change", () => {
    savePrefs();
    if (chk.checked) {
      startTimer();
    } else {
      stopTimer();
    }
  });

  sec.addEventListener("change", () => {
    // normalize and persist
    sec.value = String(getSeconds());
    savePrefs();

    // If running, restart the cycle at the new duration
    if (chk.checked) {
      targetAtMs = 0; // force immediate reset of cycle
      scheduleNextTick(true);
    }
  });

  // If you manually call a number, reset the countdown so it feels natural
  const origCallNextNumber = window.callNextNumber;
  window.callNextNumber = function patchedCallNextNumber() {
    origCallNextNumber.apply(this, arguments);
    if (chk.checked) {
      // restart the countdown fresh after a manual/auto call
      targetAtMs = 0;
      scheduleNextTick(true);
    }
  };

  // Also reset countdown when you use manual input button
  const origCallManualNumber = window.callManualNumber;
  window.callManualNumber = function patchedCallManual() {
    origCallManualNumber.apply(this, arguments);
    if (chk.checked) {
      targetAtMs = 0;
      scheduleNextTick(true);
    }
  };

  // If you reset the game, keep your autoplay preference, but restart the timer
  const origResetGame = window.resetGame;
  window.resetGame = function patchedReset() {
    origResetGame.apply(this, arguments);
    if (chk.checked) {
      targetAtMs = 0;
      scheduleNextTick(true);
    } else {
      stopTimer();
    }
  };

  // Keep countdown label in sync if another tab updates state
  window.addEventListener("storage", () => {
    if (!chk.checked) return;
    // if we just finished all numbers elsewhere, stop
    if (allNumbersCalled()) {
      stopTimer();
    }
  });

  // Init
  loadPrefs();
  // Normalize any weird values
  sec.value = String(getSeconds());
  setCountdownLabel(0);
  if (chk.checked) startTimer();
})();

function hasBingo(card, called) {
  const state = getState();
  return evaluatePattern(card, called, state.currentPattern).won;
}

window.addEventListener("storage", updateDisplays);
window.addEventListener("DOMContentLoaded", () => {
  const state = getState();
  if (!state.currentPattern) {
    state.currentPattern = "anyLine";
    setState(state);
  } else {
    updateDisplays();
    showPatternFlyout();        // creates the draggable window
    startPatternPreviewCycle(); // start the rotation once
  }
});
