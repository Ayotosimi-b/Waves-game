// ---- Game state ----
let playerHP = 100;
let enemyHP = 100;
const maxHP = 100;
let score = 0;
let battleOver = false;

// How effective each move is against this enemy (E. Coli the Ogre)
// 2 = super effective, 1 = normal, 0.5 = not very effective
const effectiveness = {
  filter: 1,
  disinfect: 2,
  boil: 0.5
};

const effectivenessText = {
  filter: "was effective.",
  disinfect: "was super effective!",
  boil: "wasn't very effective..."
};

const baseDamage = 15;
const enemyDamageRange = { min: 8, max: 12 };
const winReward = 50;
const scorePenalty = 5; // coins lost each time the enemy lands a hit
const startingTime = 60; // seconds

// ---- DOM references ----
const enemyHPBar = document.getElementById("enemyHPBar");
const playerHPBar = document.getElementById("playerHPBar");
const feedbackText = document.getElementById("feedbackText");
const scoreDisplay = document.getElementById("scoreDisplay");
const timerDisplay = document.getElementById("timerDisplay");
const winBanner = document.getElementById("winBanner");
const resetBtn = document.getElementById("resetBtn");
const moveButtons = document.querySelectorAll(".move-btn");
const confettiContainer = document.getElementById("confettiContainer");

const confettiColors = ["#FFC907", "#2E9DF7", "#FF902A", "#4FCB53", "#F5402C"];

// ---- Timer state ----
let timeLeft = startingTime;
let timerInterval = null;

// ---- Helpers ----
function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function updateBars() {
  enemyHPBar.value = Math.max(enemyHP, 0);
  playerHPBar.value = Math.max(playerHP, 0);
}

function setButtonsEnabled(enabled) {
  moveButtons.forEach((btn) => (btn.disabled = !enabled));
}

function updateScore(amount) {
  score = Math.max(score + amount, 0);
  scoreDisplay.textContent = score;
}

// ---- Timer (core requirement) ----
function startTimer() {
  clearInterval(timerInterval);
  timeLeft = startingTime;
  timerDisplay.textContent = timeLeft;
  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      if (!battleOver) {
        timeUp();
      }
    }
  }, 1000);
}

function timeUp() {
  battleOver = true;
  feedbackText.textContent = "Time's up! The well stays contaminated.";
  setButtonsEnabled(false);
}

// ---- Confetti (Celebrate Wins LevelUp) ----
function launchConfetti() {
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("div");
    piece.classList.add("confetti-piece");
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background =
      confettiColors[Math.floor(Math.random() * confettiColors.length)];
    piece.style.animationDuration = 2 + Math.random() * 1.5 + "s";
    piece.style.animationDelay = Math.random() * 0.3 + "s";
    confettiContainer.appendChild(piece);
  }
  setTimeout(() => {
    confettiContainer.innerHTML = "";
  }, 4000);
}

// ---- Core battle logic ----
function handleAttack(move) {
  if (battleOver) return;

  // Player's turn
  const multiplier = effectiveness[move];
  const damage = Math.round(baseDamage * multiplier);
  enemyHP -= damage;

  const message = `${capitalize(move)} ${effectivenessText[move]}`;

  if (enemyHP <= 0) {
    enemyHP = 0;
    updateBars();
    feedbackText.textContent = message;
    winBattle();
    return;
  }

  // Enemy's turn (only if it's still standing).
  // Challenge LevelUp: getting hit costs the player coins, not just HP.
  const incoming = randomRange(enemyDamageRange.min, enemyDamageRange.max);
  playerHP -= incoming;
  updateScore(-scorePenalty);
  updateBars();
  feedbackText.textContent = `${message} Enemy hits back for ${incoming} (-${scorePenalty} coins).`;

  if (playerHP <= 0) {
    playerHP = 0;
    updateBars();
    loseBattle();
  }
}

function winBattle() {
  battleOver = true;
  clearInterval(timerInterval);
  updateScore(winReward);
  setButtonsEnabled(false);
  winBanner.classList.remove("hidden");
  launchConfetti();
}

function loseBattle() {
  battleOver = true;
  clearInterval(timerInterval);
  feedbackText.textContent = "You were defeated. Try again?";
  setButtonsEnabled(false);
}

function resetBattle() {
  playerHP = maxHP;
  enemyHP = maxHP;
  battleOver = false;
  feedbackText.textContent = "";
  winBanner.classList.add("hidden");
  confettiContainer.innerHTML = "";
  updateBars();
  setButtonsEnabled(true);
  startTimer();
}

// ---- Event listeners ----
moveButtons.forEach((btn) => {
  btn.addEventListener("click", () => handleAttack(btn.dataset.move));
});

resetBtn.addEventListener("click", resetBattle);

// ---- Initialize ----
updateBars();
scoreDisplay.textContent = score;
startTimer();
