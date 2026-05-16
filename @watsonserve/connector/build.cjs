const fs = require('fs/promises');
const path = require('path');

(async function() {
  const pkgTxt = await fs.readFile(path.join(__dirname, 'package.json'), { encoding: 'utf-8' });
  const pkg = JSON.parse(pkgTxt);
  pkg.main = 'index.js';
  pkg.type = 'module';
  pkg.private = false;
  pkg.publishConfig = { access: 'public' };
  pkg.peerDependencies['@watsonserve/utils'] = '^0.0.1';
  delete pkg.scripts;
  delete pkg.devDependencies;

  await fs.writeFile('./dist/package.json', JSON.stringify(pkg, null, 2));
})();
