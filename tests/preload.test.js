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
      require('../preload'); // путь к твоему preload.js
    });
  });

  it('exposes electronAPI with 11 methods', () => {
    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith('electronAPI', expect.any(Object));
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    expect(Object.keys(api)).toHaveLength(11);
    expect(api).toHaveProperty('startApi');
    expect(api).toHaveProperty('getDbConfig');
    // ... остальные
  });

  it('startApi вызывает ipcRenderer.invoke("start-api")', () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.startApi();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('start-api');
  });

  it('saveDBConfig передаёт config в ipc', () => {
    const fakeConfig = { host: '127.0.0.1', port: 3306 };
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.saveDBConfig(fakeConfig);
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('save-db-config', fakeConfig);
  });

  it('openDbSetup отправляет событие без ожидания ответа', () => {
    const api = contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.openDbSetup();
    expect(ipcRenderer.send).toHaveBeenCalledWith('open-db-setup');
  });
});