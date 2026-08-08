/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const path = require('path');
const { createRsbuild } = require('@rsbuild/core');
const { pluginLess } = require('@rsbuild/plugin-less');
const { pluginReact } = require('@rsbuild/plugin-react');
const { pluginSvgr } = require('@rsbuild/plugin-svgr');
const {
  createPluginClientExternals,
  discoverLocalPluginEntries,
  getPluginClientModuleIds,
  writePluginDevEntryFiles,
} = require('./app-dev-utils');
const { storagePathJoin } = require('../util');

const appDevExternalDeps = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-router',
  'react-router-dom',
  'antd',
  'antd-style',
  '@ant-design/icons',
  '@ant-design/cssinjs',
  'i18next',
  'react-i18next',
  '@formily/antd-v5',
  '@formily/core',
  '@formily/json-schema',
  '@formily/path',
  '@formily/react',
  '@formily/reactive',
  '@formily/reactive-react',
  '@formily/shared',
  '@formily/validator',
  '@dnd-kit/core',
  '@dnd-kit/sortable',
  '@nocobase/client',
  '@nocobase/client/client',
  '@nocobase/client-v2',
  '@nocobase/client-v2/client-v2',
  '@nocobase/evaluators',
  '@nocobase/evaluators/client',
  '@nocobase/flow-engine',
  '@nocobase/sdk',
  '@nocobase/utils',
  '@nocobase/utils/client',
  '@emotion/css',
  'ahooks',
  'axios',
  'dayjs',
  'file-saver',
  'lodash',
];

function createExternals() {
  return appDevExternalDeps.reduce((memo, dep) => {
    memo[dep] = `window.__nocobase_app_dev_deps__ && window.__nocobase_app_dev_deps__[${JSON.stringify(dep)}]`;
    return memo;
  }, {});
}

async function main() {
  const cwd = process.cwd();
  const port = Number(process.env.NOCOBASE_APP_DEV_PLUGIN_PORT || 14100);
  const entryDir = storagePathJoin('.app-dev', 'plugin-dev', 'entries');
  const outDir = storagePathJoin('.app-dev', 'plugin-dev', 'dist');
  const entries = discoverLocalPluginEntries({ cwd, port });
  const externals = {
    ...createExternals(),
    ...createPluginClientExternals(getPluginClientModuleIds({ cwd })),
  };

  if (!entries.length) {
    console.log('[app-dev] no local plugin client entries found');
    await new Promise(() => {});
    return;
  }

  const rsbuildEntries = await writePluginDevEntryFiles(entries, entryDir);
  const rsbuild = await createRsbuild({
    cwd,
    rsbuildConfig: {
      plugins: [pluginReact(), pluginLess(), pluginSvgr()],
      source: {
        entry: Object.fromEntries(
          Object.entries(rsbuildEntries).map(([name, entryFile]) => [
            name,
            {
              import: entryFile,
              html: false,
            },
          ]),
        ),
        tsconfigPath: path.resolve(cwd, 'tsconfig.json'),
        decorators: {
          version: 'legacy',
        },
      },
      output: {
        target: 'web',
        distPath: {
          root: outDir,
          js: '.',
          jsAsync: '.',
          css: '.',
          cssAsync: '.',
          svg: '.',
          font: '.',
          image: '.',
          media: '.',
          assets: '.',
        },
        filename: {
          js: '[name].js',
          css: '[name].css',
          svg: '[name][ext][query]',
          font: '[name][ext][query]',
          image: '[name][ext][query]',
          media: '[name][ext][query]',
          assets: '[name][ext][query]',
        },
        assetPrefix: `http://localhost:${port}/`,
        cleanDistPath: true,
        sourceMap: {
          js: 'eval-cheap-module-source-map',
          css: false,
        },
      },
      server: {
        host: '0.0.0.0',
        port,
        cors: true,
      },
      dev: {
        hmr: false,
        liveReload: true,
        assetPrefix: `http://localhost:${port}/`,
        lazyCompilation: false,
        client: {
          port,
          protocol: 'ws',
        },
      },
      tools: {
        rspack(config) {
          config.output = config.output || {};
          config.output.library = { type: 'module' };
          config.output.module = true;
          config.output.chunkFormat = 'module';
          config.output.chunkLoading = 'import';
          config.output.workerChunkLoading = 'import';
          config.experiments = {
            ...config.experiments,
            outputModule: true,
          };
          config.externalsType = 'var';
          config.externals = {
            ...(config.externals || {}),
            ...externals,
          };
        },
      },
    },
  });

  await rsbuild.startDevServer();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
