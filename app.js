const SCREEN_W = 1080;
const SCREEN_H = 2280;
const SAFE = { left: 170, top: 390, right: 880, bottom: 1130 };
const BOARD = { left: 92, top: 344, right: 987, bottom: 1238 };

const PHASES = ["lobby", "countdown", "choosing", "drawing", "guessing", "result"];
const PHASE_DURATION = {
  lobby: 0,
  countdown: 5,
  choosing: 10,
  drawing: 90,
  guessing: 90,
  result: 5,
};

const PALETTE = [
  { id: "black", label: "黑", color: "#000000", unlocked: true },
  { id: "white", label: "白", color: "#ffffff", unlocked: true },
  { id: "orange", label: "橙", color: "#ffa200", unlocked: true },
  { id: "red", label: "红", color: "#ee0a26", unlocked: true },
  { id: "blue", label: "蓝", color: "#148bfd", unlocked: true },
  { id: "green", label: "绿", color: "#66b502", unlocked: true },
  { id: "pink", label: "粉", color: "#ff818c", unlocked: true },
  { id: "peach", label: "肤", color: "#ffc3b0", unlocked: false },
  { id: "yellow", label: "黄", color: "#fdcb07", unlocked: true },
  { id: "deepOrange", label: "橘", color: "#ff6030", unlocked: false },
  { id: "brown", label: "棕", color: "#7e3300", unlocked: false },
  { id: "purple", label: "紫", color: "#c625e7", unlocked: true },
  { id: "gray", label: "灰", color: "#8b8b8b", unlocked: false },
  { id: "cream", label: "米", color: "#fff9d8", unlocked: false },
];

const WIDTHS = [4, 8, 12, 18, 26];
const WORD_BANK = [
  ["低筒袜", "彩色袜", "条纹袜"],
  ["婴儿车", "儿童雨伞", "智能手表"],
  ["冲浪", "滑翔", "花海"],
  ["菠萝糖", "杂粮煎饼", "蒜蓉扇贝"],
  ["奥林匹克", "结婚典礼", "外卖配送员"],
];

const svg = document.getElementById("drawLayer");
const phoneBg = document.querySelector(".phone-bg");
const codeEl = document.getElementById("code");
const runBtn = document.getElementById("runBtn");
const stopBtn = document.getElementById("stopBtn");
const clearBtn = document.getElementById("clearBtn");
const roomLabel = document.getElementById("roomLabel");
const wordInput = document.getElementById("wordInput");
const wordLabel = document.getElementById("word");
const timerLabel = document.getElementById("timer");
const brushSwatches = document.getElementById("brushSwatches");
const canvasSwatches = document.getElementById("canvasSwatches");
const widthChoices = document.getElementById("widthChoices");
const delayInput = document.getElementById("delayInput");
const speedInput = document.getElementById("speedInput");
const safeToggle = document.getElementById("safeToggle");
const gridToggle = document.getElementById("gridToggle");
const strokeCount = document.getElementById("strokeCount");
const timeEstimate = document.getElementById("timeEstimate");
const boundsReport = document.getElementById("boundsReport");
const statusText = document.getElementById("statusText");
const phaseSelect = document.getElementById("phaseSelect");
const painterSelect = document.getElementById("painterSelect");
const guessInput = document.getElementById("guessInput");
const readyBtn = document.getElementById("readyBtn");
const phoneReadyBtn = document.getElementById("phoneReadyBtn");
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const autoLoopToggle = document.getElementById("autoLoopToggle");
const lobbyTitle = document.getElementById("lobbyTitle");
const readyCount = document.getElementById("readyCount");
const choiceWords = document.getElementById("choiceWords");
const answerLine = document.getElementById("answerLine");
const scoreLine = document.getElementById("scoreLine");
const playersEl = document.getElementById("players");
const chatList = document.getElementById("chatList");
const phoneInput = document.getElementById("phoneInput");
const toolPen = document.getElementById("toolPen");
const toolPalette = document.getElementById("toolPalette");
const toolBucket = document.getElementById("toolBucket");
const toolUndo = document.getElementById("toolUndo");
const toolRedo = document.getElementById("toolRedo");

let strokes = [];
let redoStack = [];
let stopRequested = false;
let guides = [];
let selectedWidth = 8;
let canvasColor = "#ffffff";
let activeBrush = "black";
let activeCanvas = "white";
let autoTimer = null;

