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

async function buildBundleStatusHtml() {
  const data = await fs.promises.readFile(path.resolve(__dirname, '../../templates/bundle-status.html'), 'utf-8');
  await fs.promises.writeFile(
    path.resolve(process.cwd(), 'node_modules/@umijs/preset-umi/assets/bundle-status.html'),
    data,
    'utf-8',
  );
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
    .option('--client-v2-only')
    .option('-i, --inspect [port]')
    .allowUnknownOption()
    .action(async (opts) => {
      checkDBDialect();
      await buildBundleStatusHtml();

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

      const { port, client, server, inspect, clientV2Only } = opts;

      if (port) {
        process.env.APP_PORT = opts.port;
      }

      const APP_PORT = Number(process.env.APP_PORT);

      let clientPort = APP_PORT;
      let serverPort;
      let clientV2Port = APP_PORT;

      nodeCheck();
      await postCheck(opts);

      const shouldRunClientV2 = clientV2Only || client || !server;
      const shouldRunClient = !clientV2Only && (client || !server);
      const shouldRunServer = !clientV2Only && (server || !client);

      if (shouldRunServer && server) {
        serverPort = APP_PORT;
      } else if (shouldRunServer) {
        serverPort = await getPortPromise({
          port: 1 * clientPort + 1,
        });
      }

      if (shouldRunClientV2 && !clientV2Only) {
        clientV2Port = await getPortPromise({
          port: 1 * clientPort + 2,
        });
      }

      const runDevClientV2 = () => {
        console.log('starting client-v2', 1 * clientV2Port);
        run('vite', ['--config', `${APP_PACKAGE_ROOT}/client-v2/vite.config.ts`, '--port', `${clientV2Port}`], {
          env: {
            ...process.env,
            APP_V2_PORT: `${clientV2Port}`,
            VITE_HMR_CLIENT_PORT: `${clientV2Only ? clientV2Port : clientPort}`,
            VITE_API_BASE_URL: process.env.API_BASE_URL || process.env.API_BASE_PATH,
            VITE_API_CLIENT_STORAGE_PREFIX: process.env.API_CLIENT_STORAGE_PREFIX,
            VITE_API_CLIENT_STORAGE_TYPE: process.env.API_CLIENT_STORAGE_TYPE,
            VITE_API_CLIENT_SHARE_TOKEN: process.env.API_CLIENT_SHARE_TOKEN || 'false',
            VITE_WS_URL:
              process.env.WEBSOCKET_URL || (serverPort ? `ws://localhost:${serverPort}${process.env.WS_PATH}` : ''),
            VITE_WS_PATH: process.env.WS_PATH,
            VITE_ESM_CDN_BASE_URL: process.env.ESM_CDN_BASE_URL || 'https://esm.sh',
            VITE_ESM_CDN_SUFFIX: process.env.ESM_CDN_SUFFIX || '',
          },
        });
      };

      if (clientV2Only) {
        runDevClientV2();
        return;
      }

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
            APP_V2_PORT: `${clientV2Port}`,
            WEBSOCKET_URL:
              process.env.WEBSOCKET_URL ||
              (serverPort ? `ws://localhost:${serverPort}${process.env.WS_PATH}` : undefined),
            PROXY_TARGET_URL:
              process.env.PROXY_TARGET_URL || (serverPort ? `http://127.0.0.1:${serverPort}` : undefined),
          },
        });
      };

      if (shouldRunClient) {
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
          .on('addDir', async () => {
            if (!isReady) return;
            restartClient();
          })
          .on('unlinkDir', async () => {
            if (!isReady) return;
            restartClient();
          });
      }

      if (shouldRunServer) {
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

      if (shouldRunClient) {
        runDevClient();
      }

      if (shouldRunClientV2) {
        runDevClientV2();
      }
    });
};
