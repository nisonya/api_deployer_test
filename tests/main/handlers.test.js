const { registerHandlers } = require('../../src/main/ipcHandlers');
const { getApiServer, setApiServer } = require('../../src/main/state');
const { startApi, stopApi, getStatus } = require('../../src/api/app');
const { getDbConfig, setDbConfig } = require('../../src/common/config');
const { getPool } = require('../../src/db/connection');
const { createSetupWindow, createBackupWindow } = require('../../src/main/windows');

jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
  },
  dialog: {
    showSaveDialog: jest.fn(),
    showOpenDialog: jest.fn(),
  },
  app: {
    relaunch: jest.fn(),
    quit: jest.fn(),
  },
}));

jest.mock('../../src/api/app', () => ({
  startApi: jest.fn(),
  stopApi: jest.fn(),
  getStatus: jest.fn(),
}));

jest.mock('../../src/common/config', () => ({
  getDbConfig: jest.fn(),
  setDbConfig: jest.fn(),
}));

jest.mock('../../src/db/connection', () => ({
  getPool: jest.fn(),
}));

jest.mock('../../src/main/state', () => ({
  getApiServer: jest.fn(),
  setApiServer: jest.fn(),
}));

jest.mock('../../src/main/windows', () => ({
  createSetupWindow: jest.fn(),
  createBackupWindow: jest.fn(),
}));

jest.mock('mysql2/promise', () => {
  const mockPool = {
    query: jest.fn(),
    end: jest.fn(),
  };

  return {
    createPool: jest.fn(() => mockPool),
  };
});

// 2. В тестах берём уже замоканный объект
const mysqlMock = require('mysql2/promise');
const mockPool = mysqlMock.createPool();

const { ipcMain, dialog, app } = require('electron');

