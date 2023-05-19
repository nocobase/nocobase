import { defineConfig } from 'vitest/config';
import { alias } from './scripts/testUtils';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './scripts/setupVitest.ts',
    css: false,
    threads: false,
    maxThreads: 1,
    alias,
    include: ['packages/**/src/**/*.test.(tsx|ts)'],
    exclude: ['packages/**/node_modules', 'packages/**/lib', 'packages/**/dist', 'packages/**/es'],
    testTimeout: 300000,
    bail: 10,
    deps: {
      interopDefault: true,
    },
  },
});
