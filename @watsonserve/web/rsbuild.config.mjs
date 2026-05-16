import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginStylus } from '@rsbuild/plugin-stylus';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import { pluginSvgr } from '@rsbuild/plugin-svgr';

export default defineConfig({
  plugins: [pluginReact(), pluginStylus(), pluginNodePolyfill(), pluginSvgr()],
  resolve: {
    alias: {
      '@': './src',
    },
  },
  server: {
    // https://rsbuild.rs/zh/config/server/public-dir
    publicDir: { name: 'public', copyOnBuild: 'auto', watch: false },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        pathRewrite: { '^/api': '' },
      },
    }
  }
});
