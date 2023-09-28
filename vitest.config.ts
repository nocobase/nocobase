import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import tsConfigPaths from './tsconfig.paths.json';

const paths = tsConfigPaths.compilerOptions.paths;

const alias = Object.keys(paths).reduce<{ find: string; replacement: string }[]>((acc, key) => {
  if (key !== '@@/*') {
    const value = paths[key][0];
    acc.push({
      find: key,
      replacement: value,
    });
  }
  return acc;
}, []);

export default defineConfig({
  plugins: [react()],
  resolve: {
    mainFields: ['module'],
  },
  test: {
    globals: true,
    setupFiles: 'scripts/vitest.setup.ts',
    environment: 'jsdom',
    css: false,
    threads: true,
    alias: [
      { find: 'testUtils', replacement: 'testUtils.ts' },
      { find: /^~antd\/(.*)/, replacement: 'antd/$1' },
      ...alias,
    ],
    include: ['packages/**/{dumi-theme-nocobase,sdk,client}/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/lib/**',
      '**/es/**',
      '**/e2e/**',
      '**/{vitest,commitlint}.config.*',
    ],
    testTimeout: 300000,
    bail: 1,
    // 在 GitHub Actions 中不输出日志
    silent: !!process.env.GITHUB_ACTIONS,
    server: {
      deps: {
        inline: ['@juggle/resize-observer', 'clsx'],
      },
    },
  },
});
