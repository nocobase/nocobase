import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    setupFiles: 'scripts/setupVitest.ts',
    environment: 'jsdom',
    css: true,
    threads: true,
    alias: [
      { find: '@nocobase/evaluators/client', replacement: 'packages/core/evaluators/src/client' },
      { find: '@nocobase/utils/client', replacement: 'packages/core/utils/src/client' },
      { find: /^@nocobase\/app-(.*)/, replacement: 'packages/$1/src' },
      { find: /^@nocobase\/plugin-sample-(.*)/, replacement: 'packages/samples/$1/src' },
      { find: /^@nocobase\/plugin-pro-(.*)/, replacement: 'packages/pro-plugins/$1/src' },
      { find: /^@nocobase\/plugin-(.*)/, replacement: 'packages/plugins/$1/src' },
      { find: /^@nocobase\/preset-(.*)/, replacement: 'packages/presets/$1/src' },
      { find: /^@nocobase\/(.*)/, replacement: 'packages/core/$1/src' },
    ],
    include: ['packages/**/{dumi-theme-nocobase,sdk,client}/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/lib/**', '**/es/**', '**/{vitest,commitlint}.config.*'],
    testTimeout: 300000,
    bail: 1,
  },
});
