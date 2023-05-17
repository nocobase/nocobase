import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './scripts/setupVitest.ts',
    css: true,
    alias: {
      '@nocobase/client': path.resolve('packages/core/client/src'),
      '@nocobase/sdk': path.resolve('packages/core/sdk/src'),
    },
    include: ['packages/**/src/**/*.test.tsx|ts'],
    testTimeout: 300000,
  },
});
