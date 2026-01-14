jest.mock('electron', () => ({
  app: {
    relaunch: jest.fn(),
    quit: jest.fn(),
    exit: jest.fn(),
    whenReady: jest.fn().mockResolvedValue(),
    on: jest.fn(),  // ← добавь это! (app.on — это функция)
  },
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
  },
  BrowserWindow: jest.fn(),
  dialog: {
    showSaveDialog: jest.fn(),
    showOpenDialog: jest.fn(),
  },
}));

jest.mock('../../src/common/config', () => ({
  getDbConfig: jest.fn(),
  setDbConfig: jest.fn().mockResolvedValue(),
  isConfigured: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/api/app', () => ({
  startApi: jest.fn().mockResolvedValue({}),
  stopApi: jest.fn().mockResolvedValue(),
  getStatus: jest.fn().mockReturnValue({ running: false }),
}));

jest.mock('mysql2/promise', () => ({
  createPool: jest.fn().mockReturnValue({
    query: jest.fn().mockResolvedValue([[{ '1': 1 }]]),
    end: jest.fn().mockResolvedValue(),
  }),
}));

jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(),
  readFile: jest.fn().mockResolvedValue('fake sql content'),
}));

// Загружаем main.js после всех моков
require('../../src/main/ipcHandlers').registerHandlers({});

const { ipcMain, app, dialog } = require('electron');

describe('IPC Handlers in main.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get-db-config', () => {
    it('returns config without password', async () => {
      require('../../src/common/config').getDbConfig.mockResolvedValue({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'secret',
        database: 'kvant',
        apiPort: 3000,
      });

      const handler = ipcMain.handle.mock.calls.find(
        ([channel]) => channel === 'get-db-config'
      )[1];

      const result = await handler();

      expect(result).toEqual({
        host: 'localhost',
        port: 3306,
        user: 'root',
        database: 'kvant',
        apiPort: 3000,
      });
      expect(result.password).toBeUndefined(); // проверяем, что пароль скрыт
    });

    it('возвращает null если конфига нет', async () => {
      require('../../src/common/config').getDbConfig.mockResolvedValue(null);

      const handler = ipcMain.handle.mock.calls.find(
        ([channel]) => channel === 'get-db-config'
      )[1];

      const result = await handler();
      expect(result).toBeNull();
    });
  });

  describe('save-db-config', () => {
    it('сохраняет конфиг и возвращает успех', async () => {
      const fakeConfig = { host: 'test', port: 3307 };
      const handler = ipcMain.handle.mock.calls.find(
        ([channel]) => channel === 'save-db-config'
      )[1];

      const result = await handler({}, fakeConfig);

      expect(require('../../src/common/config').setDbConfig).toHaveBeenCalledWith(fakeConfig);
      expect(result).toEqual({ success: true });
    });
  });

  describe('test-db-connection', () => {
  let handler;

  beforeAll(() => {
    // Находим handler один раз (чтобы не искать каждый раз)
    handler = ipcMain.handle.mock.calls.find(
      ([channel]) => channel === 'test-db-connection'
    )[1];
  });

  beforeEach(() => {
    // Сбрасываем все вызовы mysql2 перед каждым тестом
    require('mysql2/promise').createPool.mockClear();
  });

  it('успешное подключение', async () => {
    const fakeConfig = { host: 'localhost', port: 3306, user: 'root', password: '' };

    const result = await handler({}, fakeConfig);

    expect(result).toEqual({ success: true });

    // Проверяем, что query и end были вызваны
    const mockPool = require('mysql2/promise').createPool();
    expect(mockPool.query).toHaveBeenCalledWith('SELECT 1');
    expect(mockPool.end).toHaveBeenCalled();
  });

  it('ошибка подключения — ECONNREFUSED', async () => {
    const fakeConfig = { host: 'wrong', port: 9999 };

    // Переопределяем mock только для этого теста
    require('mysql2/promise').createPool.mockImplementationOnce(() => {
      throw { code: 'ECONNREFUSED' };
    });

    const result = await handler({}, fakeConfig);

    expect(result).toEqual({
      success: false,
      message: 'Сервер БД не запущен или порт неверный.',
    });
  });

  it('ошибка — неверный пароль (ER_ACCESS_DENIED_ERROR)', async () => {
    const fakeConfig = { host: 'localhost', port: 3306, user: 'root', password: 'wrong' };

    require('mysql2/promise').createPool.mockImplementationOnce(() => {
      throw { code: 'ER_ACCESS_DENIED_ERROR' };
    });

    const result = await handler({}, fakeConfig);

    expect(result).toEqual({
      success: false,
      message: 'Неверный пользователь или пароль.',
    });
  });

  it('ошибка — нет доступа к БД (ER_DBACCESS_DENIED_ERROR)', async () => {
    const fakeConfig = { host: 'localhost', port: 3306, user: 'root', password: '' };

    require('mysql2/promise').createPool.mockImplementationOnce(() => {
      throw { code: 'ER_DBACCESS_DENIED_ERROR' };
    });

    const result = await handler({}, fakeConfig);

    expect(result).toEqual({
      success: false,
      message: 'Нет доступа к БД.',
    });
  });

  it('любая другая ошибка — общий текст', async () => {
    const fakeConfig = { host: 'localhost', port: 3306 };

    require('mysql2/promise').createPool.mockImplementationOnce(() => {
      throw new Error('Unknown error');
    });

    const result = await handler({}, fakeConfig);

    expect(result).toEqual({
      success: false,
      message: 'Не удалось подключиться. Проверьте данные.',
    });
  });
});

  describe('start-api', () => {
    it('запускает API если не запущен', async () => {
      require('../../src/api/app').startApi.mockResolvedValue('server instance');

      const handler = ipcMain.handle.mock.calls.find(
        ([channel]) => channel === 'start-api'
      )[1];

      const result = await handler();

      expect(result).toEqual({ success: true, message: 'API запущен' });
      expect(require('../../src/api/app').startApi).toHaveBeenCalled();
    });

    it('возвращает ошибку если уже запущен', async () => {
      // имитируем запущенный сервер
      global.apiServer = {}; // хак, потому что переменная глобальная в main.js

      const handler = ipcMain.handle.mock.calls.find(
        ([channel]) => channel === 'start-api'
      )[1];

      const result = await handler();

      expect(result).toEqual({ success: false, message: 'API уже запущен' });
    });
  });

  // Добавь аналогично для stop-api, export-seed, import-seed

  afterAll(() => {
    jest.restoreAllMocks();
  });
});