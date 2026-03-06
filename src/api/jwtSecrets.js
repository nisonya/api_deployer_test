let cached = { access: null, refresh: null };

function setSecrets(accessSecret, refreshSecret) {
  cached = { access: accessSecret || null, refresh: refreshSecret || null };
}

function getAccessSecret() {
  return cached.access;
}

function getRefreshSecret() {
  return cached.refresh;
}

module.exports = { setSecrets, getAccessSecret, getRefreshSecret };
