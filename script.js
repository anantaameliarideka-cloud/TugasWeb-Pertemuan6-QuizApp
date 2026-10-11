"use strict";

/* ---------------- DATA ---------------- */
const QUESTION_BANK = [
  { category: "HTML", question: "Tag HTML apa yang digunakan untuk membuat link ke halaman lain?", options: ["<link>", "<a>", "<href>", "<nav>"], correct: 1 },
  { category: "CSS", question: "Properti CSS mana yang mengatur jarak di luar sebuah elemen?", options: ["padding", "border", "margin", "spacing"], correct: 2 },
  { category: "JavaScript", question: "Fungsi mana yang digunakan untuk memilih satu elemen berdasarkan ID di JavaScript?", options: ["document.getElementById()", "document.query()", "document.findById()", "document.selectId()"], correct: 0 },
  { category: "CSS", question: "Nilai display apa yang membuat elemen tersusun berdampingan secara fleksibel dalam satu baris/kolom?", options: ["block", "inline", "flex", "static"], correct: 2 },
  { category: "JavaScript", question: "Apa nama teknik menempelkan satu event listener di elemen induk untuk menangani event dari banyak elemen anak?", options: ["Event bubbling", "Event delegation", "Event capturing", "Event binding"], correct: 1 },
  { category: "Web Concepts", question: "Apa kepanjangan dari API dalam konteks pengembangan web?", options: ["Application Programming Interface", "Automated Program Instruction", "Applied Protocol Integration", "Application Process Index"], correct: 0 },
  { category: "HTML", question: "Atribut apa yang wajib diisi pada tag <img> untuk aksesibilitas dan SEO?", options: ["src saja", "alt", "title saja", "loading"], correct: 1 },
  { category: "Web Concepts", question: "Penyimpanan browser mana yang datanya tetap ada meskipun tab/browser ditutup?", options: ["sessionStorage", "cookies saja", "localStorage", "memory cache"], correct: 2 },
  { category: "JavaScript", question: "Method array mana yang digunakan untuk membuat array baru hasil transformasi tiap elemen?", options: ["forEach()", "map()", "filter()", "reduce()"], correct: 1 },
  { category: "CSS", question: "Bagaimana cara memilih elemen berdasarkan class di CSS?", options: [".nama-class", "#nama-class", "*nama-class", "&nama-class"], correct: 0 }
];

const TIME_PER_QUESTION = 15;
const HIGHSCORE_KEY = "quizWebDev_highScore";
const THEME_KEY = "quizWebDev_theme";

/* ---------------- STATE ---------------- */
let quizOrder = [];
let currentIndex = 0;
let score = 0;
let timerId = null;
let timeLeft = TIME_PER_QUESTION;
let answerLocked = false;

const CATEGORY_ICONS = {
  "HTML": "📄",
  "CSS": "🎨",
  "JavaScript": "⚙️",
  "Web Concepts": "🌐"
};

/* ---------------- ELEMENTS ---------------- */
const screens = {
  start: document.getElementById("start-screen"),
  quiz: document.getElementById("quiz-screen"),
  result: document.getElementById("result-screen")
};
const startHighscoreEl = document.getElementById("start-highscore");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const progressFill = document.getElementById("progress-fill");
const categoryPill = document.getElementById("category-pill");
const timerText = document.getElementById("timer-text");
const timerRing = document.getElementById("timer-ring");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const questionCount = document.getElementById("question-count");
const finalScore = document.getElementById("final-score");
const finalPercent = document.getElementById("final-percent");
const highscoreBanner = document.getElementById("highscore-banner");
const themeToggle = document.getElementById("theme-toggle");
const visualIcon = document.getElementById("visual-icon");
const visualCategory = document.getElementById("visual-category");
const visualCurrent = document.getElementById("visual-current");
const visualTotal = document.getElementById("visual-total");
const visualScore = document.getElementById("visual-score");

/* ---------------- SPA NAVIGATION ---------------- */
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

