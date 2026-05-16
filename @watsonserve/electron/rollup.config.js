const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const replace = require('@rollup/plugin-replace');
const nodeResolve = require('@rollup/plugin-node-resolve');

module.exports = function() {
   return [
      // electron
      {
         input: {
            main: __dirname + '/src/main.ts',
            preload: __dirname + '/src/preload.ts',
            'bg-preload': __dirname + '/src/bg-preload.ts',
         },
         output: {
            dir: 'build',
            format: 'cjs'
         },
         plugins: [
            nodeResolve({ preferBuiltins: true }),
            typescript({
               tsconfig: __dirname + '/tsconfig.json', // 导入本地ts配置
               exclude: ['.js', '.ts', '.tsx']
            }),
            commonjs(),
            replace({
               preventAssignment: true,
               'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
            })
         ],
         external: ['electron']
      }
   ];
}
