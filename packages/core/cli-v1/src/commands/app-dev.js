/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const path = require('path');
const { getPortPromise } = require('portfinder');
const { buildPluginDevUrlMap, discoverLocalPluginEntries } = require('./app-dev-utils');
const { run, runWithPrefix } = require('../util');

function hasArg(args, name) {
  return args.some((item) => item === name || item.startsWith(`${name}=`));
}

function omitOptionWithValue(args, name) {
  const nextArgs = [];
  for (let index = 0; index < args.length; index++) {
    const item = args[index];
    if (item === name) {
      index += 1;
      continue;
    }
    if (item.startsWith(`${name}=`)) {
      continue;
    }
    nextArgs.push(item);
  }
  return nextArgs;
}

/**
 *
 * @param {import('commander').Command} cli
 */
module.exports = (cli) => {
  cli
    .command('app-dev')
    .description('Run the published app shell with local plugin development support')
    .option('--plugin-port [port]', 'local plugin dev server port')
    .allowUnknownOption()
    .action(async (opts) => {
      const passthroughArgs = omitOptionWithValue(process.argv.slice(3), '--plugin-port');
      const pluginPort = opts.pluginPort
        ? Number(opts.pluginPort)
        : await getPortPromise({ port: Number(process.env.NOCOBASE_APP_DEV_PLUGIN_PORT || 14100) });
      const entries = discoverLocalPluginEntries({ cwd: process.cwd(), port: pluginPort });
      const pluginDevUrlMap = buildPluginDevUrlMap(entries);
      let pluginDevServer;

      const sharedEnv = {
        NOCOBASE_APP_DEV: 'true',
        NOCOBASE_APP_DEV_PLUGIN_PORT: `${pluginPort}`,
        NOCOBASE_APP_DEV_PLUGIN_URLS: JSON.stringify(pluginDevUrlMap),
      };

      if (entries.length) {
        pluginDevServer = runWithPrefix('node', [path.resolve(__dirname, './app-dev-plugin-server.js')], {
          prefix: 'plugin-dev',
          color: 'green',
          env: sharedEnv,
        });
      }

      const cleanup = () => {
        pluginDevServer?.kill('SIGTERM');
      };
      process.once('exit', cleanup);
      process.once('SIGINT', () => {
        cleanup();
        process.exit(130);
      });
      process.once('SIGTERM', () => {
        cleanup();
        process.exit(143);
      });

      const startArgs = ['start'];
      if (!hasArg(passthroughArgs, '--launch-mode')) {
        startArgs.push('--launch-mode', 'direct');
      }
      startArgs.push(...passthroughArgs);

      await run('nocobase-v1', startArgs, {
        env: {
          ...sharedEnv,
        },
      });
    });
};
