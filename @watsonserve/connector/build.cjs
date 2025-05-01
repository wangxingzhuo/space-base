const fs = require('fs/promises');

(async function() {
  const pkgTxt = await fs.readFile('package.json', { encoding: 'utf-8' });
  const pkg = JSON.parse(pkgTxt);
  pkg.main = 'index.js';
  pkg.type = 'module';
  pkg.private = false;
  pkg.publishConfig = { access: 'public' };
  delete pkg.scripts;
  pkg.devDependencies;
  pkg.dependencies = Object.entries(pkg.devDependencies).reduce((pre, item) => {
    const [k, v] = item;
    if (k.startsWith('@types/')) {
      pre[k] = v;
    }
    return pre;
  }, {});

  await fs.writeFile('./dist/package.json', JSON.stringify(pkg));
})();
