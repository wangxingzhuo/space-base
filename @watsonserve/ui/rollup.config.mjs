// import path from 'node:path';
import fs from 'node:fs/promises';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';

const conf = (async function() {
  const list = await fs.readdir('./src', { withFileTypes: true });
  const input = list.reduce((pre, item) => {
    const name = item.name;
    if (item.isDirectory() && '.' !== name[0] && !['helper', 'index'].includes(name)) {
      pre[`${name}/index`] = `./src/${name}/index.tsx`;
    }
    return pre;
  }, {
    'index': './src/index/index.ts'
  });

  return {
    input,
    output: {
      dir: './dist',
      format: 'esm',
    },
    treeshake: true,
    external: ['react', 'react-dom', 'react/jsx-runtime', '@watsonserve/utils'],
    plugins: [
      typescript(),
      postcss(),
      commonjs(),
      nodeResolve()
    ]
  };
})()

export default conf;
