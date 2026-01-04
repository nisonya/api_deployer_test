const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startApi: () => ipcRenderer.invoke('start-api'),
  stopApi: () => ipcRenderer.invoke('stop-api'),
  getApiStatus: () => ipcRenderer.invoke('get-api-status'),
  saveDBConfig: () => ipcRenderer.invoke('save-db-config'),
  testDBConnection: () => ipcRenderer.invoke('test-db-connection')
});