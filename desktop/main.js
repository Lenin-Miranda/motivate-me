const path = require("node:path");
const fs = require("node:fs/promises");
const {
  app,
  BrowserWindow,
  ipcMain,
  safeStorage,
  screen,
} = require("electron");

const PET_WIDTH = 140;
const PET_HEIGHT = 190;
const DEFAULT_BUBBLE_EXTRA_HEIGHT = 98;
const MAX_BUBBLE_EXTRA_HEIGHT = 210;
const FLOOR_MARGIN = 18;
const SIDE_MARGIN = 18;
const WALK_SPEED = 2;
const TICK_MS = 16;
const SESSION_COOKIE_NAME = "motivate_me_session";
const AUTH_STORE_FILE = "desktop-auth.json";

const state = {
  x: 0,
  y: 0,
  direction: 1,
  manualPaused: false,
  bubblePaused: false,
};

let mainWindow = null;
let movementTimer = null;
let authState = {
  sessionToken: null,
  user: null,
};

function getApiBaseUrl() {
  return process.env.DESKTOP_API_URL ?? "http://localhost:4000";
}

function getAuthStorePath() {
  return path.join(app.getPath("userData"), AUTH_STORE_FILE);
}

function getPublicAuthState() {
  return {
    isAuthenticated: Boolean(authState.sessionToken && authState.user),
    user: authState.user,
  };
}

function encodeSessionToken(sessionToken) {
  if (safeStorage.isEncryptionAvailable()) {
    return {
      encrypted: true,
      value: safeStorage.encryptString(sessionToken).toString("base64"),
    };
  }

  return {
    encrypted: false,
    value: sessionToken,
  };
}

function decodeSessionToken(parsedAuthState) {
  if (typeof parsedAuthState.sessionToken !== "string") {
    return null;
  }

  if (!parsedAuthState.sessionTokenEncrypted) {
    return parsedAuthState.sessionToken;
  }

  try {
    return safeStorage.decryptString(
      Buffer.from(parsedAuthState.sessionToken, "base64"),
    );
  } catch {
    return null;
  }
}

function notifyAuthStateChanged() {
  mainWindow?.webContents.send(
    "desktop-pet:auth-changed",
    getPublicAuthState(),
  );
}

async function loadAuthState() {
  try {
    const rawAuthState = await fs.readFile(getAuthStorePath(), "utf8");
    const parsedAuthState = JSON.parse(rawAuthState);
    const sessionToken = decodeSessionToken(parsedAuthState);

    authState = {
      sessionToken,
      user:
        parsedAuthState.user && typeof parsedAuthState.user === "object"
          ? parsedAuthState.user
          : null,
    };
  } catch {
    authState = {
      sessionToken: null,
      user: null,
    };
  }
}

async function saveAuthState() {
  if (!authState.sessionToken || !authState.user) {
    await clearAuthState();
    return;
  }

  const storedSessionToken = encodeSessionToken(authState.sessionToken);

  await fs.writeFile(
    getAuthStorePath(),
    JSON.stringify(
      {
        sessionToken: storedSessionToken.value,
        sessionTokenEncrypted: storedSessionToken.encrypted,
        user: authState.user,
      },
      null,
      2,
    ),
    "utf8",
  );
}

async function clearAuthState() {
  authState = {
    sessionToken: null,
    user: null,
  };

  try {
    await fs.rm(getAuthStorePath(), { force: true });
  } catch {
    // If the file is already gone, the in-memory state above is enough.
  }
}

