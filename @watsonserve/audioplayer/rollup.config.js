import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import builtins from 'rollup-plugin-node-builtins'
import polyfill from 'rollup-plugin-polyfill-node'

export default [
   // {
   //    input: {
   //       index: 'src/index.ts',
   //       lib: 'src/base.ts'
   //    },
   //    output: {
   //       dir: 'dist',
   //       format: 'es'
   //    },
   //    plugins: [
   //       nodeResolve({ preferBuiltins: true }),
   //       typescript(),
   //    ]
   // },
   {
      input: {
         bg: 'src/bg.ts',
         index: 'src/index.ts',
         base: 'src/base.ts'
      },
      output: {
         dir: 'dist',
         format: 'es'
      },
      plugins: [
         nodeResolve({ browser: true, preferBuiltins: true, moduleDirectories: ['node_modules'] }),
         builtins(),
         polyfill({ include: 'events' }),
         typescript(),
         commonjs(),
      ]
   }
]
