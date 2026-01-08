let Store = null;

async function getStore() {
  if (!Store) {
    const mod = await import('electron-store');
    Store = mod.default;
  }
  return new Store({
    encryptionKey: process.env.STORE_ENCRYPTION_KEY || undefined,
    defaults: { dbConfig: null }
  });
}
module.exports = {
  async getDbConfig() {
    const store = await getStore();
    return store.get('dbConfig');
  },
  async setDbConfig(config) {
    const store = await getStore();
    store.set('dbConfig', {
    host: config.host || '127.0.0.1',
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    apiPort: config.apiPort || 3000
    });
  },
  async isConfigured() {
    const store = await getStore();
    return !!store.get('dbConfig');
  }
};