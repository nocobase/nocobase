import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './scripts/setupVitest.ts',
    css: true,
    threads: false,
    maxThreads: 1,
    alias: [
      { find: /^@nocobase\/app-(.*)/, replacement: 'packages/$1/src' },
      { find: /^@nocobase\/plugin-sample-(.*)/, replacement: 'packages/samples/$1/src' },
      { find: /^@nocobase\/plugin-pro-(.*)/, replacement: 'packages/pro-plugins/$1/src' },
      { find: /^@nocobase\/plugin-(.*)/, replacement: 'packages/plugins/$1/src' },
      { find: /^@nocobase\/preset-(.*)/, replacement: 'packages/presets/$1/src' },
      { find: /^@nocobase\/(.*)/, replacement: 'packages/core/$1/src' },
      { find: '@nocobase/evaluators/client', replacement: 'packages/core/evaluators/src/client' },
      { find: '@nocobase/utils/client', replacement: 'packages/core/utils/src/client' },
    ],
    include: ['packages/**/src/**/*.test.(tsx|ts)'],
    exclude: ['packages/**/node_modules', 'packages/**/lib', 'packages/**/dist', 'packages/**/es'],
    testTimeout: 300000,
  },
});
