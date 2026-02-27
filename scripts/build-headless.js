const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const pkg = require(path.join(rootDir, 'package.json'));
const version = pkg.version || '1.0.0';
const outDir = path.join(rootDir, 'dist-headless');
const bundleName = `api-deployer-headless-${version}`;
const bundleDir = path.join(outDir, bundleName);

const COPY_DIRS = ['src', 'scripts'];
const COPY_FILES = ['server.js', 'package.json', 'package-lock.json'];
const OPTIONAL_FILES = ['key.pem', 'cert.pem'];
const IGNORE = new Set(['node_modules', 'dist', 'dist-headless', '.git', 'renderer', 'main.js']);

function shouldIgnore(relPath) {
  return relPath.split(path.sep).some((p) => IGNORE.has(p));
}

async function copyFileIfExists(src, dest) {
  try {
    await fs.access(src);
    await fs.copyFile(src, dest);
    return true;
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    return false;
  }
}

async function copyDir(src, dest, root) {
  const base = root ?? src;
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const srcPath = path.join(src, e.name);
    const rel = path.relative(base, srcPath);
    if (shouldIgnore(rel)) continue;
    const destPath = path.join(dest, e.name);
    if (e.isDirectory()) {
      await copyDir(srcPath, destPath, base);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  await fs.mkdir(bundleDir, { recursive: true });

  for (const f of COPY_FILES) {
    await copyFileIfExists(path.join(rootDir, f), path.join(bundleDir, f));
  }

  for (const dir of COPY_DIRS) {
    const src = path.join(rootDir, dir);
    try {
      await fs.access(src);
      await copyDir(src, path.join(bundleDir, dir), rootDir);
    } catch (e) {
      if (e.code === 'ENOENT') continue;
      throw e;
    }
  }

  for (const f of OPTIONAL_FILES) {
    await copyFileIfExists(path.join(rootDir, f), path.join(bundleDir, f));
  }

  const archivePath = path.join(outDir, `${bundleName}.tar.gz`);
  execSync(`tar -czf "${archivePath}" -C "${outDir}" "${bundleName}"`, { stdio: 'inherit' });
  console.log('Создан архив:', archivePath);
  console.log(`На сервере: tar -xzf ${bundleName}.tar.gz && cd ${bundleName} && npm ci --production && node scripts/setup-cli.js && node server.js`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