let brush = {
  color: "#000000",
  width: selectedWidth,
  duration: 150,
  delay: 55,
  cap: "round",
  join: "round",
  mode: "pen",
};

const game = {
  room: "3374893房",
  phase: "drawing",
  timer: 72,
  round: 1,
  painterIndex: 2,
  meIndex: 2,
  word: "低筒袜",
  category: "服饰",
  choices: ["低筒袜", "彩色袜", "条纹袜"],
  guessOrder: 0,
  chats: [],
  players: [
    { name: "绿野花仙", score: 0, ready: true, guessed: false, online: true, status: "" },
    { name: "宁紫紫", score: 0, ready: true, guessed: false, online: true, status: "" },
    { name: "安", score: 0, ready: true, guessed: false, online: true, status: "绘画中" },
    { name: "clen", score: 0, ready: true, guessed: false, online: true, status: "" },
    { name: "江宴", score: 0, ready: false, guessed: false, online: true, status: "" },
    { name: "空", score: 0, ready: false, guessed: false, online: false, status: "" },
  ],
};

const defaultCode = `setPhase("drawing", 72);
setWord("低筒袜", "服饰");
setCanvas("white");
setBrush({ duration: 160, delay: 55 });

// 复盘坐标与手机一致：1080 x 2280。建议安全区：x 170..880, y 390..1130。
pen("black", 10);
bez([275, 470], [250, 600], [285, 730], [370, 800], 18);
bez([570, 470], [545, 610], [585, 730], [675, 800], 18);
bez([275, 470], [370, 505], [500, 505], [570, 470], 18);
bez([370, 800], [435, 860], [585, 850], [675, 800], 18);

pen("red", 8);
sw(300, 560, 555, 560, 170);
pen("blue", 8);
sw(292, 610, 575, 610, 170);
pen("green", 8);
sw(304, 660, 595, 660, 170);
pen("yellow", 8);
sw(330, 710, 630, 710, 170);
pen("purple", 8);
sw(370, 760, 650, 760, 170);

pen("black", 7);
ell(315, 845, 95, 36, 20);
ell(650, 842, 100, 36, 20);
sw(400, 840, 570, 835, 170);
dot(850, 620, 5);`;

function ns(tag) {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function setStatus(text) {
  statusText.textContent = text;
}

function normalizeHex(value) {
  const text = String(value || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(text)) return text.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(text)) {
    return `#${text[1]}${text[1]}${text[2]}${text[2]}${text[3]}${text[3]}`.toLowerCase();
  }
  return "";
}

