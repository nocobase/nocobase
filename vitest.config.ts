import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import tsConfigPaths from './tsconfig.paths.json';

const paths = tsConfigPaths.compilerOptions.paths;

const base = import.meta.url;

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

alias.unshift({
  find: 'packages/core/utils/src/plugin-symlink',
  replacement: 'packages/core/utils/plugin-symlink.js',
});

const relativePathToAbsolute = (relativePath: string) => {
  return new URL(relativePath, base).pathname;
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    mainFields: ['module'],
  },
  define: {
    'process.env.__TEST__': true,
    'process.env.__E2E__': false,
  },
  test: {
    globals: true,
    setupFiles: 'scripts/vitest.setup.ts',
    environment: 'jsdom',
    css: false,

    alias: [
      { find: 'testUtils', replacement: relativePathToAbsolute('./testUtils.ts') },
      { find: /^~antd\/(.*)/, replacement: 'antd/$1' },
      ...alias.map((item) => {
        return {
          ...item,
          replacement: relativePathToAbsolute(item.replacement),
        };
      }),
    ],
    include: ['packages/**/{dumi-theme-nocobase,sdk,client,utils}/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/lib/**',
      '**/es/**',
      '**/e2e/**',
      '**/__e2e__/**',
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
