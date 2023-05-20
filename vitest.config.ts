import { defineConfig } from 'vitest/config';
import { alias } from './testUtils';

export default defineConfig({
  test: {
    globals: true,
    // 客户端运行测试时使用 jsdom 环境
    environmentMatchGlobs: [
      ['packages/**/*.test.tsx', 'jsdom'],
      ['packages/**/{dumi-theme-nocobase,sdk,client}/**', 'jsdom'],
    ],
    // 为客户端打开多线程，以提高测试速度
    poolMatchGlobs: [
      ['packages/**/*.test.tsx', 'threads'],
      ['packages/**/{dumi-theme-nocobase,sdk,client}/**', 'threads'],
    ],
    setupFiles: 'scripts/setupVitest.ts',
    css: true,
    // 默认关闭多线程，因为在 server 端运行测试时，多线程会导致测试失败
    threads: false,
    singleThread: true,
    alias,
    include: ['packages/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/lib/**',
      '**/es/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],
    testTimeout: 300000,
    hookTimeout: 300000,
    teardownTimeout: 300000,
  },
});
