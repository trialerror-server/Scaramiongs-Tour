import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgdXXwpJW_3kruVl0RP1oKo0nK1XWUX9c",
  authDomain: "scaramiong-tour.firebaseapp.com",
  projectId: "scaramiong-tour",
  storageBucket: "scaramiong-tour.firebasestorage.app",
  messagingSenderId: "37914315113",
  appId: "1:37914315113:web:c01596900b3beac6fb55f8",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const scoresCollection = collection(db, "scores");

const SIZE = 7;
const TOTAL_CELLS = SIZE * SIZE;
const KNIGHT_MOVES = [
  [1, 2], [2, 1], [2, -1], [1, -2],
  [-1, -2], [-2, -1], [-2, 1], [-1, 2],
];

const KNIGHT_IMAGE_SRC = "kuda.png";

let playerName = "";
let visited = [];
let moveHistory = [];
let status = "idle";
let startTime = null;
let timerId = null;

const landingEl = document.getElementById("landing");
const gameEl = document.getElementById("game");
const nameInput = document.getElementById("nameInput");
const startBtn = document.getElementById("startBtn");
const showBoardBtn = document.getElementById("showBoardBtn");
const playerLabel = document.getElementById("playerLabel");
const timerEl = document.getElementById("timer");
const counterEl = document.getElementById("counter");
const boardEl = document.getElementById("board");
const statusText = document.getElementById("statusText");
const undoBtn = document.getElementById("undoBtn");
const restartBtn = document.getElementById("restartBtn");
const historyEl = document.getElementById("history");
const modal = document.getElementById("leaderboardModal");
const closeModal = document.getElementById("closeModal");
const leaderboardBody = document.querySelector("#leaderboardTable tbody");

const knightIcon = document.createElement("img");
knightIcon.src = KNIGHT_IMAGE_SRC;
knightIcon.alt = "Scaramiong";
knightIcon.className = "knight-icon";
knightIcon.onerror = () => {
  knightIcon.replaceWith(createFallbackKnightSpan());
};

function createFallbackKnightSpan() {
  const span = document.createElement("span");
  span.textContent = "♞";
  span.style.fontSize = "2rem";
  span.className = "knight-icon";
  span.id = "knightFallback";
  return span;
}

function getKnightElement() {
  return document.getElementById("knightFallback") || knightIcon;
}

function buildBoard() {
  boardEl.innerHTML = "";
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = `cell ${(r + c) % 2 === 0 ? "light" : "dark"}`;
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener("click", () => handleCellClick(r, c));
      boardEl.appendChild(cell);
    }
  }
}

function cellEl(r, c) {
  return boardEl.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
}

function notation(r, c) {
  const cols = "ABCDEFG";
  return `${cols[c]}${SIZE - r}`;
}

function isVisited(r, c) {
  return visited.some((p) => p.row === r && p.col === c);
}

function getValidMoves(r, c) {
  return KNIGHT_MOVES
    .map(([dr, dc]) => ({ row: r + dr, col: c + dc }))
    .filter(
      (p) =>
        p.row >= 0 && p.row < SIZE &&
        p.col >= 0 && p.col < SIZE &&
        !isVisited(p.row, p.col)
    );
}

function handleCellClick(r, c) {
  if (status === "idle") {
    placeKnight(r, c);
    return;
  }
  if (status !== "playing") return;

  const last = visited[visited.length - 1];
  const valid = getValidMoves(last.row, last.col);
  const isValid = valid.some((p) => p.row === r && p.col === c);
  if (!isValid) return;

  moveKnight(r, c);
}

function placeKnight(r, c) {
  visited = [{ row: r, col: c }];
  moveHistory = [notation(r, c)];
  status = "playing";
  startTime = Date.now();
  startTimer();
  render();
}

function moveKnight(r, c) {
  visited.push({ row: r, col: c });
  moveHistory.push(notation(r, c));

  if (visited.length === TOTAL_CELLS) {
    status = "won";
    stopTimer();
    saveScore();
  } else {
    const nextMoves = getValidMoves(r, c);
    if (nextMoves.length === 0) {
      status = "stuck";
      stopTimer();
      saveScore();
    }
  }
  render();
}

