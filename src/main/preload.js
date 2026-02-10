const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startApi: () => ipcRenderer.invoke('start-api'),
  stopApi: () => ipcRenderer.invoke('stop-api'),
  getApiStatus: () => ipcRenderer.invoke('get-api-status'),
  testDBConnection: (config) => ipcRenderer.invoke('test-db-connection', config),
  saveDBConfig: (config) => ipcRenderer.invoke('save-db-config', config),
  openDbSetup: () => ipcRenderer.send('open-db-setup'),
  openBackupModal: ()=> ipcRenderer.send('open-backup'),
  exportSeed: () => ipcRenderer.invoke('export-seed'),
  importSeed: () => ipcRenderer.invoke('import-seed'),
  restartApp: () => ipcRenderer.send('restart-app'),
  getDbConfig: () => ipcRenderer.invoke('get-db-config'),
  updateApiPort: (apiPort) => ipcRenderer.invoke('update-api-port', apiPort),
  onImportProgress: (callback) => ipcRenderer.on('import-progress', (event, progress) => callback(progress)),
  onExportProgress: (callback) => ipcRenderer.on('export-progress', (event, progress) => callback(progress)),
});