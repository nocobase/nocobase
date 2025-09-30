/// <reference types="vitest" />

import react from '@vitejs/plugin-react';
import fs from 'fs';
import path, { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { mergeConfig, defineConfig as vitestConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CORE_CLIENT_PACKAGES = ['sdk', 'client', 'flow-engine'];

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

const defineCommonConfig = () => {
  return vitestConfig({
    root: process.cwd(),
    resolve: {
      mainFields: ['module'],
    },
    test: {
      globals: true,
      alias: tsConfigPathsToAlias(),
      testTimeout: 300000,
      hookTimeout: 300000,
      silent: !!process.env.GITHUB_ACTIONS,
      include: ['packages/**/src/**/__tests__/**/*.test.{ts,tsx}'],
      exclude: [
        '**/demos/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/lib/**',
        '**/es/**',
        '**/.dumi/**',
        '**/e2e/**',
        '**/__e2e__/**',
        '**/{vitest,commitlint}.config.*',
      ],
      watchExclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/lib/**',
        '**/es/**',
        '**/.dumi/**',
        '**/e2e/**',
        '**/__e2e__/**',
        '**/{vitest,commitlint}.config.*',
      ],
      coverage: {
        provider: 'istanbul',
        include: ['packages/**/src/**/*.{ts,tsx}'],
        exclude: [
          '**/demos/**',
          '**/swagger/**',
          '**/.dumi/**',
          '**/.umi/**',
          '**/.plugins/**',
          '**/lib/**',
          '**/__tests__/**',
          '**/e2e/**',
          '**/__e2e__/**',
          '**/client.js',
          '**/server.js',
          '**/*.d.ts',
        ],
      },
    },
  });
};

function getExclude(isServer) {
  return [
    `packages/core/${isServer ? '' : '!'}(${CORE_CLIENT_PACKAGES.join('|')})/**/*`,
    `packages/**/src/${isServer ? 'client' : 'server'}/**/*`,
  ];
}

const defineServerConfig = () => {
  return vitestConfig({
    test: {
      setupFiles: resolve(__dirname, './setup/server.ts'),
      exclude: getExclude(true),
      retry: process.env.CI ? 2 : 0,
    },
    coverage: {
      exclude: getExclude(true),
    },
  });
};

const defineClientConfig = () => {
  return vitestConfig({
    plugins: [react()],
    define: {
      'process.env.__TEST__': true,
      'process.env.__E2E__': false,
      global: 'window',
    },
    test: {
      environment: 'jsdom',
      css: false,
      setupFiles: resolve(__dirname, './setup/client.ts'),
      server: {
        deps: {
          inline: ['@juggle/resize-observer', 'clsx'],
        },
      },
      exclude: getExclude(false),
      coverage: {
        exclude: getExclude(false),
      },
    },
  });
};

export const getFilterInclude = (isServer, isCoverage) => {
  let argv = process.argv.slice(2);

  argv = argv.filter((item, index) => {
    if (!item.startsWith('-')) {
      const pre = argv[index - 1];

      if (pre && pre.startsWith('--') && ['--reporter'].includes(pre)) {
        return false;
      }

      return true;
    }

    return false;
  });

  let filterFileOrDir = argv[0];

  if (!filterFileOrDir) return {};
  const absPath = path.join(process.cwd(), filterFileOrDir);
  const isDir = fs.existsSync(absPath) && fs.statSync(absPath).isDirectory();

  // 如果是文件，则只测试当前文件
  if (!isDir) {
    return {
      isFile: true,
      include: [filterFileOrDir],
    };
  }

  const suffix = isCoverage ? `**/*.{ts,tsx}` : `**/__tests__/**/*.{test,spec}.{ts,tsx}`;

  // 判断是否为包目录，如果不是包目录，则只测试当前目录
  const isPackage = fs.existsSync(path.join(absPath, 'package.json'));

  if (!isPackage) {
    return {
      include: [`${filterFileOrDir}/${suffix}`],
    };
  }

  // 判断是否为 core 包目录，不分 client 和 server
  const isCore = absPath.includes('packages/core');
  if (isCore) {
    return {
      include: [`${filterFileOrDir}/src/${suffix}`],
    };
  }

  // 插件目录，区分 client 和 server
  return {
    include: [`${filterFileOrDir}/src/${isServer ? 'server' : 'client'}/${suffix}`],
  };
};

export const getReportsDirectory = (isServer) => {
  let filterFileOrDir = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
  if (!filterFileOrDir) return;
  const basePath = `./storage/coverage/`;
  const isPackage = fs.existsSync(path.join(process.cwd(), filterFileOrDir, 'package.json'));
  if (isPackage) {
    let reportsDirectory = `${basePath}${filterFileOrDir.replace('packages/', '')}`;

    const isCore = filterFileOrDir.includes('packages/core');

    if (!isCore) {
      reportsDirectory = `${reportsDirectory}/${isServer ? 'server' : 'client'}`;
    }

    return reportsDirectory;
  } else {
    return `${basePath}${filterFileOrDir.replace('packages/', '').replace('src/', '')}`;
  }
};

export const defineConfig = () => {
  const isServer = process.env.TEST_ENV === 'server-side';
  const config = vitestConfig(
    mergeConfig(defineCommonConfig(), isServer ? defineServerConfig() : defineClientConfig()),
  );

  const { isFile, include: filterInclude } = getFilterInclude(isServer);

  if (filterInclude) {
    config.test.include = filterInclude;

    if (isFile) {
      // 减少收集的文件
      config.test.exclude = [];

      config.test.coverage = {
        enabled: false,
      };

      return config;
    }
  }

  const isCoverage = process.argv.includes('--coverage');

  if (!isCoverage) {
    return config;
  }

  const { include: coverageInclude } = getFilterInclude(isServer, true);

  if (coverageInclude) {
    config.test.coverage.include = coverageInclude;
  }

  const reportsDirectory = getReportsDirectory(isServer);
  if (reportsDirectory) {
    config.test.coverage.reportsDirectory = reportsDirectory;
  }

  return config;
};
