const fs = require('fs/promises');

(async function() {
  await fs.rename('./dist/index/index.d.ts', './dist/index.d.ts');
  await fs.rmdir('./dist/index');
  const text = await fs.readFile('./package.json');
  const conf = JSON.parse(text);
  delete conf.scripts;
  delete conf.devDependencies;
  conf.peerDependencies['@watsonserve/utils'] = '^0.0.1';
  conf.main = 'index.js';
  await fs.writeFile('./dist/package.json', JSON.stringify(conf, null, 2));
})();
