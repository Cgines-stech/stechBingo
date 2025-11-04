/* script.js */
/* ---------- Bingo Board Core ---------- */
const totalNumbers = 75;
const gridContainer = document.getElementById("number-grid");
const cardContainer = document.getElementById("card-view");
const allCardsContainer = document.getElementById("all-cards-view");
const lastCalledDisplay = document.getElementById("last-called");
const controlLastCalled = document.getElementById("control-last-called");

/* ---------- Patterns ---------- */
const P = {
  allLines() {
    const lines = [];
    for (let r = 0; r < 5; r++) lines.push([[r,0],[r,1],[r,2],[r,3],[r,4]]);
    for (let c = 0; c < 5; c++) lines.push([[0,c],[1,c],[2,c],[3,c],[4,c]]);
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
  fourCorners() { return [[[0,0],[0,4],[4,0],[4,4]]]; },
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
    return [[[1,0],[1,1],[1,2],[1,3],[1,4],[3,0],[3,1],[3,2],[3,3],[3,4]]];
  },
  crazyKites() {
    return [
      [[0,0],[1,1],[2,2],[3,3],[4,4],[0,1]],
      [[0,0],[1,1],[2,2],[3,3],[4,4],[4,3]],
      [[0,4],[1,3],[2,2],[3,1],[4,0],[0,3]],
      [[0,4],[1,3],[2,2],[3,1],[4,0],[4,1]],
    ];
  },
  arrows() {
    // Proper arrows (tip + head + shaft)
    const up = [[0,2],[1,1],[1,2],[1,3],[2,2],[3,2],[4,2]];
    const down = up.map(([r,c]) => [4-r, c]);
    const left = [[2,0],[1,1],[2,1],[3,1],[2,2],[2,3],[2,4]];
    const right = left.map(([r,c]) => [r, 4-c]);
    return [up,down,left,right];
  },
  coverall() {
    const cells = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) cells.push([r,c]);
    return [cells];
  }
};

/* ---------- Helpers ---------- */
function isMarkedNumber(num, called) { return num === 0 || called.includes(num); }
function isMarkedNumberHardWay(num, called) { return num !== 0 && called.includes(num); }

function evaluatePattern(card, called, patternKey) {
  const marked = card.map(row => row.map(num => isMarkedNumber(num, called)));
  const markedHard = card.map(row => row.map(num => isMarkedNumberHardWay(num, called)));

  const collectIfAllMarked = (sets, useHard = false) => {
    const grid = useHard ? markedHard : marked;
    const winners = [];
    sets.forEach(set => { if (set.every(([r,c]) => grid[r][c])) winners.push(set); });
    return winners;
  };

  switch (patternKey) {
    case "anyLine": {
      const w = collectIfAllMarked(P.allLines());
      return { won: w.length > 0, winningSets: w };
    }
    case "doubleBingo": {
      const w = collectIfAllMarked(P.allLines());
      return { won: w.length >= 2, winningSets: w.slice(0,2) };
    }
    case "hardWay": {
      const removeCenter = set => set.filter(([r,c]) => !(r===2 && c===2));
      const rowSets = P.rowsOnly().map(removeCenter);
      const colSets = P.colsOnly().map(removeCenter);
      const w = [...collectIfAllMarked(rowSets, true), ...collectIfAllMarked(colSets, true)];
      return { won: w.length > 0, winningSets: w };
    }
    case "fourCorners":    { const w = collectIfAllMarked(P.fourCorners()); return { won: w.length>0, winningSets:w }; }
    case "insideSquare":   { const w = collectIfAllMarked(P.insideSquare3x3()); return { won: w.length>0, winningSets:w }; }
    case "outsideSquare":  { const w = collectIfAllMarked(P.outsideSquareBorder()); return { won: w.length>0, winningSets:w }; }
    case "layerCake":      { const w = collectIfAllMarked(P.layerCakeRows2and4()); return { won: w.length>0, winningSets:w }; }
    case "crazyKite":      { const w = collectIfAllMarked(P.crazyKites()); return { won: w.length>0, winningSets:w }; }
    case "arrow":          { const w = collectIfAllMarked(P.arrows()); return { won: w.length>0, winningSets:w }; }
    case "coverall":       { const w = collectIfAllMarked(P.coverall()); return { won: w.length>0, winningSets:w }; }
    default:               { const w = collectIfAllMarked(P.allLines()); return { won: w.length>0, winningSets:w }; }
  }
}

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