function undo() {
  if (status !== "playing" || visited.length === 0) return;
  if (visited.length === 1) {
    visited = [];
    moveHistory = [];
    status = "idle";
    stopTimer();
    render();
    return;
  }
  visited.pop();
  moveHistory.pop();
  render();
}

function restart() {
  visited = [];
  moveHistory = [];
  status = "idle";
  stopTimer();
  timerEl.textContent = "00:00";
  render();
}

function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    const sec = Math.floor((Date.now() - startTime) / 1000);
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    timerEl.textContent = `${m}:${s}`;
  }, 1000);
}
function stopTimer() {
  clearInterval(timerId);
}
function currentElapsedSeconds() {
  if (!startTime) return 0;
  return Math.floor((Date.now() - startTime) / 1000);
}

function render() {
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("valid-move", "visited");
    cell.removeAttribute("data-order");
  });

  visited.forEach((p, i) => {
    const cell = cellEl(p.row, p.col);
    cell.classList.add("visited");
    cell.dataset.order = i + 1;
  });

  if (visited.length > 0) {
    const last = visited[visited.length - 1];
    cellEl(last.row, last.col).appendChild(getKnightElement());
  }

  if (status === "playing") {
    const last = visited[visited.length - 1];
    getValidMoves(last.row, last.col).forEach((p) => {
      cellEl(p.row, p.col).classList.add("valid-move");
    });
  }

  counterEl.textContent = `${visited.length}/${TOTAL_CELLS}`;
  undoBtn.disabled = status !== "playing";

  if (status === "idle") statusText.textContent = "Click any square to place the Scaramiong.";
  if (status === "playing") statusText.textContent = "Click a highlighted square to move the Scaramiong.";
  if (status === "won") statusText.textContent = "🎉 Congratulations! Every square has been visited. Score recorded on the leaderboard.";
  if (status === "stuck") statusText.textContent = "The Scaramiong is stuck, no valid moves left. Score recorded on the leaderboard.";

  historyEl.innerHTML = moveHistory
    .map((m, i) => `${i + 1}.${m}`)
    .join(" &rarr; ");
}

async function saveScore() {
  try {
    await addDoc(scoresCollection, {
      name: playerName,
      squares: visited.length,
      completed: status === "won",
      time: currentElapsedSeconds(),
      date: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to save score:", err);
  }
}

async function loadLeaderboard() {
  try {
    const snap = await getDocs(scoresCollection);
    const data = snap.docs.map((d) => d.data());
    data.sort((a, b) => {
      if (a.completed !== b.completed) return b.completed - a.completed;
      if (a.completed) return a.time - b.time;
      return b.squares - a.squares || a.time - b.time;
    });
    return data;
  } catch (err) {
    console.error("Failed to load leaderboard:", err);
    return [];
  }
}

async function renderLeaderboard() {
  leaderboardBody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;
  const data = await loadLeaderboard();
  if (data.length === 0) {
    leaderboardBody.innerHTML = `<tr><td colspan="4">No scores yet.</td></tr>`;
    return;
  }
  leaderboardBody.innerHTML = data
    .slice(0, 20)
    .map(
      (e, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${e.name}</td>
        <td>${e.squares}/${TOTAL_CELLS} ${e.completed ? "✓" : ""}</td>
        <td>${String(Math.floor(e.time / 60)).padStart(2, "0")}:${String(e.time % 60).padStart(2, "0")}</td>
      </tr>`
    )
    .join("");
}

startBtn.addEventListener("click", () => {
  if (!nameInput.value.trim()) return;
  playerName = nameInput.value.trim();
  playerLabel.textContent = `Player: ${playerName}`;
  landingEl.classList.add("hidden");
  gameEl.classList.remove("hidden");
  buildBoard();
  render();
});

undoBtn.addEventListener("click", undo);
restartBtn.addEventListener("click", restart);

showBoardBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
  renderLeaderboard();
});
closeModal.addEventListener("click", () => modal.classList.add("hidden"));
