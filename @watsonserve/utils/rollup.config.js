import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import * as path from 'path'
import * as fsp from 'fs/promises'

function asmResolve({ matcher }) {
  return {
    name: 'wasm_resolve',
    resolveId(id) {
      const ok = !!id.match(matcher);
      return ok && { id, external: false } || null;
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
         // asc({
         //    matcher: /assembly\/(.+)$/,
         //    compilerOptions: {
         //       target: 'release'
         //    }
         // }),
         // replace({
         //    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
         // }),
         // json()
      ]
   }
]
