const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopPet", {
  getConfig: () => ipcRenderer.invoke("desktop-pet:get-config"),
  fetchPhrase: () => ipcRenderer.invoke("desktop-pet:fetch-phrase"),
  setBubblePaused: (paused) =>
    ipcRenderer.send("desktop-pet:set-bubble-paused", paused),
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
});