function getStringField(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getBubbleExtraHeight(value) {
  const height = Number(value);

  if (!Number.isFinite(height) || height < 0) {
    return DEFAULT_BUBBLE_EXTRA_HEIGHT;
  }

  return Math.min(Math.round(height), MAX_BUBBLE_EXTRA_HEIGHT);
}

function getSessionCookieHeader() {
  if (!authState.sessionToken) {
    return null;
  }

  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(authState.sessionToken)}`;
}

function getSetCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }

  const setCookieHeader = response.headers.get("set-cookie");
  return setCookieHeader ? [setCookieHeader] : [];
}

function extractSessionToken(response) {
  const cookieHeaders = getSetCookieHeaders(response);

  for (const cookieHeader of cookieHeaders) {
    const match = cookieHeader.match(
      new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`),
    );

    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getApiErrorMessage(data, fallback) {
  if (data && typeof data.message === "string") {
    return data.message;
  }

  if (data && typeof data.error === "string") {
    return data.error;
  }

  return fallback;
}

function createPhraseError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function fetchFromApi(route, init = {}) {
  const headers = {
    Accept: "application/json",
    ...init.headers,
  };
  const cookieHeader = getSessionCookieHeader();

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  return fetch(`${getApiBaseUrl()}${route}`, {
    ...init,
    headers,
  });
}

async function validateAuthSession() {
  if (!authState.sessionToken) {
    return false;
  }

  const response = await fetchFromApi("/auth/me");

  if (response.ok) {
    const data = await readJsonResponse(response);
    authState.user = data?.user ?? authState.user;
    await saveAuthState();
    return true;
  }

  if (response.status === 401) {
    await clearAuthState();
    notifyAuthStateChanged();
    return false;
  }

  return true;
}

function getWorkArea() {
  return screen.getPrimaryDisplay().workArea;
}

function setDirection(direction) {
  if (state.direction === direction) {
    return;
  }

  state.direction = direction;
  mainWindow?.webContents.send("desktop-pet:direction", direction);
}

function isPaused() {
  return state.manualPaused || state.bubblePaused;
}

function syncPauseState() {
  mainWindow?.webContents.send("desktop-pet:paused", isPaused());
}

function syncWindowPosition() {
  if (!mainWindow) {
    return;
  }

  mainWindow.setBounds({
    x: Math.round(state.x),
    y: Math.round(state.y),
    width: PET_WIDTH,
    height: PET_HEIGHT,
  });
}

function placeWindowAtStart() {
  const workArea = getWorkArea();

  state.x = workArea.x + SIDE_MARGIN;
  state.y = workArea.y + workArea.height - PET_HEIGHT - FLOOR_MARGIN;
  syncWindowPosition();
}

function tickMovement() {
  if (!mainWindow || isPaused()) {
    return;
  }

  const workArea = getWorkArea();
  const maxX = workArea.x + workArea.width - PET_WIDTH - SIDE_MARGIN;
  const minX = workArea.x + SIDE_MARGIN;
  const nextX = state.x + WALK_SPEED * state.direction;

  if (nextX >= maxX) {
    state.x = maxX;
    setDirection(-1);
    syncWindowPosition();
    return;
  }

  if (nextX <= minX) {
    state.x = minX;
    setDirection(1);
    syncWindowPosition();
    return;
  }

  state.x = nextX;
  syncWindowPosition();
}

function startMovement() {
  if (movementTimer) {
    return;
  }

  movementTimer = setInterval(tickMovement, TICK_MS);
}

