const fs = require('fs/promises');
const path = require('path');

async function mkPkg() {
  const pkgTxt = await fs.readFile('package.json', { encoding: 'utf-8' });
  const pkg = JSON.parse(pkgTxt);
  pkg.name = '@watsonserve/audio-player';
  pkg.main = 'index.js';
  pkg.type = 'module';
  pkg.private = false;
  pkg.publishConfig = { access: 'public' };
  delete pkg.scripts;

  await fs.writeFile('./dist/package.json', JSON.stringify(pkg));
}

(async () => {
  await Promise.all([
    fs.rm('dist/timer.d.ts', { recursive: true, force: true }),
    fs.rm('dist/channel.d.ts', { recursive: true, force: true }),
    fs.rm('dist/bg.d.ts', { recursive: true, force: true }),
    fs.rm('dist/core', { recursive: true, force: true }),
  ]);
  const files = await fs.readdir('./dist', 'utf-8');
  await fs.cp('src/types', 'dist/types', { recursive: true });
  const mvs = files.map(item => {
    if (!item.endsWith('.d.ts')) return Promise.resolve();
    return fs.rename(`dist/${item}`, `dist/types/${item}`, { recursive: true });
  });
  await Promise.all([
    ...mvs,
    fs.cp('index.html', 'dist/index.html'),
    fs.cp('node_modules/@watsonserve/utils/index.wasm', 'dist/index.wasm'),
    mkPkg()
  ]);
})();
