/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
const _ = require('lodash');
const { Command } = require('commander');
const { run, postCheck, downloadPro, promptForTs, checkDBDialect } = require('../util');
const { existsSync, rmSync } = require('fs');
const { resolve, isAbsolute } = require('path');
const chalk = require('chalk');
const chokidar = require('chokidar');

function getSocketPath() {
  const { SOCKET_PATH } = process.env;

  if (isAbsolute(SOCKET_PATH)) {
    return SOCKET_PATH;
  }

  return resolve(process.cwd(), SOCKET_PATH);
}

function deleteSockFiles() {
  const { PM2_HOME } = process.env;
  if (existsSync(PM2_HOME)) {
    rmSync(PM2_HOME, { recursive: true });
  }
  const socketPath = getSocketPath();
  if (existsSync(socketPath)) {
    rmSync(socketPath);
  }
}

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  const { APP_PACKAGE_ROOT, NODE_ARGS } = process.env;
  cli
    .command('start')
    .option('-p, --port [port]')
    .option('-d, --daemon')
    .option('-i, --instances [instances]')
    .option('--db-sync')
    .option('--quickstart')
    .option('--launch-mode [launchMode]')
    .allowUnknownOption()
    .action(async (opts) => {
      checkDBDialect();
      if (opts.quickstart) {
        await downloadPro();
      }

      const watcher = chokidar.watch('./storage/plugins/**/*', {
        cwd: process.cwd(),
        ignoreInitial: true,
        ignored: /(^|[\/\\])\../, // 忽略隐藏文件
        persistent: true,
        depth: 1, // 只监听第一层目录
      });

      const restart = _.debounce(async () => {
        console.log('restarting...');
        await run('yarn', ['nocobase', 'pm2-restart']);
      }, 500);

      watcher
        .on('ready', () => {
          isReady = true;
        })
        .on('addDir', async (pathname) => {
          if (!isReady) return;
          restart();
        })
        .on('unlinkDir', async (pathname) => {
          if (!isReady) return;
          restart();
        });

      if (opts.port) {
        process.env.APP_PORT = opts.port;
      }
      if (process.argv.includes('-h') || process.argv.includes('--help')) {
        promptForTs();
        run('ts-node', [
          '-P',
          process.env.SERVER_TSCONFIG_PATH,
          '-r',
          'tsconfig-paths/register',
          `${APP_PACKAGE_ROOT}/src/index.ts`,
          ...process.argv.slice(2),
        ]);
        return;
      }
      if (!existsSync(resolve(process.cwd(), `${APP_PACKAGE_ROOT}/lib/index.js`))) {
        console.log('The code is not compiled, please execute it first');
        console.log(chalk.yellow('$ yarn build'));
        console.log('If you want to run in development mode, please execute');
        console.log(chalk.yellow('$ yarn dev'));
        return;
      }
      await postCheck(opts);
      if (!opts.daemon) {
        deleteSockFiles();
      }
      const instances = opts.instances || process.env.CLUSTER_MODE;
      const instancesArgs = instances ? ['-i', instances] : [];
      if (opts.daemon) {
        await run('pm2', [
          'start',
          ...instancesArgs,
          `${APP_PACKAGE_ROOT}/lib/index.js`,
          '--',
          ...process.argv.slice(2),
        ]);
        process.exit();
      } else {
        const launchMode = opts.launchMode || process.env.APP_LAUNCH_MODE || 'pm2';
        if (launchMode === 'pm2') {
          run(
            'pm2-runtime',
            [
              'start',
              ...instancesArgs,
              `${APP_PACKAGE_ROOT}/lib/index.js`,
              NODE_ARGS ? `--node-args="${NODE_ARGS}"` : undefined,
              '--',
              ...process.argv.slice(2),
            ].filter(Boolean),
          );
        } else {
          run(
            'node',
            [`${APP_PACKAGE_ROOT}/lib/index.js`, ...(NODE_ARGS || '').split(' '), ...process.argv.slice(2)].filter(
              Boolean,
            ),
          );
        }
      }
    });
};
