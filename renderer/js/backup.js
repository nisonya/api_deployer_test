const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const message = document.getElementById('message');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
window.electronAPI.onImportProgress((progress) => {
  progressContainer.classList.remove('hidden');
  progressBar.value = progress;
  progressText.textContent = `${progress}%`;
  message.textContent = `Импорт... ${progress}%`;
});
window.electronAPI.onExportProgress((progress) => {
  progressContainer.classList.remove('hidden');
  progressBar.value = progress;
  progressText.textContent = `${progress}%`;
  message.textContent = `Экспорт... ${progress}%`;
});
exportBtn.addEventListener('click', async () => {
  message.textContent = 'Подготовка экспорта...';
  progressContainer.classList.add('hidden'); // скрываем бар перед стартом
  const res = await window.electronAPI.exportSeed();
  progressContainer.classList.add('hidden');
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
  progressContainer.classList.add('hidden');
  const res = await window.electronAPI.importSeed();
  progressContainer.classList.add('hidden');
  if (res.success) {
    message.textContent = 'Импорт завершён успешно. Перезапустите приложение.';
    message.style.color = 'var(--accent-green)';
  } else {
    message.textContent = `Ошибка: ${res.message}`;
    message.style.color = 'red';
  }
});