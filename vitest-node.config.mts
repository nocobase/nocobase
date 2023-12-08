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

alias.unshift({
  find: '@nocobase/utils/plugin-symlink',
  replacement: 'packages/core/utils/plugin-symlink.js',
});

const relativePathToAbsolute = (relativePath: string) => {
  return new URL(relativePath, import.meta.url).pathname;
};

const aliasItems = alias.map((item) => {
  return {
    ...item,
    replacement: relativePathToAbsolute(item.replacement),
  };
});

export default defineConfig({
  resolve: {
    mainFields: ['module'],
  },
  test: {
    globals: true,
    setupFiles: 'scripts/vitest-node.setup.ts',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    alias: [...aliasItems],
    include: ['packages/**/__tests__/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/lib/**',
      '**/es/**',
      '**/e2e/**',
      '**/{vitest,commitlint}.config.*',
      'packages/**/{dumi-theme-nocobase,sdk,client}/**/__tests__/**/*.{test,spec}.{ts,tsx}'
    ],
    testTimeout: 300000,
    bail: 1,
    // 在 GitHub Actions 中不输出日志
    silent: !!process.env.GITHUB_ACTIONS,
  },
});
