const canvas = document.getElementById("game-board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const overlay = document.getElementById("overlay");
const messageEl = document.getElementById("message");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");

const tileCount = 24;
const tileSize = canvas.width / tileCount;
const gameSpeedMs = 105;
const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

let snake;
let food;
let direction;
let queuedDirection;
let score;
let bestScore = Number(localStorage.getItem("classic-snake-best") || 0);
let gameTimer = null;
let state = "ready";

bestScoreEl.textContent = bestScore;
resetGame();
draw();

function resetGame() {
  snake = [
    { x: 11, y: 12 },
    { x: 10, y: 12 },
    { x: 9, y: 12 },
  ];
  direction = directions.right;
  queuedDirection = directions.right;
  score = 0;
  scoreEl.textContent = score;
  food = placeFood();
}

function startGame() {
  if (state === "running") {
    return;
  }

  if (state === "game-over" || state === "ready") {
    resetGame();
  }

  state = "running";
  overlay.classList.add("hidden");
  pauseButton.textContent = "II";
  pauseButton.setAttribute("aria-label", "Pause game");
  clearInterval(gameTimer);
  gameTimer = setInterval(tick, gameSpeedMs);
  draw();
}

function pauseGame() {
  if (state !== "running") {
    return;
  }

  state = "paused";
  clearInterval(gameTimer);
  messageEl.textContent = "Paused";
  startButton.textContent = "Resume";
  overlay.classList.remove("hidden");
  pauseButton.textContent = "▶";
  pauseButton.setAttribute("aria-label", "Resume game");
}

function resumeGame() {
  if (state !== "paused") {
    return;
  }

  state = "running";
  overlay.classList.add("hidden");
  pauseButton.textContent = "II";
  pauseButton.setAttribute("aria-label", "Pause game");
  clearInterval(gameTimer);
  gameTimer = setInterval(tick, gameSpeedMs);
}

function endGame() {
  state = "game-over";
  clearInterval(gameTimer);
  bestScore = Math.max(bestScore, score);
  localStorage.setItem("classic-snake-best", bestScore);
  bestScoreEl.textContent = bestScore;
  messageEl.textContent = `Game over. Score: ${score}`;
  startButton.textContent = "Play again";
  overlay.classList.remove("hidden");
}

function tick() {
  direction = queuedDirection;
  const head = snake[0];
  const nextHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };

  const hitWall =
    nextHead.x < 0 ||
    nextHead.x >= tileCount ||
    nextHead.y < 0 ||
    nextHead.y >= tileCount;
  const hitSelf = snake.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);

  if (hitWall || hitSelf) {
    endGame();
    draw();
    return;
  }

  snake.unshift(nextHead);

  if (nextHead.x === food.x && nextHead.y === food.y) {
    score += 10;
    scoreEl.textContent = score;
    food = placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function placeFood() {
  let candidate;

  do {
    candidate = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
  } while (snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y));

  return candidate;
}

function draw() {
  ctx.fillStyle = "#18201d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawFood();
  drawSnake();
}

function drawGrid() {
  ctx.strokeStyle = "#26312d";
  ctx.lineWidth = 1;

  for (let i = 1; i < tileCount; i += 1) {
    const position = i * tileSize;
    ctx.beginPath();
    ctx.moveTo(position, 0);
    ctx.lineTo(position, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, position);
    ctx.lineTo(canvas.width, position);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? "#b4f8c8" : "#6ee787";
    roundRect(
      segment.x * tileSize + 2,
      segment.y * tileSize + 2,
      tileSize - 4,
      tileSize - 4,
      5
    );
  });
}

function drawFood() {
  ctx.fillStyle = "#ff5c7a";
  ctx.beginPath();
  ctx.arc(
    food.x * tileSize + tileSize / 2,
    food.y * tileSize + tileSize / 2,
    tileSize * 0.34,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function queueDirection(nextDirection) {
  const requested = directions[nextDirection];

  if (!requested || state !== "running") {
    return;
  }

  const reversing =
    requested.x + direction.x === 0 &&
    requested.y + direction.y === 0;

  if (!reversing) {
    queuedDirection = requested;
  }
}

document.addEventListener("keydown", (event) => {
  const keyMap = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
  };

  if (keyMap[event.key]) {
    event.preventDefault();
    queueDirection(keyMap[event.key]);
  }

  if (event.key === " ") {
    event.preventDefault();
    if (state === "running") {
      pauseGame();
    } else if (state === "paused") {
      resumeGame();
    } else {
      startGame();
    }
  }
});

document.querySelectorAll("[data-direction]").forEach((button) => {
  button.addEventListener("click", () => queueDirection(button.dataset.direction));
});

startButton.addEventListener("click", () => {
  if (state === "paused") {
    resumeGame();
  } else {
    startGame();
  }
});

pauseButton.addEventListener("click", () => {
  if (state === "running") {
    pauseGame();
  } else if (state === "paused") {
    resumeGame();
  }
});