function hexToRgb(hex) {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function distance(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

function colorEntry(value, fallback = "black") {
  const text = String(value || "").trim().toLowerCase();
  const byName = PALETTE.find((item) => {
    return item.id.toLowerCase() === text || item.label === value || item.color.toLowerCase() === text;
  });
  if (byName) return byName.unlocked ? byName : PALETTE.find((item) => item.id === fallback) || PALETTE[0];

  const hex = normalizeHex(text);
  if (hex) {
    const target = hexToRgb(hex);
    return PALETTE.filter((item) => item.unlocked).reduce((best, item) => {
      return distance(target, hexToRgb(item.color)) < distance(target, hexToRgb(best.color)) ? item : best;
    }, PALETTE.find((item) => item.id === fallback) || PALETTE[0]);
  }

  const aliases = {
    红: "red",
    蓝: "blue",
    绿: "green",
    黄: "yellow",
    黑: "black",
    白: "white",
    紫: "purple",
    橙: "orange",
    粉: "pink",
    black: "black",
    white: "white",
    red: "red",
    blue: "blue",
    green: "green",
    yellow: "yellow",
    purple: "purple",
    orange: "orange",
    pink: "pink",
  };
  return PALETTE.find((item) => item.id === aliases[text]) || PALETTE.find((item) => item.id === fallback) || PALETTE[0];
}

function setWord(value, category = game.category) {
  const text = String(value || "").trim() || "复盘";
  game.word = text;
  game.category = String(category || "").trim() || `${text.length}个字`;
  wordInput.value = text;
  guessInput.value = text;
  renderGame();
}

function setTimer(seconds) {
  game.timer = Math.max(0, Number(seconds) || 0);
  renderGame();
}

function setPhase(phase, seconds) {
  const normalized = {
    准备: "lobby",
    倒计时: "countdown",
    选词: "choosing",
    我画: "drawing",
    作画: "drawing",
    别人画: "guessing",
    猜词: "guessing",
    结算: "result",
  }[phase] || phase;
  if (!PHASES.includes(normalized)) return;
  game.phase = normalized;
  game.timer = seconds === undefined ? PHASE_DURATION[normalized] : Math.max(0, Number(seconds) || 0);
  if (normalized === "choosing") resetRoundStatuses("选词中");
  if (normalized === "drawing" || normalized === "guessing") resetRoundStatuses("绘画中");
  renderGame();
}

function setChoices(words) {
  if (!Array.isArray(words) || !words.length) return;
  game.choices = words.slice(0, 3).map((word) => String(word || "").trim()).filter(Boolean);
  renderGame();
}

function setPainter(indexOrName) {
  const index = Number.isInteger(indexOrName)
    ? indexOrName
    : game.players.findIndex((player) => player.name === indexOrName);
  if (index < 0 || index >= game.players.length) return;
  game.painterIndex = index;
  game.players.forEach((player, i) => {
    player.status = i === index ? "绘画中" : "";
    player.guessed = false;
  });
  renderGame();
}

function setBrush(next = {}) {
  if (typeof next === "string") {
    pen(next, selectedWidth);
    return;
  }
  brush = { ...brush, ...next };
  if (next.color) {
    const entry = colorEntry(next.color, activeBrush);
    activeBrush = entry.id;
    brush.color = entry.color;
  }
  if (next.width) selectedWidth = Number(next.width) || selectedWidth;
  if (next.delay !== undefined) delayInput.value = String(next.delay);
  brush.width = Number(next.width || selectedWidth);
  renderToolControls();
}

function setCanvas(color = "white") {
  const entry = colorEntry(color, activeCanvas);
  activeCanvas = entry.id;
  canvasColor = entry.color;
  document.documentElement.style.setProperty("--paper-color", canvasColor);
  renderToolControls();
}

function eraser(width = 28) {
  brush = { ...brush, color: canvasColor, width, mode: "eraser" };
  setStatus("橡皮仅本地模拟");
}

function pen(color = activeBrush, width = selectedWidth) {
  const entry = colorEntry(color, activeBrush);
  activeBrush = entry.id;
  selectedWidth = Number(width) || selectedWidth;
  brush = { ...brush, color: entry.color, width: selectedWidth, mode: "pen" };
  renderToolControls();
}

function pointOutOfBounds([x, y]) {
  return x < SAFE.left || x > SAFE.right || y < SAFE.top || y > SAFE.bottom;
}

function pathData(points) {
  if (!points.length) return "";
  return points.map((p, i) => `${i ? "L" : "M"}${round(p[0])},${round(p[1])}`).join(" ");
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function addStroke(points, options = {}) {
  const clean = points
    .filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))
    .map(([x, y]) => [Number(x), Number(y)]);
  if (clean.length < 2) return;
  strokes.push({
    points: clean,
    color: options.color || brush.color,
    width: Number(options.width || brush.width),
    duration: Math.max(Number(options.duration || brush.duration), 1),
    delay: Math.max(Number(options.delay ?? brush.delay), 0),
    cap: brush.cap,
    join: brush.join,
    oob: clean.some(pointOutOfBounds),
    mode: brush.mode,
  });
  redoStack = [];
}

function sw(x1, y1, x2, y2, ms = brush.duration) {
  addStroke(
    [
      [x1, y1],
      [x2, y2],
    ],
    { duration: ms },
  );
}

const swipe = sw;
const line = sw;

function poly(points, close = false, ms = brush.duration) {
  const pts = close ? [...points, points[0]] : points;
  for (let i = 0; i < pts.length - 1; i += 1) {
    addStroke([pts[i], pts[i + 1]], { duration: ms });
  }
}

function polygon(points, ms = brush.duration) {
  poly(points, true, ms);
}

function ell(cx, cy, rx, ry, steps = 16, start = 0, end = Math.PI * 2, ms = brush.duration) {
  const pts = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = start + ((end - start) * i) / steps;
    pts.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]);
  }
  addStroke(pts, { duration: ms });
}

const ellipse = ell;

function bez(p0, p1, p2, p3, steps = 10, ms = brush.duration) {
  const pts = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
      u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
    ]);
  }
  addStroke(pts, { duration: ms });
}

const bezier = bez;

