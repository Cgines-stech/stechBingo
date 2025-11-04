/* script.js */
const totalNumbers = 75;
const gridContainer = document.getElementById("number-grid");
const cardContainer = document.getElementById("card-view");
const allCardsContainer = document.getElementById("all-cards-view");
const lastCalledDisplay = document.getElementById("last-called");
const controlLastCalled = document.getElementById("control-last-called");
const controlHistory = document.getElementById("control-history");

function getState() {
  return JSON.parse(localStorage.getItem("bingoState") || "{}");
}

function setState(state) {
  const winners = state.winners || {};
  for (const [id, card] of Object.entries(cardData)) {
    if (!winners[id] && hasBingo(card, state.calledNumbers || [])) {
      winners[id] = state.calledNumbers.length;
    }
  }
  state.winners = winners;
  localStorage.setItem("bingoState", JSON.stringify(state));
  updateDisplays();
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

  const isMarked = (num) => num === 0 || called.includes(num);
  const winners = [];

  for (let r = 0; r < 5; r++) {
    if (card[r].every(isMarked)) winners.push({ type: 'row', index: r });
  }
  for (let c = 0; c < 5; c++) {
    if (card.every(row => isMarked(row[c]))) winners.push({ type: 'col', index: c });
  }
  if ([0, 1, 2, 3, 4].every(i => isMarked(card[i][i]))) {
    winners.push({ type: 'diag', main: true });
  }
  if ([0, 1, 2, 3, 4].every(i => isMarked(card[i][4 - i]))) {
    winners.push({ type: 'diag', main: false });
  }

  cardContainer.innerHTML = `<h2>Card ${cardId}</h2><div class="card-grid"></div>`;
  const grid = cardContainer.querySelector(".card-grid");

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const num = card[r][c];
      const cell = document.createElement("div");
      let classList = "card-cell";

      if (num === 0 || called.includes(num)) classList += " marked";

      if (
        winners.some(w =>
          (w.type === 'row' && w.index === r) ||
          (w.type === 'col' && w.index === c) ||
          (w.type === 'diag' && ((w.main && r === c) || (!w.main && r + c === 4)))
        )
      ) {
        classList += " winner";
      }

      cell.className = classList;
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
  if (winnerList && state.winners) {
    winnerList.innerHTML = "";
    const sorted = Object.entries(state.winners).sort((a, b) => a[1] - b[1]);
    for (let [cardId, drawCount] of sorted) {
      const li = document.createElement("li");
      li.textContent = `Card ${cardId}: ${drawCount} draws`;
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

  } else if (gridView) {
    cardView?.classList.add("hidden");
    allCardsContainer?.classList.add("hidden");
    gridView.classList.remove("hidden");

    // Re-render grid
    gridView.innerHTML = "";
    const ranges = [
      { label: 'B', start: 1, end: 15, class: 'B' },
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
  }
}

function hasBingo(card, called) {
  const marked = card.map(row => row.map(num => num === 0 || called.includes(num)));

  // Rows
  for (let r = 0; r < 5; r++) {
    if (marked[r].every(Boolean)) return true;
  }

  // Columns
  for (let c = 0; c < 5; c++) {
    if (marked.every(row => row[c])) return true;
  }

  // Diagonals
  if (marked.every((row, i) => row[i])) return true;
  if (marked.every((row, i) => row[4 - i])) return true;

  return false;
} 

window.addEventListener("storage", updateDisplays);
window.addEventListener("DOMContentLoaded", updateDisplays);
