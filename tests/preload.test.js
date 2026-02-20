const { contextBridge, ipcRenderer } = require('electron');

jest.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
  ipcRenderer: {
    on: jest.fn(),
    invoke: jest.fn(),
    send: jest.fn(),
    removeListener: jest.fn(),
  },
}));

describe('preload.js', () => {
  let exposedAPI;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      require('../src/main/preload'); 
    });

    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith('electronAPI', expect.any(Object));
    exposedAPI = contextBridge.exposeInMainWorld.mock.calls[0][1];
  });

  it('exposes electronAPI with all expected methods', () => {
    const expectedMethods = [
      'startApi',
      'stopApi',
      'getApiStatus',
      'testDBConnection',
      'saveDBConfig',
      'openDbSetup',
      'openBackupModal',
      'exportSeed',
      'importSeed',
      'restartApp',
      'getDbConfig',
      'updateApiPort',
      'onImportProgress',
      'onExportProgress',
    ];

    expect(Object.keys(exposedAPI)).toHaveLength(expectedMethods.length);
    expectedMethods.forEach(method => {
      expect(exposedAPI).toHaveProperty(method);
    });
  });

  it('startApi calls ipcRenderer.invoke("start-api") and returns response', async () => {
    ipcRenderer.invoke.mockResolvedValueOnce({ success: false, message: 'API is running' });
    const result = await exposedAPI.startApi();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('start-api');
    expect(result).toEqual({ success: false, message: 'API is running' });
  });

  it('stopApi calls ipcRenderer.invoke("stop-api") and returns response', async () => {
    ipcRenderer.invoke.mockResolvedValueOnce({ success: false, message: 'API is not running' });
    const result = await exposedAPI.stopApi();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('stop-api');
    expect(result).toEqual({ success: false, message: 'API is not running' });
  });

  it('getApiStatus calls ipcRenderer.invoke("get-api-status") and returns response', async () => {
    ipcRenderer.invoke.mockResolvedValueOnce({ running: true });
    const result = await exposedAPI.getApiStatus();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-api-status');
    expect(result).toEqual({ running: true });
  });

  it('updateApiPort calls ipcRenderer.invoke("update-api-port") with port', async () => {
    const fakePort = 3500;
    ipcRenderer.invoke.mockResolvedValueOnce({ success: true });
    const result = await exposedAPI.updateApiPort(fakePort);
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('update-api-port', fakePort);
    expect(result).toEqual({ success: true });
  });

  it('testDBConnection calls ipcRenderer.invoke("test-db-connection") with config', async () => {
    const fakeConfig = { host: '127.0.0.1', port: 3306 };
    ipcRenderer.invoke.mockResolvedValueOnce({ success: false, message: 'Server not running or wrong port' });
    const result = await exposedAPI.testDBConnection(fakeConfig);
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('test-db-connection', fakeConfig);
    expect(result).toEqual({ success: false, message: 'Server not running or wrong port' });
  });

  it('saveDBConfig calls ipcRenderer.invoke("save-db-config") with config', async () => {
    const fakeConfig = { host: '127.0.0.1', port: 3306 };
    ipcRenderer.invoke.mockResolvedValueOnce({ success: true });
    const result = await exposedAPI.saveDBConfig(fakeConfig);
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('save-db-config', fakeConfig);
    expect(result).toEqual({ success: true });
  });

  it('openDbSetup sends "open-db-setup" event', () => {
    exposedAPI.openDbSetup();
    expect(ipcRenderer.send).toHaveBeenCalledWith('open-db-setup');
  });

  it('openBackupModal sends "open-backup" event', () => {
    exposedAPI.openBackupModal();
    expect(ipcRenderer.send).toHaveBeenCalledWith('open-backup');
  });

  it('exportSeed calls ipcRenderer.invoke("export-seed") and handles failure', async () => {
    ipcRenderer.invoke.mockResolvedValueOnce({ success: false, message: 'Cancelled' });
    const result = await exposedAPI.exportSeed();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('export-seed');
    expect(result).toEqual({ success: false, message: 'Cancelled' });
  });

  it('exportSeed calls ipcRenderer.invoke("export-seed") and handles success', async () => {
    const fakeSuccess = { success: true, filePath: '/path/to/seed.sql' };
    ipcRenderer.invoke.mockResolvedValueOnce(fakeSuccess);
    const result = await exposedAPI.exportSeed();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('export-seed');
    expect(result).toEqual(fakeSuccess);
  });

  it('importSeed calls ipcRenderer.invoke("import-seed") and handles failure', async () => {
    ipcRenderer.invoke.mockResolvedValueOnce({ success: false, message: 'Cancelled' });
    const result = await exposedAPI.importSeed();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('import-seed');
    expect(result).toEqual({ success: false, message: 'Cancelled' });
  });

  it('importSeed calls ipcRenderer.invoke("import-seed") and handles success', async () => {
    ipcRenderer.invoke.mockResolvedValueOnce({ success: true });
    const result = await exposedAPI.importSeed();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('import-seed');
    expect(result).toEqual({ success: true });
  });

  it('restartApp sends "restart-app" event', () => {
    exposedAPI.restartApp();
    expect(ipcRenderer.send).toHaveBeenCalledWith('restart-app');
  });

  it('getDbConfig calls ipcRenderer.invoke("get-db-config") and returns config', async () => {
    ipcRenderer.invoke.mockResolvedValueOnce({ host: 'localhost', port: 3306 });
    const result = await exposedAPI.getDbConfig();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-db-config');
    expect(result).toEqual({ host: 'localhost', port: 3306 });
  });

  it('getDbConfig handles error from main process', async () => {
    ipcRenderer.invoke.mockRejectedValueOnce(new Error('No config found'));
    await expect(exposedAPI.getDbConfig()).rejects.toThrow('No config found');
  });
  it('registers listener on ipcRenderer.on with channel "import-progress"', () => {
        const mockCallback = jest.fn();
        exposedAPI.onImportProgress(mockCallback);

        expect(ipcRenderer.on).toHaveBeenCalledWith('import-progress', expect.any(Function));
      });

      it('calls provided callback when "import-progress" event is received', () => {
        const mockCallback = jest.fn();
        exposedAPI.onImportProgress(mockCallback);

        const listener = ipcRenderer.on.mock.calls.find(call => call[0] === 'import-progress')[1];

        const fakeEvent = { sender: {} };
        const fakeProgress = 75;
        listener(fakeEvent, fakeProgress);

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(fakeProgress);
      });

  it('onExportProgress registers listener on "export-progress" channel', () => {
    const mockCallback = jest.fn();
    exposedAPI.onExportProgress(mockCallback);

    expect(ipcRenderer.on).toHaveBeenCalledWith('export-progress', expect.any(Function));
  });

  it('onExportProgress calls callback when "export-progress" event is received', () => {
    const mockCallback = jest.fn();
    exposedAPI.onExportProgress(mockCallback);

    const listener = ipcRenderer.on.mock.calls[0][1];

    const fakeEvent = { sender: {} };
    const fakeProgress = 42;

    listener(fakeEvent, fakeProgress);

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(fakeProgress);
  });
});