function dot(cx, cy, r = 5, steps = 8) {
  ell(cx, cy, r, r, steps, 0, Math.PI * 2, Math.max(brush.duration * 0.8, 80));
}

function star(cx, cy, scale = 1) {
  poly(
    [
      [cx, cy - 28 * scale],
      [cx + 8 * scale, cy - 8 * scale],
      [cx + 30 * scale, cy],
      [cx + 8 * scale, cy + 8 * scale],
      [cx, cy + 30 * scale],
      [cx - 8 * scale, cy + 8 * scale],
      [cx - 30 * scale, cy],
      [cx - 8 * scale, cy - 8 * scale],
    ],
    true,
    Math.max(brush.duration * 0.85, 90),
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function addChat(name, text) {
  game.chats.push({ name, text });
  game.chats = game.chats.slice(-9);
  renderChat();
}

function readyTotal() {
  return game.players.filter((player) => player.ready && player.online).length;
}

function resetRoundStatuses(status = "") {
  game.guessOrder = 0;
  game.players.forEach((player, index) => {
    player.guessed = false;
    player.status = index === game.painterIndex ? status : "";
  });
}

function chooseWord(word) {
  setWord(word, `${String(word).length}个字`);
  clearDrawing(false);
  resetRoundStatuses("绘画中");
  const painter = game.players[game.painterIndex];
  addChat("小总管", `${painter.name}开始画了，提示：${game.word.length}个字`);
  addChat("小总管", `提示：${game.category}`);
  game.phase = game.painterIndex === game.meIndex ? "drawing" : "guessing";
  game.timer = PHASE_DURATION.drawing;
  renderGame();
}

function showResult(addMessage = true) {
  game.phase = "result";
  game.timer = PHASE_DURATION.result;
  const guessed = game.players.filter((player) => player.guessed).length;
  const painter = game.players[game.painterIndex];
  const painterScore = Math.min(4, guessed + 1);
  if (addMessage) {
    painter.score += painterScore;
    painter.status = `+ ${painterScore}`;
    addChat("小总管", `答案是【${game.word}】。有${guessed}个人猜中，${painter.name}加${painterScore}分`);
  }
  renderGame();
}

function submitGuess(value) {
  const text = String(value || "").trim();
  if (!text || game.phase !== "guessing") return;
  const next = game.players.find((player, index) => index !== game.painterIndex && player.online && !player.guessed);
  if (!next) return;
  if (text === game.word) {
    game.guessOrder += 1;
    const score = Math.max(2, 6 - game.guessOrder);
    next.guessed = true;
    next.score += score;
    next.status = `+ ${score}`;
    addChat(next.name, "**");
    if (game.players.filter((player, index) => index !== game.painterIndex && player.online && !player.guessed).length === 0) {
      game.timer = Math.min(game.timer, 10);
      addChat("小总管", "时间调整为10S，加油！");
    }
  } else {
    addChat(next.name, text);
  }
  renderGame();
}

function nextRound() {
  game.round += 1;
  game.painterIndex = (game.painterIndex + 1) % game.players.length;
  if (!game.players[game.painterIndex].online) game.painterIndex = (game.painterIndex + 1) % game.players.length;
  game.choices = WORD_BANK[game.round % WORD_BANK.length];
  resetRoundStatuses("选词中");
  game.phase = "choosing";
  game.timer = PHASE_DURATION.choosing;
  addChat("小总管", `${game.players[game.painterIndex].name}正在选词中`);
  renderGame();
}

function advancePhase() {
  if (game.phase === "lobby") {
    if (readyTotal() >= 4) setPhase("countdown");
    return;
  }
  if (game.phase === "countdown") {
    setPhase("choosing");
    addChat("小总管", `${game.players[game.painterIndex].name}正在选词中`);
    return;
  }
  if (game.phase === "choosing") {
    chooseWord(game.choices[0]);
    return;
  }
  if (game.phase === "drawing" || game.phase === "guessing") {
    showResult(true);
    return;
  }
  if (game.phase === "result") nextRound();
}

function setAutoLoop(enabled) {
  if (autoTimer) {
    window.clearInterval(autoTimer);
    autoTimer = null;
  }
  if (!enabled) return;
  autoTimer = window.setInterval(() => {
    if (!["countdown", "choosing", "drawing", "guessing", "result"].includes(game.phase)) return;
    if (game.timer > 0) {
      game.timer -= 1;
      renderGame();
    } else {
      advancePhase();
    }
  }, 1000);
}

function clearDrawing(update = true) {
  stopRequested = true;
  strokes = [];
  redoStack = [];
  [...svg.querySelectorAll(".stroke")].forEach((node) => node.remove());
  if (update) {
    updateStats();
    setStatus("已清空");
  }
}

function undoStroke() {
  const stroke = strokes.pop();
  if (!stroke) return;
  redoStack.push(stroke);
  renderStrokes(false);
  updateStats();
}

function redoStroke() {
  const stroke = redoStack.pop();
  if (!stroke) return;
  strokes.push(stroke);
  renderStrokes(false);
  updateStats();
}

function renderGuides() {
  guides.forEach((node) => node.remove());
  guides = [];
  if (gridToggle.checked) {
    for (let x = 200; x <= 900; x += 100) addGuideLine(x, BOARD.top, x, BOARD.bottom, "#d7dee6", 1, "4 10");
    for (let y = 400; y <= 1200; y += 100) addGuideLine(BOARD.left, y, BOARD.right, y, "#d7dee6", 1, "4 10");
  }
  if (safeToggle.checked) {
    const rect = ns("rect");
    rect.setAttribute("x", SAFE.left);
    rect.setAttribute("y", SAFE.top);
    rect.setAttribute("width", SAFE.right - SAFE.left);
    rect.setAttribute("height", SAFE.bottom - SAFE.top);
    rect.setAttribute("fill", "none");
    rect.setAttribute("stroke", "#22a06b");
    rect.setAttribute("stroke-width", "3");
    rect.setAttribute("stroke-dasharray", "16 12");
    rect.setAttribute("opacity", "0.75");
    rect.classList.add("guide");
    svg.appendChild(rect);
    guides.push(rect);
  }
}

function addGuideLine(x1, y1, x2, y2, color, width, dash) {
  const path = ns("path");
  path.setAttribute("d", `M${x1},${y1} L${x2},${y2}`);
  path.setAttribute("stroke", color);
  path.setAttribute("stroke-width", width);
  path.setAttribute("stroke-dasharray", dash);
  path.setAttribute("fill", "none");
  path.classList.add("guide");
  svg.appendChild(path);
  guides.push(path);
}

function appendPath(stroke, animate) {
  const path = ns("path");
  path.classList.add("stroke");
  path.setAttribute("d", pathData(stroke.points));
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", stroke.color);
  path.setAttribute("stroke-width", stroke.width);
  path.setAttribute("stroke-linecap", stroke.cap);
  path.setAttribute("stroke-linejoin", stroke.join);
  svg.appendChild(path);
  if (animate) {
    const length = Math.max(path.getTotalLength(), 1);
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    path.getBoundingClientRect();
    const speed = Number(speedInput.value) || 1;
    path.style.transition = `stroke-dashoffset ${Math.max(stroke.duration / speed, 25)}ms linear`;
    path.style.strokeDashoffset = "0";
  }
  return path;
}

function renderStrokes(animate) {
  [...svg.querySelectorAll(".stroke")].forEach((node) => node.remove());
  for (const stroke of strokes) appendPath(stroke, animate);
}

async function play() {
  stopRequested = false;
  [...svg.querySelectorAll(".stroke")].forEach((node) => node.remove());
  setStatus("绘制中");
  const speed = Number(speedInput.value) || 1;
  for (const stroke of strokes) {
    if (stopRequested) break;
    appendPath(stroke, true);
    await sleep((stroke.duration + stroke.delay) / speed);
  }
  setStatus(stopRequested ? "已停止" : "完成");
}

function updateStats() {
  const total = strokes.reduce((sum, s) => sum + s.duration + s.delay, 0);
  const oob = strokes.filter((s) => s.oob).length;
  strokeCount.textContent = String(strokes.length);
  timeEstimate.textContent = `${(total / 1000).toFixed(1)}s`;
  boundsReport.textContent = oob ? `${oob} 笔越界` : "正常";
  boundsReport.style.color = oob ? "#c0362c" : "#1f7a4d";
}

function phaseText() {
  const painter = game.players[game.painterIndex];
  if (game.phase === "lobby") return "准备";
  if (game.phase === "countdown") return `${readyTotal()}人准备`;
  if (game.phase === "choosing") return "选词中";
  if (game.phase === "drawing") return game.word;
  if (game.phase === "guessing") return `${game.word.length}个字 ${game.category}`;
  if (game.phase === "result") return `答案 ${game.word}`;
  return painter.name;
}

function renderGame() {
  PHASES.forEach((phase) => phoneBg.classList.remove(phase));
  phoneBg.classList.add(game.phase);
  roomLabel.textContent = game.room;
  timerLabel.textContent = String(game.timer);
  wordLabel.textContent = phaseText();
  wordInput.value = game.word;
  phaseSelect.value = game.phase;
  painterSelect.value = String(game.painterIndex);
  readyCount.textContent = `${readyTotal()}/6 已准备`;
  lobbyTitle.textContent = game.phase === "countdown" ? "准备完成，开始倒计时" : "等待准备";
  phoneReadyBtn.textContent = game.players[game.meIndex].ready ? "取消准备" : "准备";
  answerLine.textContent = `答案：${game.word}`;
  scoreLine.textContent = `${game.players.filter((player) => player.guessed).length} 人猜中`;

  choiceWords.innerHTML = "";
  game.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = choice;
    button.addEventListener("click", () => chooseWord(choice));
    choiceWords.appendChild(button);
  });

  renderPlayers();
  renderChat();
  renderPhoneInput();
  renderToolState();
}

