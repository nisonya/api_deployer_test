let StoreInstance = null;
async function initStore() {
  if (!StoreInstance) {
    const mod = await import('electron-store');
    const Store = mod.default;
    StoreInstance = new Store({
      encryptionKey: process.env.STORE_ENCRYPTION_KEY || undefined,
      defaults: { dbConfig: null }
    });
  }
  return StoreInstance;
}
module.exports = {
  async getDbConfig() {
    const store = await initStore();
    return store.get('dbConfig');
  },
  async setDbConfig(config) {
  const store = await initStore();const current = store.get('dbConfig') || {};

  store.set('dbConfig', {
    host: config.host || current.host || '127.0.0.1',
    port: config.port || current.port || 3306,
    user: config.user || current.user,
    password: config.password,
    database: config.database || current.database || 'kvant',
    apiPort: config.apiPort || current.apiPort || 3000
  });
  },
  async updateApiPort(apiPort) {
    if (typeof apiPort !== 'number' || apiPort < 1024 || apiPort > 65535) {
      throw new Error('Некорректный порт API (должен быть от 1024 до 65535)');
    }

    const store = await initStore();
    const currentConfig = store.get('dbConfig') || {};

    store.set('dbConfig', {
      ...currentConfig,
      apiPort: apiPort
    });
  },
  async isConfigured() {
    const store = await initStore();
    return !!store.get('dbConfig');
  },
  getStoreInstance: async () => await initStore() 
};