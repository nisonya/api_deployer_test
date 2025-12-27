const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startServer: (port) => ipcRenderer.invoke('start-server', port),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  getServerStatus: () => ipcRenderer.invoke('get-server-status')
});