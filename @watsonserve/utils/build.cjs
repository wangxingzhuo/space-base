const fs = require('fs/promises');

async function mkPkg() {
  const pkgTxt = await fs.readFile('package.json', { encoding: 'utf-8' });
  const pkg = JSON.parse(pkgTxt);
  pkg.main = 'index.js';
  pkg.type = 'module';
  pkg.private = false;
  pkg.publishConfig = { access: 'public' };
  delete pkg.scripts;
  delete pkg.dependencies['@watsonserve/asm'];

  await fs.writeFile('./dist/package.json', JSON.stringify(pkg));
}

async function rewriteDts() {
  const dtsFile = './dist/index.d.ts';
  let dts = await fs.readFile(dtsFile, { encoding: 'utf-8' });
  dts = dts.replace('export * from \'@watsonserve/asm\';', 'export * from \'./asm\';\n');
  await fs.writeFile(dtsFile, dts);
}

(async () => {
  await Promise.all([
    mkPkg(),
    rewriteDts(),
  ]);
})();
