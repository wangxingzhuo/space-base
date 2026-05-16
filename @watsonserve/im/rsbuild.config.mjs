import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginStylus } from '@rsbuild/plugin-stylus';

export default defineConfig({
  plugins: [pluginReact(), pluginStylus()],
});
