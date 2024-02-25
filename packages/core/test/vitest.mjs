import react from '@vitejs/plugin-react';
import fs from 'fs';
import path, { resolve } from 'path';
import { URL } from 'url';
import { defineConfig as vitestConfig } from 'vitest/config';

const __dirname = new URL('.', import.meta.url).pathname;

const relativePathToAbsolute = (relativePath) => {
  return path.resolve(process.cwd(), relativePath);
};

function tsConfigPathsToAlias() {
  const json = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), './tsconfig.paths.json'), { encoding: 'utf8' }));
  const paths = json.compilerOptions.paths;
  const alias = Object.keys(paths).reduce((acc, key) => {
    if (key !== '@@/*') {
      const value = paths[key][0];
      acc.push({
        find: key,
        replacement: value,
      });
    }
    return acc;
  }, []);
  alias.unshift(
    {
      find: '@nocobase/utils/plugin-symlink',
      replacement: 'node_modules/@nocobase/utils/plugin-symlink.js',
    },
    {
      find: '@opentelemetry/resources',
      replacement: 'node_modules/@opentelemetry/resources/build/src/index.js',
    },
  );
  return [
    { find: /^~antd\/(.*)/, replacement: 'antd/$1' },
    ...alias.map((item) => {
      return {
        ...item,
        replacement: relativePathToAbsolute(item.replacement),
      };
    }),
  ];
}

export const defineConfig = (config = {}) => {
  return vitestConfig(
    process.env.TEST_ENV === 'server-side'
      ? {
          root: process.cwd(),
          resolve: {
            mainFields: ['module'],
          },
          test: {
            globals: true,
            setupFiles: resolve(__dirname, './setup/server.ts'),
            alias: tsConfigPathsToAlias(),
            include: ['packages/**/__tests__/**/*.test.ts'],
            exclude: [
              '**/node_modules/**',
              '**/dist/**',
              '**/lib/**',
              '**/es/**',
              '**/e2e/**',
              '**/__e2e__/**',
              '**/{vitest,commitlint}.config.*',
              'packages/**/{dumi-theme-nocobase,sdk,client}/**/__tests__/**/*.{test,spec}.{ts,tsx}',
            ],
            testTimeout: 300000,
            hookTimeout: 300000,
            // bail: 1,
            // 在 GitHub Actions 中不输出日志
            silent: !!process.env.GITHUB_ACTIONS,
            // poolOptions: {
            //   threads: {
            //     singleThread: process.env.SINGLE_THREAD == 'false' ? false : true,
            //   },
            // },
          },
        }
      : {
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
            setupFiles: resolve(__dirname, './setup/client.ts'),
            environment: 'jsdom',
            css: false,
            alias: tsConfigPathsToAlias(),
            include: ['packages/**/{dumi-theme-nocobase,sdk,client}/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
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
            // 在 GitHub Actions 中不输出日志
            silent: !!process.env.GITHUB_ACTIONS,
            server: {
              deps: {
                inline: ['@juggle/resize-observer', 'clsx'],
              },
            },
          },
        },
  );
};
