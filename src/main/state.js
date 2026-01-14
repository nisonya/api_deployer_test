let apiServer = null;

module.exports = {
  getApiServer: () => apiServer,
  setApiServer: (server) => { apiServer = server; },
};