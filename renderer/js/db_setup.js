const form = document.getElementById('dbForm');
const testBtn = document.getElementById('testBtn');
const saveBtn = document.getElementById('saveBtn');
const message = document.getElementById('message');

async function getFormData() {
  console.log('Aaaaaaaaaaaaaaaaa');
  return {
    host: document.getElementById('host').value.trim(),
    port: parseInt(document.getElementById('port').value),
    user: document.getElementById('user').value.trim(),
    password: document.getElementById('password').value,
    database: document.getElementById('database').value.trim(),
    apiPort: parseInt(document.getElementById('apiPort').value)
  };
}
async function validateForm(config) {
  if (!config.host) return 'Укажите хост';
  if (!config.port) return 'Укажите порт';
  if (!config.user) return 'Укажите пользователя';
  if (!config.database) return 'Укажите имя БД';
  if (!config.apiPort) return 'Укажите порт API';
  return null;
}
testBtn.addEventListener('click', async () => {
  message.textContent = 'Проверка...';
  message.style.color = 'var(--gray)';

  const config = await getFormData();
  const validationError = await validateForm(config);
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

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const config = await getFormData();
  await window.electronAPI.saveDbConfig(config);
  // Перезапуск происходит в main.js
});



console.log('JS загружен, слушатели добавлены');