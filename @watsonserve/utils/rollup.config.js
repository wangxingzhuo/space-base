import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import * as path from 'path'
import * as fsp from 'fs/promises'

function asmResolve({ matcher }) {
  return {
    name: 'wasm_resolve',
    async resolveId(id) {
      if (!id.match(matcher)) return null;

      if (id.endsWith('.wasm')) return { id, external: false };

      const pkgDir = path.join(import.meta.dirname, 'node_modules', id);
      const pkg = await fsp.readFile(path.join(pkgDir, 'package.json'));
      const entry = JSON.parse(pkg).main;
      return { id: path.join(pkgDir, entry), external: false };
    },
    async load(id) {
      if (!id.endsWith('.wasm')) return;

      const wasm = await fsp.readFile(id);
      const dts = await fsp.readFile(path.join(path.dirname(id), 'index.d.ts'));
      this.emitFile({ type: 'asset', fileName: 'index.wasm', source: wasm });
      this.emitFile({ type: 'asset', fileName: 'asm.d.ts', source: dts });
      return fsp.readFile(path.join(path.dirname(id), 'index.js'), { encoding: 'utf-8' });
    },
    transform(code, id) {
      if (!id.endsWith('.wasm')) return code;

      const { body } = this.parse(code);
      const _exports = body[1].declaration.declarations[0].id.properties.map(item => item.key.name);
      const expression = `export const { ${_exports.join(', ')} } = await (async url => instantiate(await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)), {}))(new URL("index.wasm", import.meta.url));`
      return code.substring(0, body[1].start) + expression;
    }
  }
}

export default [
   {
      input: 'src/index.ts',
      output: {
         dir: 'dist',
         format: 'es'
      },
      external: ['react'],
      plugins: [
         resolve(),
         commonjs(),
         typescript(),
         asmResolve({ matcher: /@watsonserve\/asm/ })
      ]
   }
]
