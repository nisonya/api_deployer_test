// tests/config/config.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Мы НЕ используем vi.mock в начале файла

describe('config.js', () => {
  let config;
  let mockGet;
  let mockSet;
  let mockStoreConstructor;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    mockGet = vi.fn();
    mockSet = vi.fn();

    const mockStoreInstance = {
      get: mockGet,
      set: mockSet,
    };
  mockStoreConstructor = vi.fn().mockImplementation(function () {
  return mockStoreInstance;
});
    vi.doMock('electron-store', () => ({
      default: mockStoreConstructor,
    }));

    config = await import('../../src/common/config');  
  });

  afterEach(() => {
    vi.unmock('electron-store');
    vi.resetAllMocks();
  });

  describe('getDbConfig', () => {
    it('should return undefind if no config has been saved yet', async () => {
      mockGet.mockReturnValueOnce(undefined);

      const result = await config.getDbConfig();
      expect(result).toBeUndefined();
      expect(mockGet).toHaveBeenCalledWith('dbConfig');
    });

    it('should return the saved configuration', async () => {
      const savedConfig = {
        host: '10.0.0.5',
        port: 3307,
        user: 'appuser',
        password: 'secret123',
        database: 'myapp',
        apiPort: 4000,
      };

      mockGet.mockReturnValueOnce(savedConfig);

      const result = await config.getDbConfig();

      expect(result).toEqual(savedConfig);
      expect(mockGet).toHaveBeenCalledWith('dbConfig');
    });
  });

  describe('setDbConfig', () => {
    it('on first save should use default values for missing fields', async () => {
      mockGet.mockReturnValueOnce(undefined);

      const partial = {
        host: '192.168.1.100',
        database: 'testdb',
      };

      await config.setDbConfig(partial);

      expect(mockSet).toHaveBeenCalledWith('dbConfig', expect.objectContaining({
        host: '192.168.1.100',
        port: 3306,
        user: 'root',
        password: '',  // ← внимание: в твоей реализации сейчас затирается
        database: 'testdb',
        apiPort: 3000,
      }));
    });

    it('should update only provided fields (merge behavior)', async () => {
      const existing = {
        host: 'localhost',
        port: 3306,
        user: 'admin',
        password: 'oldpass',
        database: 'prod',
        apiPort: 8080,
      };

      mockGet.mockReturnValueOnce(existing);

      await config.setDbConfig({
        password: 'newsecurepass',
        apiPort: 5000,
      });

      expect(mockSet).toHaveBeenCalledWith('dbConfig', expect.objectContaining({
        password: 'newsecurepass',
        apiPort: 5000,
      }));
    });

    it('should overwrite password with undefined if it was not provided', async () => {
  const existing = {
    host: 'db.example.com',
    password: 'verysecret',
    apiPort: 3001,
  };

  mockGet.mockReturnValueOnce(existing);

  await config.setDbConfig({ host: 'newdb.example.com' });

  expect(mockSet).toHaveBeenCalledWith('dbConfig', expect.objectContaining({
    host: 'newdb.example.com',
    password: '',       
  }));
});
  });

  describe('updateApiPort', () => {
    it('should update only the apiPort field', async () => {
      const existing = {
        host: '127.0.0.1',
        user: 'test',
        password: 'pass',
        database: 'app',
        apiPort: 3000,
      };

      mockGet.mockReturnValueOnce(existing);

      await config.updateApiPort(4444);

      expect(mockSet).toHaveBeenCalledWith('dbConfig', {
        ...existing,
        apiPort: 4444,
      });
    });

    it.each([
      [80],
      [1023],
      [0],
      [-5],
      [65536],
      [70000],
      ['3000'],
      [null],
      [undefined],
      [NaN],
    ])('should throw error for invalid port value: %p', async (invalidPort) => {
      await expect(config.updateApiPort(invalidPort)).rejects.toThrow(
        'Invalid API port (must be between 1024 and 65535)'
      );
      expect(mockSet).not.toHaveBeenCalled();
    });

    it('should accept boundary values 1024 and 65535', async () => {
      mockGet.mockReturnValueOnce({ apiPort: 3000 });

      await expect(config.updateApiPort(1024)).resolves.not.toThrow();
      await expect(config.updateApiPort(65535)).resolves.not.toThrow();
    });
  });

  describe('isConfigured', () => {
    it('should return false when no config exists', async () => {
      mockGet.mockReturnValueOnce(undefined);
      mockGet.mockReturnValueOnce(null);

      expect(await config.isConfigured()).toBe(false);
      expect(await config.isConfigured()).toBe(false);
    });

    it('should return true when config exists (even empty object)', async () => {
      mockGet.mockReturnValueOnce({});
      expect(await config.isConfigured()).toBe(true);

      mockGet.mockReturnValueOnce({ apiPort: 3000 });
      expect(await config.isConfigured()).toBe(true);
    });
  });

  describe('lazy initialization behavior', () => {
    it('should create Store instance only once', async () => {
      mockGet.mockReturnValue(null);

      await config.getDbConfig();
      await config.getDbConfig();
      await config.setDbConfig({ host: 'test' });
      await config.isConfigured();

      expect(mockStoreConstructor).toHaveBeenCalledTimes(1);
    });
  });
});