const { registerHandlers } = require('../../src/main/ipcHandlers');
const { getApiServer, setApiServer } = require('../../src/main/state');
const { startApi, stopApi } = require('../../src/api/app');
const { getDbConfig, setDbConfig, updateApiPort } = require('../../src/common/config');
const { getPool } = require('../../src/db/connection');
const { createSetupWindow, createBackupWindow } = require('../../src/main/windows');
const fs = require('fs').promises;
const path = require('path');

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
}));

jest.mock('../../src/common/config', () => ({
  getDbConfig: jest.fn(),
  setDbConfig: jest.fn(),
  updateApiPort: jest.fn(),
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

// Мокаем mysql2/promise
jest.mock('mysql2/promise', () => {
  const mockPool = {
    query: jest.fn(),
    end: jest.fn(),
  };
  return {
    createPool: jest.fn().mockReturnValue(mockPool),
  };
});
const mysqlReal = require('mysql2');  // Реальный модуль для escape (не замоканный)
const mysqlMock = require('mysql2/promise');
const mockPool = mysqlMock.createPool();

const { ipcMain, dialog, app } = require('electron');

describe('ipcHandlers', () => {
  let mainWindowMock;
  let handlersMap = {};

  beforeEach(() => {
    jest.clearAllMocks();
    mainWindowMock = { id: 1 };
    handlersMap = {};

    ipcMain.handle.mockImplementation((channel, handler) => {
      handlersMap[channel] = handler;
    });
    ipcMain.on.mockImplementation((channel, handler) => {
      handlersMap[channel] = handler;
    });

    registerHandlers(mainWindowMock);
  });

  describe('get-api-status', () => {
    it('должен вернуть running: true если сервер существует', () => {
      getApiServer.mockReturnValue({ close: jest.fn() });
      const result = handlersMap['get-api-status']();
      expect(result).toEqual({ running: true });
    });

    it('должен вернуть running: false если сервера нет', () => {
      getApiServer.mockReturnValue(null);
      const result = handlersMap['get-api-status']();
      expect(result).toEqual({ running: false });
    });
  });

  describe('start-api', () => {
    it('ошибка если API уже запущен', async () => {
      getApiServer.mockReturnValue({});
      const result = await handlersMap['start-api']();
      expect(result).toEqual({ success: false, message: 'API is running' });
      expect(startApi).not.toHaveBeenCalled();
    });

    it('успешный запуск с дефолтным портом 3000', async () => {
      getApiServer.mockReturnValue(null);
      getDbConfig.mockResolvedValue(null); // нет конфига → порт 3000
      const fakeServer = { close: jest.fn() };
      startApi.mockResolvedValue(fakeServer);

      const result = await handlersMap['start-api']();

      expect(result).toEqual({ success: true, message: 'API is running' });
      expect(startApi).toHaveBeenCalledWith(3000);
      expect(setApiServer).toHaveBeenCalledWith(fakeServer);
    });

    it('успешный запуск с портом из конфига', async () => {
      getApiServer.mockReturnValue(null);
      getDbConfig.mockResolvedValue({ apiPort: 8080 });
      const fakeServer = { close: jest.fn() };
      startApi.mockResolvedValue(fakeServer);

      const result = await handlersMap['start-api']();

      expect(result).toEqual({ success: true, message: 'API is running' });
      expect(startApi).toHaveBeenCalledWith(8080);
      expect(setApiServer).toHaveBeenCalledWith(fakeServer);
    });

    it('ошибка при запуске → не сохраняет сервер', async () => {
      getApiServer.mockReturnValue(null);
      startApi.mockRejectedValue(new Error('Address already in use'));

      const result = await handlersMap['start-api']();

      expect(result).toEqual({ success: false, message: 'Address already in use' });
      expect(setApiServer).not.toHaveBeenCalled();
    });
  });

  describe('stop-api', () => {
    it('ошибка если API не запущен', async () => {
      getApiServer.mockReturnValue(null);
      const result = await handlersMap['stop-api']();
      expect(result).toEqual({ success: false, message: 'API is not running' });
      expect(stopApi).not.toHaveBeenCalled();
    });

    it('успешная остановка', async () => {
      getApiServer.mockReturnValue({ close: jest.fn() });
      stopApi.mockResolvedValue(undefined);

      const result = await handlersMap['stop-api']();

      expect(result).toEqual({ success: true });
      expect(stopApi).toHaveBeenCalledTimes(1);
      expect(setApiServer).toHaveBeenCalledWith(null);
    });
  });

  describe('test-db-connection', () => {
    const config = {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'secret',
    };

    it('успешное подключение', async () => {
      mockPool.query.mockResolvedValueOnce([[{ 1: 1 }]]);
      const result = await handlersMap['test-db-connection'](null, config);

      expect(result).toEqual({ success: true });
      expect(mockPool.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockPool.end).toHaveBeenCalledTimes(1);
    });

    it('ECONNREFUSED → понятное сообщение', async () => {
      const err = new Error('connect ECONNREFUSED');
      err.code = 'ECONNREFUSED';
      mockPool.query.mockRejectedValueOnce(err);

      const result = await handlersMap['test-db-connection'](null, config);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Сервер БД не запущен или порт неверный');
      expect(mockPool.end).not.toHaveBeenCalled();
    });

    it('ER_ACCESS_DENIED_ERROR → понятное сообщение', async () => {
      const err = new Error('Access denied');
      err.code = 'ER_ACCESS_DENIED_ERROR';
      mockPool.query.mockRejectedValueOnce(err);

      const result = await handlersMap['test-db-connection'](null, config);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Неверный пользователь или пароль');
      expect(mockPool.end).not.toHaveBeenCalled();
    });
    it('ER_DBACCESS_DENIED_ERROR → понятное сообщение "Нет доступа к БД."', async () => {
  const err = new Error('Database access denied for user');
  err.code = 'ER_DBACCESS_DENIED_ERROR';
  mockPool.query.mockRejectedValueOnce(err);

  const result = await handlersMap['test-db-connection'](null, config);

  expect(result.success).toBe(false);
  expect(result.message).toContain('Нет доступа к БД.');
  expect(mockPool.end).not.toHaveBeenCalled();
});

    it('другая ошибка → общее сообщение', async () => {
      const err = new Error('Unknown database');
      err.code = 'ER_BAD_DB_ERROR';
      mockPool.query.mockRejectedValueOnce(err);

      const result = await handlersMap['test-db-connection'](null, config);

      expect(result).toEqual({
        success: false,
        message: 'Не удалось подключиться. Проверьте данные.',
      });
      expect(mockPool.end).not.toHaveBeenCalled();
    });
  });

  describe('get-db-config', () => {
    it('возвращает конфиг без пароля', async () => {
      getDbConfig.mockResolvedValue({
        host: 'db.example.com',
        port: 3307,
        user: 'app',
        password: 'verysecret',
        database: 'kvant2025',
        apiPort: 5000,
      });

      const result = await handlersMap['get-db-config']();

      expect(result).toEqual({
        host: 'db.example.com',
        port: 3307,
        user: 'app',
        database: 'kvant2025',
        apiPort: 5000,
      });
      expect(result.password).toBeUndefined();
    });

    it('возвращает null если конфига нет', async () => {
      getDbConfig.mockResolvedValue(null);
      const result = await handlersMap['get-db-config']();
      expect(result).toBeNull();
    });
  });

  describe('save-db-config', () => {
    it('сохраняет конфиг', async () => {
      const config = { host: 'x', port: 1, user: 'y', password: 'z', database: 'w', apiPort: 9999 };
      const result = await handlersMap['save-db-config'](null, config);
      expect(result).toEqual({ success: true });
      expect(setDbConfig).toHaveBeenCalledWith(config);
    });
  });

  describe('update-api-port', () => {
    it('успешное обновление порта', async () => {
      updateApiPort.mockResolvedValue(undefined);
      const result = await handlersMap['update-api-port'](null, 8081);
      expect(result).toEqual({ success: true });
      expect(updateApiPort).toHaveBeenCalledWith(8081);
    });

    it('ошибка при обновлении порта', async () => {
      updateApiPort.mockRejectedValue(new Error('Недопустимый порт'));
      const result = await handlersMap['update-api-port'](null, 80);
      expect(result).toEqual({ success: false, message: 'Недопустимый порт' });
    });
  });

  describe('export-seed', () => {
    it('отмена диалога → success: false', async () => {
      dialog.showSaveDialog.mockResolvedValue({ canceled: true });
      const result = await handlersMap['export-seed']();
      expect(result).toEqual({ success: false, message: 'Отменено' });
      expect(getPool).not.toHaveBeenCalled();
    });
it('успешный экспорт с данными', async () => {
  const mockEvent = { sender: { send: jest.fn() } };
  dialog.showSaveDialog.mockResolvedValue({ filePath: '/tmp/dump.sql', canceled: false });

  const mockConn = {
    query: jest.fn(),
    release: jest.fn(),
    escape: mysqlReal.escape,
  };

  mockConn.query
    .mockResolvedValueOnce([[{ Tables_in_kvant: 'users' }, { Tables_in_kvant: 'orders' }]])
    .mockResolvedValueOnce([[{ id: 1, name: 'Alice' }]])
    .mockResolvedValueOnce([[{ id: 101, amount: 500 }]]);

  const mockPoolForExport = { getConnection: jest.fn().mockResolvedValue(mockConn) };
  getPool.mockResolvedValue(mockPoolForExport);

  jest.spyOn(require('fs').promises, 'writeFile').mockResolvedValue(undefined);

  const result = await handlersMap['export-seed'](mockEvent);

  expect(result.success).toBe(true);
  expect(result.filePath).toBe('/tmp/dump.sql');
  expect(require('fs').promises.writeFile).toHaveBeenCalledTimes(1);

  const writtenContent = require('fs').promises.writeFile.mock.calls[0][1];
  expect(writtenContent).toContain('-- Kvant seed dump');
  expect(writtenContent).toContain('INSERT INTO `users`');
  expect(writtenContent).toContain('Alice');
  expect(writtenContent).toContain('INSERT INTO `orders`');
  expect(writtenContent).toContain('500');
});

    it('таблицы без строк — не пишет INSERT', async () => {
      const mockEvent = { sender: { send: jest.fn() } };
      dialog.showSaveDialog.mockResolvedValue({ filePath: '/tmp/empty.sql', canceled: false });

      const mockConn = {
        query: jest.fn(),
        release: jest.fn(),
      };
      mockConn.query
        .mockResolvedValueOnce([[{ Tables_in_db: 'empty_table' }]])
        .mockResolvedValueOnce([[]]);

      getPool.mockResolvedValue({ getConnection: jest.fn().mockResolvedValue(mockConn) });

      jest.spyOn(require('fs').promises, 'writeFile').mockResolvedValue(undefined);

      await handlersMap['export-seed'](mockEvent);

      const content = require('fs').promises.writeFile.mock.calls[0][1];
      expect(content).not.toContain('INSERT INTO');
      expect(content).toContain('-- Kvant seed dump');
    });

    it('ошибка при экспорте → возвращает ошибку', async () => {
      dialog.showSaveDialog.mockResolvedValue({ filePath: '/tmp/dump.sql', canceled: false });
      getPool.mockRejectedValue(new Error('Нет соединения с БД'));

      const result = await handlersMap['export-seed']();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Нет соединения');
    });
  });

  describe('import-seed', () => {
    it('отмена диалога → success: false', async () => {
      dialog.showOpenDialog.mockResolvedValue({ canceled: true });
      const result = await handlersMap['import-seed']();
      expect(result).toEqual({ success: false, message: 'discard' });
    });

    it('успешный импорт', async () => {
      const mockEvent = { sender: { send: jest.fn() } };
      dialog.showOpenDialog.mockResolvedValue({ filePaths: ['/tmp/seed.sql'], canceled: false });

      jest.spyOn(require('fs').promises, 'readFile').mockResolvedValue('INSERT INTO users VALUES (1,"test");');

      const mockConn = {
        query: jest.fn().mockResolvedValue(undefined),
        release: jest.fn(),
      };
      getPool.mockResolvedValue({ getConnection: jest.fn().mockResolvedValue(mockConn) });

      const result = await handlersMap['import-seed'](mockEvent);

      expect(result.success).toBe(true);
      expect(result.processedInserts).toBe(1);
      expect(require('fs').promises.readFile).toHaveBeenCalledWith('/tmp/seed.sql', 'utf8');
      expect(mockConn.query).toHaveBeenCalledWith('INSERT INTO users VALUES (1,"test");');
    });

    it('ошибка чтения файла', async () => {
      dialog.showOpenDialog.mockResolvedValue({ filePaths: ['/missing.sql'], canceled: false });
      jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('ENOENT: no such file'));

      const result = await handlersMap['import-seed']();
      expect(result.success).toBe(false);
      expect(result.message).toContain('ENOENT');
    });

    it('ошибка выполнения SQL — ошибки в запросах не прерывают импорт, processedInserts без учёта упавших', async () => {
      const mockEvent = { sender: { send: jest.fn() } };
      dialog.showOpenDialog.mockResolvedValue({ filePaths: ['/bad.sql'], canceled: false });
      jest.spyOn(require('fs').promises, 'readFile').mockResolvedValue('INSERT INTO nonexistent VALUES (1);');

      const mockConn = {
        query: jest.fn()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error('Table doesn\'t exist'))
          .mockResolvedValueOnce(undefined),
        release: jest.fn(),
      };
      getPool.mockResolvedValue({ getConnection: jest.fn().mockResolvedValue(mockConn) });

      const result = await handlersMap['import-seed'](mockEvent);
      expect(result.success).toBe(true);
      expect(result.processedInserts).toBe(0);
    });
  });

  describe('restart-app', () => {
    it('вызывает relaunch + quit', () => {
      handlersMap['restart-app']();
      expect(app.relaunch).toHaveBeenCalledTimes(1);
      expect(app.quit).toHaveBeenCalledTimes(1);
    });
  });

  describe('open-db-setup', () => {
    it('открывает окно настройки БД', () => {
      handlersMap['open-db-setup']();
      expect(createSetupWindow).toHaveBeenCalledWith(mainWindowMock);
    });
  });

  describe('open-backup', () => {
    it('открывает окно бэкапов', () => {
      handlersMap['open-backup']();
      expect(createBackupWindow).toHaveBeenCalledWith(mainWindowMock);
    });
  });
});