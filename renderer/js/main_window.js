const statusEl = document.getElementById('status');
const addressEl = document.getElementById('address');
const switchEl = document.getElementById('serverSwitch');
const settingsBtn = document.getElementById('settingsBtn');
const backUpBtn = document.getElementById('backupHeader');

async function refreshConfigReadiness() {
  try {
    const r = await window.electronAPI.getConfigReadiness();
    if (r.ready) {
      switchEl.disabled = false;
      switchEl.title = '';
    } else {
      switchEl.disabled = true;
      switchEl.title = r.message || 'Заполните настройки БД и API (включая каталоги документов).';
    }
  } catch {
    switchEl.disabled = false;
    switchEl.title = '';
  }
}

async function updateStatus() {
  const res = await window.electronAPI.getApiStatus();
  const addrs = await window.electronAPI.getApiAddresses();
  if (res.running && addrs) {
    statusEl.textContent = 'Сервер запущен';
    addressEl.textContent = `${addrs.protocol}://0.0.0.0:${addrs.port}`;
    addressEl.title = `Обращайтесь по адресу вашего сервера и порту ${addrs.port}`;
    switchEl.checked = true;
    switchEl.disabled = false;
    switchEl.title = '';
  } else {
    statusEl.textContent = 'Сервер остановлен';
    addressEl.textContent = '';
    addressEl.title = '';
    switchEl.checked = false;
    await refreshConfigReadiness();
  }
}

switchEl.addEventListener('change', async () => {
  if (switchEl.checked) {
    const res = await window.electronAPI.startApi();
    if (res.success) updateStatus();
    else {
      switchEl.checked = false;
      alert(res.message);
    }
  } else {
    await window.electronAPI.stopApi();
    updateStatus();
  }
});
backUpBtn.addEventListener('click', () => {
  window.electronAPI.openBackupModal();
});

settingsBtn.addEventListener('click', () => {
  window.electronAPI.openDbSetup();
});

updateStatus(); // при загрузке
setInterval(updateStatus, 5000); // автообновление

console.log('JS загружен, слушатели добавлены');
