const form = document.getElementById('dbForm');
const testBtn = document.getElementById('testBtn');
const saveBtn = document.getElementById('saveBtn');
const message = document.getElementById('message');

async function getFormData() {
  return {
    host: document.getElementById('host').value.trim(),
    port: parseInt(document.getElementById('port').value),
    user: document.getElementById('user').value.trim(),
    password: document.getElementById('password').value,
    database: document.getElementById('database').value.trim()
  };
}

testBtn.addEventListener('click', async () => {
  message.textContent = 'Проверка...';
  message.style.color = 'var(--gray)';

  const config = await getFormData();
  const res = await window.electronAPI.testDbConnection(config);

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