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

  await fs.writeFile('../audio-player/package.json', JSON.stringify(pkg));
}

(async () => {
  await fs.rm('dist/core', { recursive: true, force: true });
  await fs.rm('dist/bg.d.ts', { recursive: true, force: true });
  await fs.cp('src/types/core.d.ts', 'dist/core.d.ts');
  await fs.rm('../audio-player', { recursive: true, force: true });
  await fs.mkdir('../audio-player');

  const files = await fs.readdir('./dist', 'utf-8');
  await Promise.all(files.reduce((pre, fn) => {
    if (fn.endsWith('.js')) {
      pre.push(fs.rename(`dist/${fn}`, `../audio-player/${fn}`));
    }
    return pre;
  }, []));
  await fs.cp('dist/base.d.ts', '../audio-player/base.d.ts');
  await fs.cp(__dirname + '/index.html', '../audio-player/index.html');
  await fs.rename('dist', '../audio-player/types');
  await fs.cp(path.normalize(`${__dirname}../../../node_modules/@watsonserve/utils/dist/index.wasm`), '../audio-player/index.wasm');
  await mkPkg();
  // await fs.link(path.resolve(__dirname, '..', 'audio-player'), path.resolve(__dirname, '..', '..', 'node_modules', '@watsonserve', 'audio-player'));
})();
