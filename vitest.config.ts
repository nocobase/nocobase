import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { alias } from './scripts/testUtils';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './scripts/setupVitest.ts',
    css: true,
    threads: false,
    maxThreads: 1,
    alias,
    include: ['packages/**/src/**/*.test.(tsx|ts)'],
    exclude: ['packages/**/node_modules', 'packages/**/lib', 'packages/**/dist', 'packages/**/es'],
    testTimeout: 300000,
  },
});