function renderPlayers() {
  playersEl.innerHTML = "";
  game.players.forEach((player, index) => {
    const item = document.createElement("div");
    item.className = [
      index === game.painterIndex ? "painter" : "",
      player.ready ? "ready" : "",
      player.guessed ? "guessed" : "",
      player.online ? "" : "offline",
    ]
      .filter(Boolean)
      .join(" ");
    if (player.status) {
      const status = document.createElement("em");
      status.textContent = player.status;
      item.appendChild(status);
    }
    const avatar = document.createElement("i");
    const score = document.createElement("b");
    const name = document.createElement("span");
    score.textContent = String(player.score);
    name.textContent = player.name;
    item.append(avatar, score, name);
    playersEl.appendChild(item);
  });
}

function renderChat() {
  chatList.innerHTML = "";
  const chats = game.chats.length
    ? game.chats
    : [
        { name: "小总管", text: "4人准备后开始游戏" },
        { name: "小总管", text: "按从左到右顺序选词作画" },
      ];
  chats.slice(-7).forEach((chat) => {
    const line = document.createElement("p");
    const name = document.createElement("b");
    name.textContent = `${chat.name}：`;
    line.append(name, document.createTextNode(chat.text));
    chatList.appendChild(line);
  });
}

function renderPhoneInput() {
  const value = {
    lobby: "准备后等待开始",
    countdown: "准备完成，等待开局",
    choosing: "选词中不能发言",
    drawing: "绘画中不能发言",
    guessing: "按字数输入答案",
    result: "本轮结束，等待下一轮",
  }[game.phase];
  phoneInput.firstChild.nodeValue = `${value} `;
}