describe('ipcHandlers', () => {
  let mainWindowMock;
  let handlersMap = {};

  beforeEach(() => {
    jest.clearAllMocks();

    mainWindowMock = {
      id: 1,
    };

    handlersMap = {};

    ipcMain.handle.mockImplementation((channel, handler) => {
      handlersMap[channel] = handler;
    });

    ipcMain.on.mockImplementation((channel, handler) => {
      handlersMap[channel] = handler;
    });

    registerHandlers(mainWindowMock);
  });

  describe('start-api', () => {
    it('возвращает ошибку если API уже запущен', async () => {
      getApiServer.mockReturnValue({ close: jest.fn() });

      const result = await handlersMap['start-api']();

      expect(result).toEqual({
        success: false,
        message: 'API уже запущен',
      });
      expect(startApi).not.toHaveBeenCalled();
    });

    it('успешно запускает API и сохраняет сервер', async () => {
      getApiServer.mockReturnValue(null);
      const fakeServer = { close: jest.fn() };
      startApi.mockResolvedValue(fakeServer);

      const result = await handlersMap['start-api']();

      expect(result).toEqual({ success: true, message: 'API запущен' });
      expect(startApi).toHaveBeenCalledTimes(1);
      expect(setApiServer).toHaveBeenCalledWith(fakeServer);
    });

    it('возвращает ошибку при сбое запуска', async () => {
      getApiServer.mockReturnValue(null);
      startApi.mockRejectedValue(new Error('порт занят'));

      const result = await handlersMap['start-api']();

      expect(result).toEqual({
        success: false,
        message: 'порт занят',
      });
      expect(setApiServer).not.toHaveBeenCalled();
    });
  });

  describe('stop-api', () => {
    it('возвращает ошибку если API не запущен', async () => {
      getApiServer.mockReturnValue(null);

      const result = await handlersMap['stop-api']();

      expect(result).toEqual({
        success: false,
        message: 'API не запущен',
      });
      expect(stopApi).not.toHaveBeenCalled();
    });

    it('успешно останавливает API', async () => {
      const fakeServer = { close: jest.fn() };
      getApiServer.mockReturnValue(fakeServer);
      stopApi.mockResolvedValue(undefined);

      const result = await handlersMap['stop-api']();

      expect(result).toEqual({ success: true });
      expect(stopApi).toHaveBeenCalledTimes(1);
      expect(setApiServer).toHaveBeenCalledWith(null);
    });
  });

  describe('get-api-status', () => {
    it('возвращает running: true когда сервер есть', () => {
      getApiServer.mockReturnValue({});

      const result = handlersMap['get-api-status']();

      expect(result).toEqual({ running: true });
    });

    it('возвращает running: false когда сервера нет', () => {
      getApiServer.mockReturnValue(null);

      const result = handlersMap['get-api-status']();

      expect(result).toEqual({ running: false });
    });
  });

  describe('test-db-connection', () => {
    const goodConfig = {
      host: '127.0.0.1',
      port: 3306,
      user: 'test',
      password: 'pass',
    };
    beforeEach(() => {
        jest.clearAllMocks();           // очень важно!
        mockPool.query.mockReset();
        mockPool.end.mockReset();
    });
    it('успешное подключение → возвращает success: true', async () => {
    // Настраиваем успешный ответ от БД
    mockPool.query.mockResolvedValueOnce([[{ 1: 1 }]]);   // ← Once — только для этого теста

    const result = await handlersMap['test-db-connection'](null, goodConfig);

    expect(result).toEqual({ success: true });

    expect(mysqlMock.createPool).toHaveBeenCalledTimes(1);
    expect(mysqlMock.createPool).toHaveBeenCalledWith(
      expect.objectContaining({
        host: '127.0.0.1',
        port: 3306,
        user: 'test',
        password: 'pass'
      })
    );

    expect(mockPool.query).toHaveBeenCalledWith('SELECT 1');
    expect(mockPool.end).toHaveBeenCalledTimes(1);
  });

 it('ECONNREFUSED → понятное сообщение для пользователя', async () => {
  const connectionError = new Error('connect ECONNREFUSED 127.0.0.1:3306');
  connectionError.code = 'ECONNREFUSED';

  mockPool.query.mockRejectedValueOnce(connectionError);

  const result = await handlersMap['test-db-connection'](null, goodConfig);

  expect(result).toEqual({
    success: false,
    message: expect.stringContaining('Сервер БД не запущен или порт неверный')
  });

  // Важно: end НЕ должен вызываться при ошибке подключения
  expect(mockPool.end).not.toHaveBeenCalled();
});

  it('неверный пароль → понятное сообщение', async () => {
    const accessError = new Error('Access denied');
    accessError.code = 'ER_ACCESS_DENIED_ERROR';

    mockPool.query.mockRejectedValueOnce(accessError);

    const result = await handlersMap['test-db-connection'](null, goodConfig);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Неверный пользователь или пароль');
  });
  });

  describe('save-db-config / get-db-config', () => {
    it('save → вызывает setDbConfig', async () => {
      const config = { host: 'a', port: 1, user: 'u', password: 'p', database: 'd' };

      const result = await handlersMap['save-db-config'](null, config);

      expect(result).toEqual({ success: true });
      expect(setDbConfig).toHaveBeenCalledWith(config);
    });

    it('get → возвращает конфиг без пароля', async () => {
      getDbConfig.mockResolvedValue({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'secret',
        database: 'kvant',
        apiPort: 4000,
      });

      const result = await handlersMap['get-db-config']();

      expect(result).toEqual({
        host: 'localhost',
        port: 3306,
        user: 'root',
        database: 'kvant',
        apiPort: 4000,
      });
      expect(result.password).toBeUndefined();
    });
  });

  describe('restart-app', () => {
    it('вызывает app.relaunch() и app.quit()', () => {
      handlersMap['restart-app']();

      expect(app.relaunch).toHaveBeenCalledTimes(1);
      expect(app.quit).toHaveBeenCalledTimes(1);
    });
  });

  describe('open-db-setup', () => {
    it('вызывает createSetupWindow с mainWindow', () => {
      handlersMap['open-db-setup']();

      expect(createSetupWindow).toHaveBeenCalledWith(mainWindowMock);
    });
  });

  describe('open-backup', () => {
    it('вызывает createBackupWindow с mainWindow', () => {
      handlersMap['open-backup']();

      expect(createBackupWindow).toHaveBeenCalledWith(mainWindowMock);
    });
  });
  describe('export-seed — отмена диалога', () => {
    it('возвращает success:false при отмене', async () => {
      dialog.showSaveDialog.mockResolvedValue({ canceled: true });

      const result = await handlersMap['export-seed']();

      expect(result).toEqual({ success: false, message: 'Отменено' });
      expect(getPool).not.toHaveBeenCalled();
    });
  });

  // Аналогично для import-seed
});