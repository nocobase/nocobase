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
const { generatePlugins, run, postCheck, nodeCheck, promptForTs, isPortReachable, checkDBDialect } = require('../util');
const { getPortPromise } = require('portfinder');
const chokidar = require('chokidar');
const { uid } = require('@formily/shared');
const path = require('path');
const fs = require('fs');

function sleep(ms = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  const { APP_PACKAGE_ROOT } = process.env;
  cli
    .command('dev')
    .option('-p, --port [port]')
    .option('-c, --client')
    .option('-s, --server')
    .option('--db-sync')
    .option('-i, --inspect [port]')
    .allowUnknownOption()
    .action(async (opts) => {
      checkDBDialect();
      let subprocess;
      const runDevClient = () => {
        console.log('starting client', 1 * clientPort);
        subprocess = run('umi', ['dev'], {
          env: {
            ...process.env,
            stdio: 'inherit',
            shell: true,
            PORT: clientPort,
            APP_ROOT: `${APP_PACKAGE_ROOT}/client`,
            WEBSOCKET_URL:
              process.env.WEBSOCKET_URL ||
              (serverPort ? `ws://localhost:${serverPort}${process.env.WS_PATH}` : undefined),
            PROXY_TARGET_URL:
              process.env.PROXY_TARGET_URL || (serverPort ? `http://127.0.0.1:${serverPort}` : undefined),
          },
        });
      };
      const watcher = chokidar.watch('./storage/plugins/**/*', {
        cwd: process.cwd(),
        ignored: /(^|[\/\\])\../, // 忽略隐藏文件
        persistent: true,
        depth: 1, // 只监听第一层目录
      });

      await fs.promises.mkdir(path.dirname(process.env.WATCH_FILE), { recursive: true });
      let isReady = false;

      const restartClient = _.debounce(async () => {
        if (!isReady) return;
        generatePlugins();
        if (subprocess) {
          console.log('client restarting...');
          subprocess.cancel();
          let i = 0;
          while (true) {
            ++i;
            const result = await isPortReachable(clientPort);
            if (!result) {
              break;
            }
            await sleep(500);
            if (i > 10) {
              break;
            }
          }
          runDevClient();
          await fs.promises.writeFile(process.env.WATCH_FILE, `export const watchId = '${uid()}';`, 'utf-8');
        }
      }, 500);

      watcher
        .on('ready', () => {
          isReady = true;
        })
        .on('addDir', async (pathname) => {
          if (!isReady) return;
          restartClient();
        })
        .on('unlinkDir', async (pathname) => {
          if (!isReady) return;
          restartClient();
        });

      promptForTs();
      const { SERVER_TSCONFIG_PATH } = process.env;
      process.env.IS_DEV_CMD = true;

      if (process.argv.includes('-h') || process.argv.includes('--help')) {
        run('ts-node', [
          '-P',
          SERVER_TSCONFIG_PATH,
          '-r',
          'tsconfig-paths/register',
          `${APP_PACKAGE_ROOT}/src/index.ts`,
          ...process.argv.slice(2),
        ]);
        return;
      }

      const { port, client, server, inspect } = opts;

      if (port) {
        process.env.APP_PORT = opts.port;
      }

      const { APP_PORT } = process.env;

      let clientPort = APP_PORT;
      let serverPort;

      nodeCheck();

      await postCheck(opts);

      if (server) {
        serverPort = APP_PORT;
      } else if (!server && !client) {
        serverPort = await getPortPromise({
          port: 1 * clientPort + 1,
        });
      }

      if (server || !client) {
        console.log('starting server', serverPort);

        const filteredArgs = process.argv.filter(
          (item, i) => !item.startsWith('--inspect') && !(process.argv[i - 1] === '--inspect' && Number.parseInt(item)),
        );

        const argv = [
          'watch',
          ...(inspect ? [`--inspect=${inspect === true ? 9229 : inspect}`] : []),
          '--ignore=./storage/plugins/**',
          '--tsconfig',
          SERVER_TSCONFIG_PATH,
          '-r',
          'tsconfig-paths/register',
          `${APP_PACKAGE_ROOT}/src/index.ts`,
          'start',
          ...filteredArgs.slice(3),
          `--port=${serverPort}`,
        ];

        if (opts.dbSync) {
          argv.push('--db-sync');
        }

        const runDevServer = () => {
          run('tsx', argv, {
            env: {
              APP_PORT: serverPort,
            },
          }).catch((err) => {
            if (err.exitCode == 100) {
              console.log('Restarting server...');
              runDevServer();
            } else {
              console.error(err);
            }
          });
        };

        runDevServer();
      }

      if (client || !server) {
        runDevClient();
      }
    });
};
