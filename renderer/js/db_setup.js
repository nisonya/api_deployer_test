document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

const dbForm = document.getElementById('dbForm');
const testBtn = document.getElementById('testBtn');
const saveBtn = document.getElementById('saveBtn');
const message = document.getElementById('message');
const apiForm = document.getElementById('apiForm');
const saveApiBtn = document.getElementById('saveApiBtn');
const apiMessage = document.getElementById('apiMessage');
const restartBanner = document.getElementById('restart-banner');
const bannerText = document.getElementById('banner-text');
const restartBtn = document.getElementById('restartBtn');

function activateBanner(text = 'Настройки изменены. Перезагрузите приложение.') {
  bannerText.textContent = text;
  bannerText.classList.remove('hidden');
  restartBtn.classList.remove('hidden');
  restartBanner.classList.add('active');
}

restartBtn.addEventListener('click', () => {
  window.electronAPI.restartApp();
});

window.addEventListener('DOMContentLoaded', async () => {
  const config = await window.electronAPI.getDbConfig();
  if (config) {
    document.getElementById('host').value = config.host || '127.0.0.1';
    document.getElementById('port').value = config.port || 3306;
    document.getElementById('user').value = config.user || 'root';
    document.getElementById('password').value = config.password || '';
    document.getElementById('database').value = config.database || 'kvant';
    document.getElementById('apiPort').value = config.apiPort || 3000;
    document.getElementById('documentsRootOrg').value = config.documentsRootOrg || '';
    document.getElementById('documentsRootPart').value = config.documentsRootPart || '';
  }
});

async function getDbFormData() {
  const apiPortNum = parseInt(document.getElementById('apiPort').value, 10);
  return {
    host: document.getElementById('host').value.trim(),
    port: parseInt(document.getElementById('port').value, 10),
    user: document.getElementById('user').value.trim(),
    password: document.getElementById('password').value,
    database: document.getElementById('database').value.trim(),
    apiPort: (Number.isInteger(apiPortNum) && apiPortNum >= 1 && apiPortNum <= 65535) ? apiPortNum : 3000,
    documentsRootOrg: document.getElementById('documentsRootOrg').value.trim(),
    documentsRootPart: document.getElementById('documentsRootPart').value.trim()
  };
}

async function validateDbForm(config) {
  if (!config.host) return 'Укажите хост';
  if (!config.port || isNaN(config.port)) return 'Укажите корректный порт';
  if (!config.user) return 'Укажите пользователя';
  return null;
}

function validateApiForm(config) {
  if (!Number.isInteger(config.apiPort) || config.apiPort < 1 || config.apiPort > 65535) {
    return 'Порт API должен быть от 1 до 65535';
  }
  if (!config.documentsRootOrg) return 'Укажите каталог документов мероприятий организации';
  if (!config.documentsRootPart) return 'Укажите каталог документов мероприятий участия';
  return null;
}

document.getElementById('browseDocumentsRootOrg').addEventListener('click', async () => {
  const res = await window.electronAPI.selectDirectory();
  if (!res.canceled && res.path) {
    document.getElementById('documentsRootOrg').value = res.path;
  }
});

document.getElementById('browseDocumentsRootPart').addEventListener('click', async () => {
  const res = await window.electronAPI.selectDirectory();
  if (!res.canceled && res.path) {
    document.getElementById('documentsRootPart').value = res.path;
  }
});

testBtn.addEventListener('click', async () => {
  message.textContent = 'Проверка...';
  message.style.color = 'var(--gray)';

  const config = await getDbFormData();
  const validationError = await validateDbForm(config);
  if (validationError) {
    message.textContent = validationError;
    message.style.color = 'red';
    return;
  }

  const res = await window.electronAPI.testDBConnection(config);

  if (res.success) {
    message.textContent = 'Подключение успешно!';
    message.style.color = 'var(--accent-green)';
    saveBtn.disabled = false;
  } else {
    message.textContent = `Ошибка: ${res.message}`;
    message.style.color = 'red';
    saveBtn.disabled = true;
  }
});

dbForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const config = await getDbFormData();
  const validationError = await validateDbForm(config);
  if (validationError) {
    message.textContent = validationError;
    message.style.color = 'red';
    return;
  }

  await window.electronAPI.saveDBConfig(config);
  message.textContent = 'Настройки сохранены. Для применения перезагрузите приложение.';
  message.style.color = 'var(--accent-green)';
  activateBanner();
});

apiForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const config = await getDbFormData();
  const apiErr = validateApiForm(config);
  if (apiErr) {
    apiMessage.textContent = apiErr;
    apiMessage.style.color = 'red';
    return;
  }
  try {
    await window.electronAPI.saveDBConfig(config);
    apiMessage.textContent = 'Настройки API сохранены. Для применения перезагрузите приложение.';
    apiMessage.style.color = 'var(--accent-green)';
    activateBanner();
  } catch (err) {
    apiMessage.textContent = `Ошибка: ${err.message}`;
    apiMessage.style.color = 'red';
  }
});