function renderToolState() {
  document.documentElement.style.setProperty("--brush-color", brush.color);
  toolPen.classList.toggle("active", brush.mode === "pen");
  toolPalette.classList.toggle("active", true);
  toolBucket.classList.toggle("active", false);
}

function renderToolControls() {
  brushSwatches.innerHTML = "";
  canvasSwatches.innerHTML = "";
  PALETTE.forEach((entry) => {
    brushSwatches.appendChild(makeSwatch(entry, "brush"));
    canvasSwatches.appendChild(makeSwatch(entry, "canvas"));
  });

  widthChoices.innerHTML = "";
  WIDTHS.forEach((width) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `width-choice${selectedWidth === width ? " active" : ""}`;
    button.style.setProperty("--dot-size", `${Math.max(4, width * 0.75)}px`);
    button.title = `${width}px`;
    button.addEventListener("click", () => {
      selectedWidth = width;
      brush.width = width;
      renderToolControls();
    });
    widthChoices.appendChild(button);
  });

  renderToolState();
}

function makeSwatch(entry, target) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = [
    "swatch",
    target === "brush" && activeBrush === entry.id ? "active" : "",
    target === "canvas" && activeCanvas === entry.id ? "active" : "",
    entry.unlocked ? "" : "locked",
  ]
    .filter(Boolean)
    .join(" ");
  button.style.background = entry.color;
  button.title = entry.unlocked ? `${entry.label} ${entry.id}` : `${entry.label} 未解锁`;
  button.disabled = !entry.unlocked;
  button.addEventListener("click", () => {
    if (target === "brush") pen(entry.id, selectedWidth);
    if (target === "canvas") setCanvas(entry.id);
  });
  return button;
}