function stopMovement() {
  if (!movementTimer) {
    return;
  }

  clearInterval(movementTimer);
  movementTimer = null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: PET_WIDTH,
    height: PET_HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setAlwaysOnTop("screen-saver");
  mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
  });
  placeWindowAtStart();

  mainWindow.once("ready-to-show", () => {
    if (!mainWindow) {
      return;
    }

    mainWindow.showInactive();
    mainWindow.webContents.send("desktop-pet:direction", state.direction);
  });

  mainWindow.on("closed", () => {
    stopMovement();
    mainWindow = null;
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

async function fetchRandomPhrase() {
  if (!authState.sessionToken) {
    throw createPhraseError(
      "AUTH_REQUIRED",
      "Connect your account to get your phrases.",
    );
  }

  const isSessionValid = await validateAuthSession();

  if (!isSessionValid) {
    throw createPhraseError(
      "AUTH_REQUIRED",
      "Connect your account to get your phrases.",
    );
  }

  // Fetch from the main process so the renderer does not need browser CORS access.
  const response = await fetchFromApi("/questionarie/phrases/random?take=1");

  if (!response.ok) {
    throw new Error(`Phrase request failed with status ${response.status}`);
  }

  const data = await response.json();
  const phrase = Array.isArray(data.phrases) ? data.phrases[0] : null;

  if (!phrase || typeof phrase.text !== "string") {
    throw createPhraseError(
      "NO_PHRASES",
      "Take the questionnaire once, then I can bring your phrases here.",
    );
  }

  return phrase;
}

async function loginDesktopPet(input) {
  const email = getStringField(input?.email).toLowerCase();
  const password = getStringField(input?.password);

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Could not sign in"));
  }

  const sessionToken = extractSessionToken(response);

  if (!sessionToken) {
    throw new Error("Login worked, but no session was returned");
  }

  authState = {
    sessionToken,
    user: data?.user ?? null,
  };
  await saveAuthState();
  notifyAuthStateChanged();

  return getPublicAuthState();
}

async function logoutDesktopPet() {
  try {
    if (authState.sessionToken) {
      await fetchFromApi("/auth/logout", { method: "POST" });
    }
  } catch {
    // Local sign out still matters if the API is offline.
  }

  await clearAuthState();
  notifyAuthStateChanged();

  return getPublicAuthState();
}

ipcMain.handle("desktop-pet:get-config", () => ({
  apiBaseUrl: getApiBaseUrl(),
  paused: isPaused(),
  direction: state.direction,
  auth: getPublicAuthState(),
}));

ipcMain.handle("desktop-pet:get-auth-state", () => getPublicAuthState());

ipcMain.handle("desktop-pet:login", async (_event, input) => {
  return loginDesktopPet(input);
});

ipcMain.handle("desktop-pet:logout", async () => {
  return logoutDesktopPet();
});

ipcMain.handle("desktop-pet:fetch-phrase", async () => {
  try {
    return await fetchRandomPhrase();
  } catch (error) {
    if (error?.code === "AUTH_REQUIRED") {
      return {
        id: "connect-account",
        text: "Connect your account first, then I'll bring your own phrases.",
        tone: "ACCOUNT",
      };
    }

    if (error?.code === "NO_PHRASES") {
      return {
        id: "no-phrases",
        text: "Take the questionnaire once, then I can bring your phrases here.",
        tone: "SETUP",
      };
    }

    return {
      id: "fallback",
      text: "Take one tiny step. That's enough for right now.",
      tone: "GENTLE",
    };
  }
});

ipcMain.on("desktop-pet:set-bubble-paused", (_event, paused) => {
  state.bubblePaused = Boolean(paused);
  syncPauseState();
});

ipcMain.on("desktop-pet:set-bubble-open", (_event, isOpen, extraHeight) => {
  if (!mainWindow) return;
  const workArea = getWorkArea();
  if (isOpen) {
    const bubbleExtraHeight = getBubbleExtraHeight(extraHeight);
    const newY = Math.max(workArea.y, state.y - bubbleExtraHeight);
    mainWindow.setBounds({
      x: Math.round(state.x),
      y: newY,
      width: PET_WIDTH,
      height: PET_HEIGHT + bubbleExtraHeight,
    });
  } else {
    mainWindow.setBounds({
      x: Math.round(state.x),
      y: Math.round(state.y),
      width: PET_WIDTH,
      height: PET_HEIGHT,
    });
  }
});

ipcMain.on("desktop-pet:quit", () => {
  app.quit();
});

app
  .whenReady()
  .then(() => {
    return loadAuthState();
  })
  .then(() => {
    app.dock?.hide();
    void validateAuthSession().catch(() => {});
    createWindow();
    startMovement();

    screen.on("display-metrics-changed", placeWindowAtStart);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
        startMovement();
      }
    });
  });

app.on("window-all-closed", () => {
  stopMovement();

  if (process.platform !== "darwin") {
    app.quit();
  }
});
