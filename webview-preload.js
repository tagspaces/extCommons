const { ipcRenderer } = require('electron');

global.sendToParent = (message) => {
  ipcRenderer.sendToHost(message);
};
