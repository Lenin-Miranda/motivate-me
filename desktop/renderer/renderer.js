const bubble = document.getElementById("phrase-bubble");
const phraseText = document.getElementById("phrase-text");
const phraseTone = document.getElementById("phrase-tone");
const petButton = document.getElementById("pet-button");
const petSprite = document.getElementById("pet-sprite");
const closeBubbleButton = document.getElementById("close-bubble");
const refreshPhraseButton = document.getElementById("refresh-phrase");

const SPRITE_FRAMES = 6;
const FRAME_MS = 110;
const FRAME_MS_EXCITED = 55;
let frameIndex = 0;
let frameTimer = null;

function setFrame(index) {
  petSprite.src = `../public/llama/sprite_${index}.png`;
}

function startWalk(ms = FRAME_MS) {
  if (frameTimer) clearInterval(frameTimer);
  frameTimer = setInterval(() => {
    frameIndex = (frameIndex + 1) % SPRITE_FRAMES;
    setFrame(frameIndex);
  }, ms);
}

startWalk();

const AUTO_SHOW_MS = 30000;
const AUTO_HIDE_MS = 9000;

let autoShowTimer = null;
let autoHideTimer = null;
let isBubbleOpen = false;
let isPaused = false;

function titleCaseTone(tone) {
  return String(tone ?? "warm").toLowerCase();
}

function clearTimers() {
  if (autoHideTimer) {
    clearTimeout(autoHideTimer);
    autoHideTimer = null;
  }

  if (autoShowTimer) {
    clearTimeout(autoShowTimer);
    autoShowTimer = null;
  }
}

function scheduleAutoShow() {
  if (isPaused || isBubbleOpen) {
    return;
  }

  autoShowTimer = setTimeout(() => {
    void openBubble();
  }, AUTO_SHOW_MS);
}

function scheduleAutoHide() {
  autoHideTimer = setTimeout(() => {
    closeBubble();
  }, AUTO_HIDE_MS);
}

function setBubbleOpen(open) {
  isBubbleOpen = open;
  bubble.classList.toggle("hidden", !open);
  window.desktopPet.setBubblePaused(open);
  window.desktopPet.setBubbleOpen(open);
}

async function openBubble() {
  clearTimers();
  setBubbleOpen(true);

  petButton.classList.remove("is-excited");
  void petButton.offsetWidth;
  petButton.classList.add("is-excited");
  startWalk(FRAME_MS_EXCITED);
  setTimeout(() => {
    petButton.classList.remove("is-excited");
    startWalk(FRAME_MS);
  }, 750);

  phraseText.textContent = "Picking the next little push...";
  phraseTone.textContent = "loading";

  const phrase = await window.desktopPet.fetchPhrase();
  phraseText.textContent = phrase.text;
  phraseTone.textContent = titleCaseTone(phrase.tone);
  scheduleAutoHide();
}

function closeBubble() {
  clearTimers();
  setBubbleOpen(false);
  scheduleAutoShow();
}

petButton.addEventListener("click", () => {
  if (isBubbleOpen) {
    closeBubble();
    return;
  }

  void openBubble();
});

closeBubbleButton.addEventListener("click", () => {
  closeBubble();
});

refreshPhraseButton.addEventListener("click", () => {
  void openBubble();
});

window.desktopPet.onDirectionChange((direction) => {
  petButton.dataset.direction = String(direction);
});

window.desktopPet.onPauseChange((paused) => {
  isPaused = Boolean(paused);

  if (!isPaused && !isBubbleOpen) {
    scheduleAutoShow();
  }
});

window.desktopPet.onShowPhrase(() => {
  void openBubble();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isBubbleOpen) {
    closeBubble();
  }

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "q") {
    window.desktopPet.quit();
  }
});

window.addEventListener("DOMContentLoaded", async () => {
  const config = await window.desktopPet.getConfig();
  petButton.dataset.direction = String(config.direction);
  isPaused = Boolean(config.paused);

  if (!isPaused) {
    scheduleAutoShow();
  }
});
