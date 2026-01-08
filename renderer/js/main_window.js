const statusEl = document.getElementById('status');
const addressEl = document.getElementById('address');
const switchEl = document.getElementById('serverSwitch');
const settingsBtn = document.getElementById('settingsBtn');
const backUpBtn = document.getElementById('backupHeader');
async function updateStatus() {
  const res = await window.electronAPI.getApiStatus();
  if (res.running) {
    statusEl.textContent = 'Сервер запущен';
    addressEl.textContent = 'https://localhost:3000';
    switchEl.checked = true;
  } else {
    statusEl.textContent = 'Сервер остановлен';
    addressEl.textContent = '';
    switchEl.checked = false;
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