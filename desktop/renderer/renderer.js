const bubble = document.getElementById("phrase-bubble");
const phraseText = document.getElementById("phrase-text");
const phraseTone = document.getElementById("phrase-tone");
const phraseView = document.getElementById("phrase-view");
const petButton = document.getElementById("pet-button");
const petSprite = document.getElementById("pet-sprite");
const closeBubbleButton = document.getElementById("close-bubble");
const refreshPhraseButton = document.getElementById("refresh-phrase");
const accountButton = document.getElementById("account-button");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authStatus = document.getElementById("auth-status");
const authFields = document.getElementById("auth-fields");
const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");
const authMessage = document.getElementById("auth-message");
const authBackButton = document.getElementById("auth-back");
const authSubmitButton = document.getElementById("auth-submit");
const authLogoutButton = document.getElementById("auth-logout");

const SPRITE_FRAMES = 6;
const FRAME_MS = 110;
const FRAME_MS_EXCITED = 55;
const PHRASE_EXTRA_HEIGHT = 148;
const AUTH_EXTRA_HEIGHT = 238;
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
let bubbleMode = "phrase";
let authState = {
  isAuthenticated: false,
  user: null,
};

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
  if (bubbleMode !== "phrase") {
    return;
  }

  autoHideTimer = setTimeout(() => {
    closeBubble();
  }, AUTO_HIDE_MS);
}

function setBubbleOpen(open, extraHeight = PHRASE_EXTRA_HEIGHT) {
  isBubbleOpen = open;
  bubble.classList.toggle("hidden", !open);
  window.desktopPet.setBubblePaused(open);
  window.desktopPet.setBubbleOpen(open, extraHeight);
}

function animatePet() {
  petButton.classList.remove("is-excited");
  void petButton.offsetWidth;
  petButton.classList.add("is-excited");
  startWalk(FRAME_MS_EXCITED);
  setTimeout(() => {
    petButton.classList.remove("is-excited");
    startWalk(FRAME_MS);
  }, 750);
}

function getAuthEmail() {
  return authState?.user?.email ?? "";
}

function setAuthMessage(message, variant = "") {
  authMessage.textContent = message;
  authMessage.classList.toggle("is-error", variant === "error");
  authMessage.classList.toggle("is-success", variant === "success");
}

function renderAuthState() {
  const isAuthenticated = Boolean(authState?.isAuthenticated && authState.user);

  accountButton.textContent = isAuthenticated ? "account" : "connect";
  accountButton.classList.toggle("is-connected", isAuthenticated);
  authTitle.textContent = isAuthenticated ? "connected" : "connect account";
  authStatus.textContent = isAuthenticated
    ? getAuthEmail()
    : "same account, same support";
  authFields.classList.toggle("hidden", isAuthenticated);
  authSubmitButton.classList.toggle("hidden", isAuthenticated);
  authLogoutButton.classList.toggle("hidden", !isAuthenticated);
}

function setBubbleMode(mode) {
  bubbleMode = mode;
  phraseView.classList.toggle("hidden", mode !== "phrase");
  authForm.classList.toggle("hidden", mode !== "auth");
  bubble.classList.toggle("auth-mode", mode === "auth");

  if (mode === "auth") {
    renderAuthState();
  }
}

function setAuthSubmitting(isSubmitting) {
  authEmailInput.disabled = isSubmitting;
  authPasswordInput.disabled = isSubmitting;
  authSubmitButton.disabled = isSubmitting;
  authBackButton.disabled = isSubmitting;
  authSubmitButton.textContent = isSubmitting ? "checking" : "connect";
}

function openAuthPanel() {
  clearTimers();
  setBubbleOpen(true, AUTH_EXTRA_HEIGHT);
  setBubbleMode("auth");
  setAuthMessage("");

  if (!authState.isAuthenticated) {
    setTimeout(() => {
      authEmailInput.focus();
    }, 0);
  }
}

async function openBubble() {
  clearTimers();
  setBubbleOpen(true, PHRASE_EXTRA_HEIGHT);
  setBubbleMode("phrase");
  animatePet();

  phraseText.textContent = "Picking the next little push...";
  phraseTone.textContent = "loading";

  try {
    const phrase = await window.desktopPet.fetchPhrase();

    if (!isBubbleOpen || bubbleMode !== "phrase") {
      return;
    }

    phraseText.textContent = phrase.text;
    phraseTone.textContent = titleCaseTone(phrase.tone);
  } catch {
    phraseText.textContent = "I couldn't reach your phrases right now.";
    phraseTone.textContent = "offline";
  }

  scheduleAutoHide();
}

function closeBubble() {
  clearTimers();
  setBubbleMode("phrase");
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

accountButton.addEventListener("click", () => {
  openAuthPanel();
});

authBackButton.addEventListener("click", () => {
  setAuthMessage("");
  setBubbleMode("phrase");
  scheduleAutoHide();
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (authState.isAuthenticated) {
    return;
  }

  setAuthSubmitting(true);
  setAuthMessage("checking...");

  try {
    authState = await window.desktopPet.login({
      email: authEmailInput.value,
      password: authPasswordInput.value,
    });
    authPasswordInput.value = "";
    renderAuthState();
    setAuthMessage("connected", "success");

    setTimeout(() => {
      void openBubble();
    }, 650);
  } catch (error) {
    setAuthMessage(
      error instanceof Error ? error.message : "Could not connect",
      "error",
    );
  } finally {
    setAuthSubmitting(false);
  }
});

authLogoutButton.addEventListener("click", async () => {
  authLogoutButton.disabled = true;
  setAuthMessage("signing out...");

  try {
    authState = await window.desktopPet.logout();
    authEmailInput.value = "";
    authPasswordInput.value = "";
    renderAuthState();
    setAuthMessage("signed out", "success");
  } catch {
    setAuthMessage("Could not sign out", "error");
  } finally {
    authLogoutButton.disabled = false;
  }
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

window.desktopPet.onShowAuth(() => {
  openAuthPanel();
});

window.desktopPet.onAuthChange((nextAuthState) => {
  authState = nextAuthState;
  renderAuthState();
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
  authState = config.auth ?? (await window.desktopPet.getAuthState());
  renderAuthState();

  if (!isPaused) {
    scheduleAutoShow();
  }
});
