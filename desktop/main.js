const path = require("node:path");
const { app, BrowserWindow, Menu, Tray, ipcMain, screen } = require("electron");

const PET_WIDTH = 220;
const PET_HEIGHT = 260;
const BUBBLE_EXTRA_HEIGHT = 148;
const FLOOR_MARGIN = 18;
const SIDE_MARGIN = 18;
const WALK_SPEED = 2;
const TICK_MS = 16;

const state = {
  x: 0,
  y: 0,
  direction: 1,
  manualPaused: false,
  bubblePaused: false,
};

let mainWindow = null;
let tray = null;
let movementTimer = null;

function getApiBaseUrl() {
  return process.env.DESKTOP_API_URL ?? "http://localhost:4000";
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

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: "Show phrase now",
      click: () => {
        mainWindow?.webContents.send("desktop-pet:show-phrase");
      },
    },
    {
      label: state.manualPaused ? "Resume walking" : "Pause walking",
      click: () => {
        state.manualPaused = !state.manualPaused;
        syncPauseState();
      },
    },
    {
      label: "Quit",
      role: "quit",
    },
  ]);
}

function syncPauseState() {
  mainWindow?.webContents.send("desktop-pet:paused", isPaused());
  tray?.setContextMenu(buildTrayMenu());
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

function createTray() {
  const trayIcon = path.join(
    __dirname,
    "..",
    "web",
    "public",
    "motivate-me_icon_dark.png",
  );

  tray = new Tray(trayIcon);
  tray.setToolTip("Motivate Me");
  tray.setContextMenu(buildTrayMenu());
}

async function fetchRandomPhrase() {
  // Fetch from the main process so the renderer does not need browser CORS access.
  const response = await fetch(
    `${getApiBaseUrl()}/questionarie/phrases/random?take=1`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Phrase request failed with status ${response.status}`);
  }

  const data = await response.json();
  const phrase = Array.isArray(data.phrases) ? data.phrases[0] : null;

  if (!phrase || typeof phrase.text !== "string") {
    throw new Error("No phrase available");
  }

  return phrase;
}

ipcMain.handle("desktop-pet:get-config", () => ({
  apiBaseUrl: getApiBaseUrl(),
  paused: isPaused(),
  direction: state.direction,
}));

ipcMain.handle("desktop-pet:fetch-phrase", async () => {
  try {
    return await fetchRandomPhrase();
  } catch {
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

ipcMain.on("desktop-pet:set-bubble-open", (_event, isOpen) => {
  if (!mainWindow) return;
  const workArea = getWorkArea();
  if (isOpen) {
    const newY = Math.max(workArea.y, state.y - BUBBLE_EXTRA_HEIGHT);
    mainWindow.setBounds({ x: Math.round(state.x), y: newY, width: PET_WIDTH, height: PET_HEIGHT + BUBBLE_EXTRA_HEIGHT });
  } else {
    mainWindow.setBounds({ x: Math.round(state.x), y: Math.round(state.y), width: PET_WIDTH, height: PET_HEIGHT });
  }
});

ipcMain.on("desktop-pet:quit", () => {
  app.quit();
});

app.whenReady().then(() => {
  createWindow();
  createTray();
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