/* ---------- State ---------- */
function getState() {
  const s = JSON.parse(localStorage.getItem("bingoState") || "{}");
  if (!s.currentPattern) s.currentPattern = "anyLine";
  if (!s.winnersByPattern) s.winnersByPattern = {};
  if (!s.calledNumbers) s.calledNumbers = [];
  return s;
}
function setState(state) {
  const pattern = state.currentPattern || "anyLine";
  if (!state.winnersByPattern) state.winnersByPattern = {};
  const winners = state.winnersByPattern[pattern] || {};

  for (const [id, card] of Object.entries(cardData)) {
    const { won } = evaluatePattern(card, state.calledNumbers || [], pattern);
    if (won && !winners[id]) winners[id] = (state.calledNumbers || []).length;
  }

  state.winnersByPattern[pattern] = winners;
  localStorage.setItem("bingoState", JSON.stringify(state));
  updateDisplays();
}

/* ---------- Pattern Preview (floating window) ---------- */
let previewIndex = 0;
let previewTimer = null;

function pairLines(lines) {
  const pairs = [];
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const set = new Set([...lines[i], ...lines[j]].map(([r,c]) => `${r},${c}`));
      pairs.push([...set].map(s => s.split(',').map(n => parseInt(n,10))));
    }
  }
  return pairs;
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
  const container = document.getElementById("pattern-preview");
  if (!container) return;

  const state = getState();
  const key = state.currentPattern || "anyLine";
  const sets = getPatternSetsForPreview(key);
  if (!sets || sets.length === 0) { container.innerHTML = ""; return; }

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
  container.innerHTML = html;
}

function startPatternPreviewCycle() {
  if (previewTimer) clearInterval(previewTimer);
  previewIndex = 0;
  renderPatternPreview();

  const state = getState();
  const sets = getPatternSetsForPreview(state.currentPattern || "anyLine");
  if (!sets || sets.length <= 1) return;

  previewTimer = setInterval(() => {
    previewIndex++;
    renderPatternPreview();
  }, 1400);
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
    <div class="pf-body"><div id="pattern-preview"></div></div>
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

function showPatternFlyout() {
  ensurePatternFlyout();
  renderPatternPreview();
}

/* ---------- UI Sync ---------- */
function applySelectedPattern() {
  const sel = document.getElementById("pattern-select");
  if (!sel) return;
  const state = getState();
  state.currentPattern = sel.value;
  setState(state);
}

function syncPatternUI() {
  const state = getState();
  const banner = document.getElementById("pattern-display");
  if (banner) banner.textContent = PATTERN_LABELS[state.currentPattern] || state.currentPattern;
  const sel = document.getElementById("pattern-select");
  if (sel) sel.value = state.currentPattern;
}

/* ---------- Call numbers & views ---------- */
function callNextNumber() {
  const state = getState();
  const available = [];
  for (let i = 1; i <= totalNumbers; i++) if (!state.calledNumbers.includes(i)) available.push(i);
  if (available.length === 0) return alert("All numbers called!");
  callNumber(available[Math.floor(Math.random() * available.length)]);
}
function callManualNumber() {
  const input = document.getElementById("manual-input")?.value;
  const num = parseInt(input);
  if (!num || num < 1 || num > 75) return alert("Invalid number");
  callNumber(num);
}
function callNumber(num) {
  const state = getState();
  if (!state.calledNumbers.includes(num)) state.calledNumbers.push(num);
  state.lastCalled = num;
  setState(state);
}
function toggleView() {
  const state = getState();
  state.activeView = state.activeView === "card" ? "grid" : "card";
  setState(state);
}
function toggleAllCardsView() {
  const state = getState();
  state.activeView = state.activeView === "all" ? "grid" : "all";
  setState(state);
}
function showCard() {
  const cardId = document.getElementById("card-id-input")?.value;
  if (!cardData[cardId]) return alert("Card not found");
  const state = getState();
  state.currentCardId = cardId;
  state.activeView = "card";
  setState(state);
}

function renderCard(cardId) {
  const card = cardData[cardId];
  const state = getState();
  const called = state.calledNumbers || [];
  const { winningSets } = evaluatePattern(card, called, state.currentPattern);
  const winningCells = new Set(winningSets.flat().map(([r,c]) => `${r},${c}`));

  cardContainer.innerHTML = `<h2>Card ${cardId}</h2><div class="card-grid"></div>`;
  const grid = cardContainer.querySelector(".card-grid");

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const num = card[r][c];
      const cell = document.createElement("div");
      let cls = "card-cell";
      if (isMarkedNumber(num, called)) cls += " marked";
      if (winningCells.has(`${r},${c}`)) cls += " winner";
      cell.className = cls;
      cell.textContent = num === 0 ? "" : num;
      grid.appendChild(cell);
    }
  }
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
  cards.sort((a,b)=> b.isWinner - a.isWinner);
  cards.forEach(({element}) => container.appendChild(element));
}

