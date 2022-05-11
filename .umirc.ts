import { defineConfig } from 'dumi';

export default defineConfig({
  title: 'NocoBase',
  outputPath: 'docs-dist',
  mode: 'site',
  resolve: {
    includes: ['docs', 'packages/client'],
  },
  hash: true,
  // more config: https://d.umijs.org/config
});
