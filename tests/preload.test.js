const { contextBridge, ipcRenderer } = require('electron');
jest.mock('electron', () => ({
  contextBridge: { exposeInMainWorld: jest.fn() },
  ipcRenderer: { invoke: jest.fn(), send: jest.fn() }
}));

describe('preload.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // перезагружаем preload, чтобы mocks применились
    jest.isolateModules(() => {
      require('../src/main/preload'); // путь к твоему preload.js
    });
  });

  it('exposes electronAPI with 11 methods', () => {
    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith('electronAPI', expect.any(Object));
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    expect(Object.keys(api)).toHaveLength(12);
    expect(api).toHaveProperty('startApi');
    expect(api).toHaveProperty('getDbConfig');
    expect(api).toHaveProperty('stopApi');
    expect(api).toHaveProperty('testDBConnection');
    expect(api).toHaveProperty('saveDBConfig');
    expect(api).toHaveProperty('exportSeed');
    expect(api).toHaveProperty('importSeed');
    expect(api).toHaveProperty('getApiStatus');
    expect(api).toHaveProperty('openDbSetup');
    expect(api).toHaveProperty('openBackupModal');
    expect(api).toHaveProperty('restartApp');
    expect(api).toHaveProperty('updateApiPort');
  });

  it('startApi call ipcRenderer.invoke("start-api") and get response', async () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    ipcRenderer.invoke.mockResolvedValueOnce({ success: false, message: 'API is running' });
    const result = await api.startApi();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('start-api');    
    expect(result).toEqual({ success: false, message: 'API is running' });
    
  });
  
  it('stopApi call ipcRenderer.invoke("stop-api") and get response', async () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    ipcRenderer.invoke.mockResolvedValueOnce({ success: false, message: 'API is not running' });
    const result = await api.stopApi();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('stop-api');    
    expect(result).toEqual({ success: false, message: 'API is not running' });
    
  });
    
  it('getApiStatus call ipcRenderer.invoke("get-api-status") and get response', async () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    ipcRenderer.invoke.mockResolvedValueOnce({ running: true });
     const result = await api.getApiStatus();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-api-status');    
    expect(result).toEqual({ running: true });
    
  });
  it('testDBConnection transmits config in ipc', async () => {
    const fakeConfig = { host: '127.0.0.1', port: 3306 };
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    ipcRenderer.invoke.mockResolvedValueOnce({ success: false, message: 'Сервер БД не запущен или порт неверный.'});
    const result = await api.testDBConnection(fakeConfig);
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('test-db-connection', fakeConfig);
    expect(result).toEqual({ success: false, message: 'Сервер БД не запущен или порт неверный.'});
  });

  it('saveDBConfig transmits config in ipc', async () => {
    const fakeConfig = { host: '127.0.0.1', port: 3306 };
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    ipcRenderer.invoke.mockResolvedValueOnce({ success: true });
    const result = await api.saveDBConfig(fakeConfig);
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('save-db-config', fakeConfig);
    expect(result).toEqual({ success: true });
  });

  it('openDbSetup sends an event without waiting for a response', () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.openDbSetup();
    expect(ipcRenderer.send).toHaveBeenCalledWith('open-db-setup');
  });

  it('openBackupModal sends an event without waiting for a response', () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.openBackupModal();
    expect(ipcRenderer.send).toHaveBeenCalledWith('open-backup');
  });

  it('exportSeed call ipcRenderer.invoke("export-seed") and get negative response', async () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    ipcRenderer.invoke.mockResolvedValueOnce({ success: false, message: 'Отменено' });
     const result = await api.exportSeed();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('export-seed');    
    expect(result).toEqual({ success: false, message: 'Отменено' });
    
  });

  it('exportSeed call ipcRenderer.invoke("export-seed") and get positive responseе', async () => {
  const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
  const fakeSuccess = { success: true, filePath: '/home/user/kvant-seed-2026-01-13.sql' };

  ipcRenderer.invoke.mockResolvedValueOnce(fakeSuccess);

  const result = await api.exportSeed();

  expect(ipcRenderer.invoke).toHaveBeenCalledWith('export-seed');
  expect(result).toEqual(fakeSuccess);
  });
  
  it('importSeed call ipcRenderer.invoke("import-seed") and get negative response', async () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    ipcRenderer.invoke.mockResolvedValueOnce({ success: false, message: 'Отменено' });
     const result = await api.importSeed();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('import-seed');    
    expect(result).toEqual({ success: false, message: 'Отменено' });
    
  });

  it('imimportSeed call ipcRenderer.invoke("import-seed") and get positive response', async () => {
  const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
  ipcRenderer.invoke.mockResolvedValueOnce({ success: true });

  const result = await api.importSeed();

  expect(ipcRenderer.invoke).toHaveBeenCalledWith('import-seed');
  expect(result).toEqual({ success: true });
  });


  it('restartApp sends an event without waiting for a response', () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.restartApp();
    expect(ipcRenderer.send).toHaveBeenCalledWith('restart-app');
  });

 it('getDbConfig calls the channel and returns the config', async () => {
  const api = contextBridge.exposeInMainWorld.mock.calls[0][1];

  ipcRenderer.invoke.mockResolvedValueOnce({ host: 'localhost', port: 3306 });

  const result = await api.getDbConfig();

  expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-db-config');
  expect(result).toEqual({ host: 'localhost', port: 3306 });
  });

  it('getDbConfig handles the error from main', async () => {
  const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
  ipcRenderer.invoke.mockRejectedValueOnce(new Error('No config'));
  await expect(api.getDbConfig()).rejects.toThrow('No config');
  });
  
});