/* ---------------- HIGH SCORE (localStorage) ---------------- */
function getHighScore() {
  try {
    const val = localStorage.getItem(HIGHSCORE_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch (e) {
    return 0;
  }
}

function saveHighScoreIfBetter(newScore) {
  const current = getHighScore();
  if (newScore > current) {
    try { localStorage.setItem(HIGHSCORE_KEY, String(newScore)); } catch (e) {}
    return true;
  }
  return false;
}

/* ---------------- SHUFFLE ---------------- */
function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ---------------- QUIZ FLOW ---------------- */
function startQuiz() {
  quizOrder = shuffle(QUESTION_BANK);
  currentIndex = 0;
  score = 0;
  showScreen("quiz");
  renderQuestion();
}

function renderQuestion() {
  answerLocked = false;
  const q = quizOrder[currentIndex];

  const progressPct = (currentIndex / quizOrder.length) * 100;
  progressFill.style.width = progressPct + "%";
  questionCount.textContent = "Soal " + (currentIndex + 1) + " dari " + quizOrder.length;
  categoryPill.textContent = q.category;

  // panel visual di sisi kanan
  visualIcon.textContent = CATEGORY_ICONS[q.category] || "❓";
  visualCategory.textContent = q.category;
  visualCurrent.textContent = String(currentIndex + 1);
  visualTotal.textContent = String(quizOrder.length);
  visualScore.textContent = String(score);

  // createElement / textContent, bukan innerHTML
  questionText.textContent = q.question;

  while (optionsContainer.firstChild) {
    optionsContainer.removeChild(optionsContainer.firstChild);
  }

  q.options.forEach((optionLabel, idx) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.type = "button";
    btn.dataset.index = String(idx);
    btn.textContent = optionLabel;
    optionsContainer.appendChild(btn);
  });

  startTimer();
}

/* ---------------- EVENT DELEGATION ---------------- */
optionsContainer.addEventListener("click", function (event) {
  const btn = event.target.closest(".option-btn");
  if (!btn || answerLocked) return;
  handleAnswer(parseInt(btn.dataset.index, 10));
});

function handleAnswer(selectedIndex) {
  answerLocked = true;
  clearInterval(timerId);

  const q = quizOrder[currentIndex];
  const buttons = optionsContainer.querySelectorAll(".option-btn");

  buttons.forEach(b => b.disabled = true);

  buttons[q.correct].classList.add("correct");
  if (selectedIndex !== -1 && selectedIndex !== q.correct) {
    buttons[selectedIndex].classList.add("wrong");
  }

  if (selectedIndex === q.correct) score++;
  visualScore.textContent = String(score);

  setTimeout(nextQuestion, 850);
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex < quizOrder.length) {
    renderQuestion();
  } else {
    finishQuiz();
  }
}

function startTimer() {
  timeLeft = TIME_PER_QUESTION;
  timerText.textContent = timeLeft + "s";
  timerRing.style.background = "var(--amber)";
  clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft--;
    timerText.textContent = Math.max(timeLeft, 0) + "s";
    if (timeLeft <= 5) timerRing.style.background = "var(--wrong)";
    if (timeLeft <= 0) {
      clearInterval(timerId);
      handleAnswer(-1);
    }
  }, 1000);
}

function finishQuiz() {
  progressFill.style.width = "100%";
  const total = quizOrder.length;
  finalScore.textContent = score + " / " + total;
  finalPercent.textContent = Math.round((score / total) * 100) + "% jawaban benar";

  const isNewHighScore = saveHighScoreIfBetter(score);
  if (isNewHighScore) {
    highscoreBanner.style.display = "block";
    highscoreBanner.textContent = "🏆 High score baru! " + score + " poin jadi rekor kamu.";
  } else {
    highscoreBanner.style.display = "block";
    highscoreBanner.textContent = "High score saat ini: " + getHighScore() + " / " + total;
  }

  startHighscoreEl.textContent = getHighScore();
  showScreen("result");
}

/* ---------------- RESTART ---------------- */
restartBtn.addEventListener("click", startQuiz);
startBtn.addEventListener("click", startQuiz);

/* ---------------- DARK MODE TOGGLE ---------------- */
function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggle.textContent = "☀️";
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    themeToggle.textContent = "🌙";
  }
}

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  if (saved) {
    applyTheme(saved);
  } else {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }
}

themeToggle.addEventListener("click", function () {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
});

/* ---------------- INIT ---------------- */
function init() {
  initTheme();
  startHighscoreEl.textContent = getHighScore();
  showScreen("start");
}

init();