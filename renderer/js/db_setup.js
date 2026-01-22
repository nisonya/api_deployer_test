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
  }
});

async function getDbFormData() {
  return {
    host: document.getElementById('host').value.trim(),
    port: parseInt(document.getElementById('port').value),
    user: document.getElementById('user').value.trim(),
    password: document.getElementById('password').value,
    database: document.getElementById('database').value.trim()
  };
}

async function validateDbForm(config) {
  if (!config.host) return 'Укажите хост';
  if (!config.port || isNaN(config.port)) return 'Укажите корректный порт';
  if (!config.user) return 'Укажите пользователя';
  return null;
}

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
  message.textContent = 'Настройки БД сохранены. Для применения перезагрузите приложение.';
  message.style.color = 'var(--accent-green)';
  activateBanner();
});

apiForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const apiPortInput = document.getElementById('apiPort');
  const apiPort = parseInt(apiPortInput.value);

  if (isNaN(apiPort) || apiPort < 1024 || apiPort > 65535) {
    message.textContent = 'Порт API должен быть от 1024 до 65535';
    message.style.color = 'red';
    return;
  }
  try {
    await window.electronAPI.updateApiPort(apiPort);
    message.textContent = 'Порт API сохранён. Для применения перезагрузите приложение.';
    message.style.color = 'var(--accent-green)';
    activateBanner();
  } catch (err) {
    message.textContent = `Ошибка: ${err.message}`;
    message.style.color = 'red';
  }
});
