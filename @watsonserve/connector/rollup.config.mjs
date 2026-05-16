import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

export default [{
  input: './src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm'
  },
  plugins: [
    typescript(),
    commonjs(),
    peerDepsExternal(),
    nodeResolve(),
  ]
}, {
  input: './src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm'
  },
  plugins: [dts()]
}];
