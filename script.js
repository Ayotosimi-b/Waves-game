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
const resetBtn = document.getElementById("resetBtn");
const endModal = document.getElementById("endModal");
const endModalEmoji = document.getElementById("endModalEmoji");
const endModalTitle = document.getElementById("endModalTitle");
const endModalCoins = document.getElementById("endModalCoins");
const tryAgainBtn = document.getElementById("tryAgainBtn");
const moveButtons = document.querySelectorAll(".move-btn");
const confettiContainer = document.getElementById("confettiContainer");
const enemySprite = document.getElementById("enemySprite");
const slashFX = document.getElementById("slashFX");
const sceneEl = document.querySelector(".scene");
const enemyDamagePop = document.getElementById("enemyDamagePop");
const playerDamagePop = document.getElementById("playerDamagePop");

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

// ---- Animation helpers ----
// Player's attack: slash lines sweep across the ogre, then it shakes.
function playSlashEffect() {
  slashFX.classList.remove("show");
  void slashFX.offsetWidth; // restart if clicked again quickly
  slashFX.classList.add("show");
}

function playHitAnim(targetSprite) {
  targetSprite.classList.remove("hit");
  void targetSprite.offsetWidth;
  targetSprite.classList.add("hit");
}

// Enemy's counterattack: whole scene flashes red since there's no player sprite.
function playScreenFlash() {
  sceneEl.classList.remove("screen-hit");
  void sceneEl.offsetWidth;
  sceneEl.classList.add("screen-hit");
}

function showDamagePop(popEl, amount) {
  popEl.textContent = `-${amount}`;
  popEl.classList.remove("hidden");
  // restart the float-up animation on repeat hits
  popEl.style.animation = "none";
  void popEl.offsetWidth;
  popEl.style.animation = "";
  setTimeout(() => popEl.classList.add("hidden"), 800);
}

// ---- End-of-battle popup ----
function showEndModal(emoji, title, coinsThisBattle) {
  endModalEmoji.textContent = emoji;
  endModalTitle.textContent = title;
  endModalCoins.textContent =
    coinsThisBattle > 0
      ? `You earned ${coinsThisBattle} coins from this battle!`
      : "You earned 0 coins this battle.";
  endModal.classList.remove("hidden");
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
  showEndModal("⏱️", "Time's Up!", 0);
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

  setButtonsEnabled(false); // lock input while this turn's animation plays

  // --- Beat 1: player's turn ---
  const multiplier = effectiveness[move];
  const damage = Math.round(baseDamage * multiplier);
  enemyHP -= damage;

  const message = `${capitalize(move)} ${effectivenessText[move]}`;
  feedbackText.textContent = message;

  playSlashEffect();
  setTimeout(() => {
    playHitAnim(enemySprite);
    showDamagePop(enemyDamagePop, damage);
    updateBars();
  }, 200);

  setTimeout(() => {
    if (enemyHP <= 0) {
      enemyHP = 0;
      updateBars();
      winBattle();
      return;
    }

    // --- Beat 2: the monster attacks back ---
    // Challenge LevelUp: getting hit costs the player coins, not just HP.
    const incoming = randomRange(enemyDamageRange.min, enemyDamageRange.max);
    playerHP -= incoming;
    updateScore(-scorePenalty);

    playScreenFlash();
    setTimeout(() => {
      showDamagePop(playerDamagePop, incoming);
      updateBars();
      feedbackText.textContent = `${message} Enemy hits back for ${incoming} (-${scorePenalty} coins).`;

      if (playerHP <= 0) {
        playerHP = 0;
        updateBars();
        loseBattle();
      } else if (!battleOver) {
        setButtonsEnabled(true);
      }
    }, 200);
  }, 500);
}

function winBattle() {
  battleOver = true;
  clearInterval(timerInterval);
  updateScore(winReward);
  setButtonsEnabled(false);
  launchConfetti();
  showEndModal("🎉", "Well Unlocked!", winReward);
}

function loseBattle() {
  battleOver = true;
  clearInterval(timerInterval);
  feedbackText.textContent = "You were defeated.";
  setButtonsEnabled(false);
  showEndModal("💀", "Defeated! Try Again?", 0);
}

function resetBattle() {
  playerHP = maxHP;
  enemyHP = maxHP;
  battleOver = false;
  feedbackText.textContent = "";
  endModal.classList.add("hidden");
  confettiContainer.innerHTML = "";
  enemySprite.classList.remove("hit");
  slashFX.classList.remove("show");
  sceneEl.classList.remove("screen-hit");
  enemyDamagePop.classList.add("hidden");
  playerDamagePop.classList.add("hidden");
  updateBars();
  setButtonsEnabled(true);
  startTimer();
}

// ---- Event listeners ----
moveButtons.forEach((btn) => {
  btn.addEventListener("click", () => handleAttack(btn.dataset.move));
});

resetBtn.addEventListener("click", resetBattle);
tryAgainBtn.addEventListener("click", resetBattle);

// ---- Initialize ----
updateBars();
scoreDisplay.textContent = score;
startTimer();
