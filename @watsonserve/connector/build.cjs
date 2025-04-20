const fs = require('fs/promises');

(async function() {
  const pkgTxt = await fs.readFile('package.json', { encoding: 'utf-8' });
  const pkg = JSON.parse(pkgTxt);
  pkg.main = 'index.js';
  pkg.type = 'module';
  pkg.private = false;
  pkg.publishConfig = { access: 'public' };
  delete pkg.scripts;
  pkg.dependencies = pkg.devDependencies;

  await fs.writeFile('./dist/package.json', JSON.stringify(pkg));
})();
