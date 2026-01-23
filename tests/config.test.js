const { getDbConfig, setDbConfig, updateApiPort } = require('../src/common/config');

jest.mock('electron-store', () => {
  let storeData = { dbConfig: null };
  return class MockStore {
    constructor() {}
    get(key) { return storeData[key]; }
    set(key, value) { storeData[key] = value; }
    has(key) { return storeData[key] !== undefined; }
    delete(key) { delete storeData[key]; }
  };
});

describe('config.js — сохранение пароля', () => {
  beforeEach(() => {
    // Сбрасываем хранилище перед каждым тестом
    setDbConfig(null);
  });

  it('setDbConfig save all fields', async () => {
    const fullConfig = {
      host: 'test.host',
      port: 3307,
      user: 'testuser',
      password: 'mySuperSecretPass123!',
      database: 'testdb',
      apiPort: 4000
    };

    await setDbConfig(fullConfig);

    const saved = await getDbConfig();
    expect(saved).toEqual(fullConfig);
    expect(saved.password).toBe('mySuperSecretPass123!'); // пароль сохранился
  });

  it('updateApiPort changes only apiPort and does not changes pass', async () => {
   
    const initialConfig = {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'secret123',
      database: 'kvant',
      apiPort: 3000
    };
    await setDbConfig(initialConfig);

    await updateApiPort(5000);

    const updated = await getDbConfig();

    expect(updated.apiPort).toBe(5000); 
    expect(updated.password).toBe('secret123'); 
    expect(updated.host).toBe('localhost'); 
    expect(updated.user).toBe('root');
  });

  it('updateApiPort throws error when port is incorrect', async () => {
    await expect(updateApiPort(80)).rejects.toThrow(
      'Некорректный порт API (должен быть от 1024 до 65535)'
    );
    await expect(updateApiPort(99999)).rejects.toThrow(
      'Некорректный порт API (должен быть от 1024 до 65535)'
    );
    const config = await getDbConfig();
    expect(config).toBeNull(); 
  });

  it('setDbConfig затирает пароль, если он не передан', async () => {
  await setDbConfig({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'oldpass',
    database: 'kvant',
    apiPort: 3000
  });

  // Обновляем с пустым паролем (имитация очистки поля)
  await setDbConfig({
    host: 'localhost',
    port: 3306,
    user: 'admin',
    password: '',  // ← пустой пароль
    database: 'kvant'
  });

  const saved = await getDbConfig();
  expect(saved.user).toBe('admin');
  expect(saved.password).toBe(''); // ← затёрт, как и должно быть
  });
});