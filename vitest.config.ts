import path from 'path';
import { defineConfig } from 'vitest/config';

export const alias = [
  { find: '@nocobase/evaluators/client', replacement: 'packages/core/evaluators/src/client' },
  { find: '@nocobase/utils/client', replacement: 'packages/core/utils/src/client' },
  { find: /^@nocobase\/app-(.*)/, replacement: 'packages/$1/src' },
  { find: /^@nocobase\/plugin-sample-(.*)/, replacement: 'packages/samples/$1/src' },
  { find: /^@nocobase\/plugin-pro-(.*)/, replacement: 'packages/pro-plugins/$1/src' },
  { find: /^@nocobase\/plugin-(.*)/, replacement: 'packages/plugins/$1/src' },
  { find: /^@nocobase\/preset-(.*)/, replacement: 'packages/presets/$1/src' },
  { find: /^@nocobase\/(.*)/, replacement: 'packages/core/$1/src' },
];

export const resolveAliasByVitest = (name: string) => {
  const item = alias.find((item) => (item.find instanceof RegExp ? item.find.test(name) : item.find === name));
  if (item) {
    if (item.find instanceof RegExp) {
      return path.resolve('./', item.replacement.replace('$1', name.replace(item.find, '$1')));
    }
    return path.resolve('./', item.replacement);
  }
  return name;
};

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './scripts/setupVitest.ts',
    css: false,
    threads: false,
    maxThreads: 1,
    alias,
    include: ['packages/**/src/**/*.test.(tsx|ts)'],
    exclude: ['packages/**/node_modules', 'packages/**/lib', 'packages/**/dist', 'packages/**/es'],
    testTimeout: 300000,
  },
});
