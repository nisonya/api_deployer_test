/**
 * Создаёт build/icon.png для Linux-сборки из icon.ico.
 * Требуется ImageMagick: sudo apt install imagemagick
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const icoPath = path.join(__dirname, '..', 'build', 'icon.ico');
const pngPath = path.join(__dirname, '..', 'build', 'icon.png');

if (fs.existsSync(pngPath)) {
  console.log('icon.png уже существует');
  process.exit(0);
}

if (!fs.existsSync(icoPath)) {
  console.error('Ошибка: build/icon.ico не найден');
  process.exit(1);
}

try {
  execSync(`convert "${icoPath}" -resize 256x256 "${pngPath}"`, { stdio: 'inherit' });
  console.log('icon.png создан');
} catch (e) {
  try {
    execSync(`magick "${icoPath}" -resize 256x256 "${pngPath}"`, { stdio: 'inherit' });
    console.log('icon.png создан');
  } catch (e2) {
    console.error('Установите ImageMagick: sudo apt install imagemagick');
    process.exit(1);
  }
}
