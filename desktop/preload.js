const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopPet", {
  getConfig: () => ipcRenderer.invoke("desktop-pet:get-config"),
  getAuthState: () => ipcRenderer.invoke("desktop-pet:get-auth-state"),
  login: (input) => ipcRenderer.invoke("desktop-pet:login", input),
  logout: () => ipcRenderer.invoke("desktop-pet:logout"),
  fetchPhrase: () => ipcRenderer.invoke("desktop-pet:fetch-phrase"),
  setBubblePaused: (paused) =>
    ipcRenderer.send("desktop-pet:set-bubble-paused", paused),
  setBubbleOpen: (open, extraHeight) =>
    ipcRenderer.send("desktop-pet:set-bubble-open", open, extraHeight),
  quit: () => ipcRenderer.send("desktop-pet:quit"),
  onDirectionChange: (callback) => {
    ipcRenderer.on("desktop-pet:direction", (_event, direction) => {
      callback(direction);
    });
  },
  onPauseChange: (callback) => {
    ipcRenderer.on("desktop-pet:paused", (_event, paused) => {
      callback(paused);
    });
  },
  onShowPhrase: (callback) => {
    ipcRenderer.on("desktop-pet:show-phrase", () => {
      callback();
    });
  },
  onShowAuth: (callback) => {
    ipcRenderer.on("desktop-pet:show-auth", () => {
      callback();
    });
  },
  onAuthChange: (callback) => {
    ipcRenderer.on("desktop-pet:auth-changed", (_event, auth) => {
      callback(auth);
    });
  },
});
