const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const message = document.getElementById('message');

exportBtn.addEventListener('click', async () => {
  message.textContent = 'Подготовка экспорта...';
  const res = await window.electronAPI.exportSeed();
  if (res.success) {
    message.textContent = `Экспорт сохранён: ${res.filePath}`;
    message.style.color = 'var(--accent-green)';
  } else {
    message.textContent = `Ошибка: ${res.message}`;
    message.style.color = 'red';
  }
});

importBtn.addEventListener('click', async () => {
  message.textContent = 'Выберите файл для импорта...';
  const res = await window.electronAPI.importSeed();
  if (res.success) {
    message.textContent = 'Импорт завершён успешно. Перезапустите приложение.';
    message.style.color = 'var(--accent-green)';
  } else {
    message.textContent = `Ошибка: ${res.message}`;
    message.style.color = 'red';
  }
});