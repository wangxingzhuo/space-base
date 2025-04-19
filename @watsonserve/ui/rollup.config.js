import fs from 'node:fs/promises';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';

const conf = (async function() {
  const list = await fs.readdir('./src');
  const input = list.reduce((pre, item) => {
    if ('.' !== item[0] && !['helper', 'index', 'types.ts'].includes(item)) {
      pre[`${item}/index`] = `./src/${item}/index.tsx`;
    }
    return pre;
  }, {
    'index': './src/index/index.ts'
  });

  return {
    input,
    output: {
      dir: 'dist',
      format: 'esm',
    },
    treeshake: true,
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    plugins: [
      typescript({}),
      postcss(),
      commonjs(),
      nodeResolve()
    ]
  };
})()

export default conf;