function resetGame() {
  const newState = { calledNumbers: [], lastCalled: null, activeView: "grid", currentCardId: null };
  setState(newState);
}

function updateDisplays() {
  const state = getState();

  // last ball
  if (lastCalledDisplay) {
    const last = state.lastCalled;
    lastCalledDisplay.textContent = last || "-";
    lastCalledDisplay.classList.remove("B","I","N","G","O");
    if (last) {
      const group = last <= 15 ? "B" : last <= 30 ? "I" : last <= 45 ? "N" : last <= 60 ? "G" : "O";
      lastCalledDisplay.classList.add("last-ball", group);
    } else {
      lastCalledDisplay.classList.remove("last-ball");
    }
  }

  // main views
  const cardView = document.getElementById("card-view");
  const gridView = document.getElementById("number-grid");

  if (cardView && state.activeView === "card") {
    cardView.classList.remove("hidden");
    gridView?.classList.add("hidden");
    allCardsContainer?.classList.add("hidden");
    if (state.currentCardId && cardData[state.currentCardId]) renderCard(state.currentCardId);
    else cardContainer.innerHTML = "<p>No card selected</p>";

  } else if (state.activeView === "all") {
    allCardsContainer?.classList.remove("hidden");
    cardView?.classList.add("hidden");
    gridView?.classList.add("hidden");
    renderAllCards(allCardsContainer, state.calledNumbers || []);

  } else if (gridView) {
    cardView?.classList.add("hidden");
    allCardsContainer?.classList.add("hidden");
    gridView.classList.remove("hidden");

    gridView.innerHTML = "";
    const ranges = [
      { label:'B', start:1, end:15, class:'B' },
      { label:'I', start:16, end:30, class:'I' },
      { label:'N', start:31, end:45, class:'N' },
      { label:'G', start:46, end:60, class:'G' },
      { label:'O', start:61, end:75, class:'O' },
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
        let cls = "number";
        if (state.calledNumbers?.includes(i)) cls += ` called ${range.class}`;
        div.className = cls;
        div.textContent = i;
        row.appendChild(div);
      }
      gridView.appendChild(row);
    });
  }

  // pattern UI + preview
  syncPatternUI();
  showPatternFlyout();
  startPatternPreviewCycle();
}

function hasBingo(card, called) {
  const state = getState();
  return evaluatePattern(card, called, state.currentPattern).won;
}

/* ---------- Boot ---------- */
window.addEventListener("storage", updateDisplays);
window.addEventListener("DOMContentLoaded", () => {
  const state = getState();
  if (!state.currentPattern) { state.currentPattern = "anyLine"; setState(state); }
  else { updateDisplays(); }
});
