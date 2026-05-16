import { readFile, writeFile } from 'fs/promises';

(async function run() {
  const txt = await readFile('./package.json', 'utf-8');
  const pkg = JSON.parse(txt);
  pkg.main = 'main.js';
  delete pkg.devDependencies;
  const { setup } = pkg.scripts;
  pkg.scripts = { setup };
  pkg.dependencies['@watsonserve/stock-base'] = '^0.1.0';
  await writeFile('dist/package.json', JSON.stringify(pkg, null, 2));
})();

// const tsc = spawn('tsc', ['-p', 'tsconfig.json']);

// tsc.stdout.on('data', (data) => {
//   console.log(`stdout: ${data}`);
// });

// tsc.stderr.on('data', (data) => {
//   console.error(`stderr: ${data}`);
// });

// tsc.on('close', (code) => {
//   console.log(`child process exited with code ${code}`);
//   !code && run();
// });
