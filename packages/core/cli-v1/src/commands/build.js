/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const { existsSync } = require('fs');
const { resolve } = require('path');
const { Command } = require('commander');
const { run, nodeCheck, isPackageValid, buildIndexHtml } = require('../util');

async function buildClientV2() {
  const configPath = resolve(process.env.APP_PACKAGE_ROOT, 'client-v2/rsbuild.config.ts');
  if (!existsSync(configPath)) {
    console.log(`client-v2 config not found: ${configPath}`);
    return;
  }
  await run('rsbuild', ['build', '--config', configPath], {
    env: {
      ...process.env,
      APP_ENV: 'production',
      NODE_ENV: 'production',
      API_BASE_URL: process.env.API_BASE_URL || process.env.API_BASE_PATH,
      API_CLIENT_STORAGE_PREFIX: process.env.API_CLIENT_STORAGE_PREFIX,
      API_CLIENT_STORAGE_TYPE: process.env.API_CLIENT_STORAGE_TYPE,
      API_CLIENT_SHARE_TOKEN: process.env.API_CLIENT_SHARE_TOKEN || 'false',
      WEBSOCKET_URL: process.env.WEBSOCKET_URL || '',
      WS_PATH: process.env.WS_PATH,
      ESM_CDN_BASE_URL: process.env.ESM_CDN_BASE_URL || 'https://esm.sh',
      ESM_CDN_SUFFIX: process.env.ESM_CDN_SUFFIX || '',
    },
  });
}

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('build')
    .allowUnknownOption()
    .argument('[packages...]')
    .option('-v, --version', 'print version')
    .option('-c, --compile', 'compile the @nocobase/build package')
    .option('-r, --retry', 'retry the last failed package')
    .option('-w, --watch', 'watch compile the @nocobase/build package')
    .option('-s, --sourcemap', 'generate sourcemap')
    .option('--no-dts', 'not generate dts')
    .option('--client-v2-only', 'build client-v2 shell only')
    .action(async (pkgs, options) => {
      nodeCheck();
      process.env['VITE_CJS_IGNORE_WARNING'] = 'true';
      process.env.APP_ENV = 'production';

      if (options.clientV2Only) {
        await buildClientV2();
        return;
      }

      if (options.compile || options.watch || isPackageValid('@nocobase/build/src/index.ts')) {
        await run('yarn', ['build', options.watch ? '--watch' : ''], {
          cwd: resolve(process.cwd(), 'packages/core/build'),
        });
        if (options.watch) return;
      }

      await run('nocobase-build', [
        ...pkgs,
        options.version ? '--version' : '',
        !options.dts ? '--no-dts' : '',
        options.sourcemap ? '--sourcemap' : '',
        options.retry ? '--retry' : '',
      ]);
      buildIndexHtml(true);
      if (options.packages && !options.packages.includes('@nocobase/app')) {
        await buildClientV2();
      }
    });
};
