import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginStylus } from '@rsbuild/plugin-stylus';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import { pluginSvgr } from '@rsbuild/plugin-svgr';

export default defineConfig({
  output: {
    distPath: 'stock'
  },
  plugins: [pluginReact(), pluginStylus(), pluginNodePolyfill(), pluginSvgr()],
  alias: {
    '@': './src',
  },
  server: {
    port: 8088,
    // https://rsbuild.rs/zh/config/server/public-dir
    publicDir: { name: 'public', copyOnBuild: 'auto', watch: false },
    proxy: {
      '/api': {
        target: 'https://stock.watsonserve.com',
        secure: false,
        changeOrigin: true,
        headers: {
          Cookie: 'sess=sta918dc2a3a132784ac8712a5d9064666'
        }
        // pathRewrite: { '^/api': '' },
      },
    }
  }
});