function renderPainterOptions() {
  painterSelect.innerHTML = "";
  game.players.forEach((player, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${index + 1}. ${player.name}`;
    painterSelect.appendChild(option);
  });
}

function getApi() {
  return {
    SCREEN_W,
    SCREEN_H,
    SAFE,
    BOARD,
    PALETTE: PALETTE.filter((item) => item.unlocked).map(({ id, label, color }) => ({ id, label, color })),
    WIDTHS,
    game,
    setWord,
    setPhase,
    setTimer,
    setChoices,
    setPainter,
    setBrush,
    setCanvas,
    eraser,
    pen,
    sw,
    swipe,
    line,
    poly,
    polygon,
    ell,
    ellipse,
    bez,
    bezier,
    dot,
    star,
    sleep,
    say: addChat,
    Math,
  };
}

async function runCode() {
  stopRequested = true;
  [...svg.querySelectorAll(".stroke")].forEach((node) => node.remove());
  strokes = [];
  redoStack = [];
  brush = {
    color: colorEntry(activeBrush).color,
    width: selectedWidth,
    duration: 150,
    delay: Number(delayInput.value) || 0,
    cap: "round",
    join: "round",
    mode: "pen",
  };
  setCanvas(activeCanvas);
  setWord(wordInput.value, game.category);
  if (["lobby", "countdown", "choosing", "result"].includes(game.phase)) {
    game.phase = "drawing";
    game.timer = PHASE_DURATION.drawing;
  }
  setStatus("解析中");
  try {
    const api = getApi();
    const names = Object.keys(api);
    const values = Object.values(api);
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction(...names, `"use strict";\n${codeEl.value}`);
    await fn(...values);
    updateStats();
    renderGame();
    await play();
  } catch (error) {
    setStatus("代码错误");
    console.error(error);
    alert(error.message || String(error));
  }
}

function bindEvents() {
  runBtn.addEventListener("click", runCode);
  stopBtn.addEventListener("click", () => {
    stopRequested = true;
    setStatus("已停止");
  });
  clearBtn.addEventListener("click", () => clearDrawing(true));
  safeToggle.addEventListener("change", renderGuides);
  gridToggle.addEventListener("change", renderGuides);
  wordInput.addEventListener("input", () => setWord(wordInput.value, game.category));
  delayInput.addEventListener("input", () => {
    brush.delay = Number(delayInput.value) || 0;
  });
  phaseSelect.addEventListener("change", () => setPhase(phaseSelect.value));
  painterSelect.addEventListener("change", () => setPainter(Number(painterSelect.value)));
  readyBtn.addEventListener("click", toggleReady);
  phoneReadyBtn.addEventListener("click", toggleReady);
  startBtn.addEventListener("click", () => {
    game.players.forEach((player, index) => {
      player.ready = index < 4 || player.ready;
    });
    setPhase("countdown");
    autoLoopToggle.checked = true;
    setAutoLoop(true);
    addChat("小总管", "4人已准备，游戏即将开始");
  });
  nextBtn.addEventListener("click", nextRound);
  autoLoopToggle.addEventListener("change", () => setAutoLoop(autoLoopToggle.checked));
  guessInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") submitGuess(guessInput.value);
  });
  toolUndo.addEventListener("click", undoStroke);
  toolRedo.addEventListener("click", redoStroke);
}

function toggleReady() {
  const me = game.players[game.meIndex];
  me.ready = !me.ready;
  me.status = me.ready ? "已准备" : "";
  addChat("小总管", `${me.name}${me.ready ? "已准备" : "取消准备"}`);
  if (readyTotal() >= 4 && game.phase === "lobby") setPhase("countdown");
  renderGame();
}

function init() {
  codeEl.value = defaultCode;
  addChat("小总管", "安开始画了，提示：3个字");
  addChat("小总管", "提示：服饰");
  renderPainterOptions();
  renderToolControls();
  renderGuides();
  setCanvas("white");
  pen("black", 8);
  setWord(game.word, game.category);
  renderGame();
  updateStats();
  bindEvents();
  if (new URLSearchParams(window.location.search).get("autorun") === "1") {
    window.setTimeout(() => runCode(), 80);
  }
}

init();
