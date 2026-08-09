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
const {
  generatePlugins,
  hasCorePackages,
  run,
  runWithPrefix,
  colorizedDevLogEnv,
  postCheck,
  nodeCheck,
  promptForTs,
  isPortReachable,
  storagePathJoin,
  buildWSURL,
  checkDBDialect,
  resolveAppClientEntryMode,
} = require('../util');
const { getPortPromise } = require('portfinder');
const chokidar = require('chokidar');
const { uid } = require('@formily/shared');
const path = require('path');
const fs = require('fs');
const { resolvePluginStoragePath } = require('@nocobase/utils/plugin-symlink');

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

function buildAppDevForwardArgs(argv = process.argv) {
  return ['app-dev', ...argv.slice(3)];
}

function resolveSettingsDevPort(appPort) {
  return Number(appPort) + 3;
}

function normalizePublicPath(value) {
  let normalized = value || '/';
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }
  return normalized.replace(/\/{2,}/g, '/');
}

function shouldStartPortalHost(processEnv = process.env) {
  return processEnv.PORTAL_HOST_ENABLED !== 'false' && !processEnv.PORTAL_HOST_URL;
}

function createSettingsDevProcessOptions({
  appPackageRoot,
  appPort,
  settingsPort,
  browserPort,
  appPublicPath,
  processEnv = process.env,
}) {
  const settingsHmrPath = `${normalizePublicPath(appPublicPath)}settings/__rspack_hmr`;
  return {
    command: 'rsbuild',
    args: ['dev', '--config', `${appPackageRoot}/client-settings/rsbuild.config.ts`],
    runOptions: {
      prefix: 'client-settings',
      color: 'yellow',
      env: {
        ...processEnv,
        APP_PORT: `${appPort}`,
        APP_SETTINGS_PORT: `${settingsPort}`,
        NODE_ENV: 'development',
        RSPACK_HMR_CLIENT_PORT: `${browserPort}`,
        RSPACK_HMR_PATH: settingsHmrPath,
      },
    },
  };
}

function resolveDevRuntimeMode(opts = {}) {
  const appClientEntryMode = opts.appClientEntryMode || resolveAppClientEntryMode();
  const useModernOnlyEntryMode = appClientEntryMode === 'modern-only';
  const clientV2Only = !!opts.clientV2Only;
  const forceClient = !!opts.client;
  const forceServer = !!opts.server;
  const shouldRunClientV2 = clientV2Only || useModernOnlyEntryMode || forceClient || !forceServer;
  const shouldRunClient = !clientV2Only && !useModernOnlyEntryMode && (forceClient || !forceServer);
  const shouldRunServer = !clientV2Only && (forceServer || !forceClient || useModernOnlyEntryMode);
  const shouldRunSettings = shouldRunClientV2;

  return {
    appClientEntryMode,
    useModernOnlyEntryMode,
    shouldRunClientV2,
    shouldRunClient,
    shouldRunServer,
    shouldRunSettings,
  };
}

async function forwardDevToAppDev({ argv = process.argv, runCommand = run } = {}) {
  await runCommand('nocobase-v1', buildAppDevForwardArgs(argv));
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
    .option('--quickstart')
    .option('--rsbuild')
    .option('--client-v2-only')
    .option('-i, --inspect [port]')
    .allowUnknownOption()
    .action(async (opts) => {
      if (!hasCorePackages()) {
        await forwardDevToAppDev();
        return;
      }

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

      const { port, client, server, inspect, clientV2Only, rsbuild } = opts;

      if (port) {
        process.env.APP_PORT = opts.port;
      }

      const APP_PORT = Number(process.env.APP_PORT);

      let clientPort = APP_PORT;
      let serverPort;
      let clientV2Port = APP_PORT;
      let settingsPort = resolveSettingsDevPort(APP_PORT);
      let portalHostPort;

      nodeCheck();
      await postCheck(opts);

      const {
        useModernOnlyEntryMode,
        shouldRunClientV2,
        shouldRunClient,
        shouldRunServer,
        shouldRunSettings,
      } = resolveDevRuntimeMode(opts);
      const shouldRunClientWithRsbuild = shouldRunClient && !!rsbuild;

      if (shouldRunServer && server) {
        serverPort = APP_PORT;
      } else if (shouldRunServer) {
        serverPort = await getPortPromise({
          port: 1 * clientPort + 1,
        });
      }

      if (shouldRunServer && shouldStartPortalHost()) {
        portalHostPort = await getPortPromise({
          port: 1 * clientPort + 10,
        });
      }

      if (shouldRunClientV2 && !clientV2Only && !useModernOnlyEntryMode) {
        clientV2Port = await getPortPromise({
          port: 1 * clientPort + 2,
        });
      }

      if (useModernOnlyEntryMode) {
        clientV2Port = APP_PORT;
      }

      if (shouldRunSettings) {
        settingsPort = await getPortPromise({
          port: resolveSettingsDevPort(APP_PORT),
        });
      }

      let subprocessClient;
      let subprocessClientV2;
      let subprocessSettings;
      const portalsDir = process.env.PORTALS_DIR || storagePathJoin('portals');

      const runDevClientV2 = () => {
        console.log('starting client-v2', 1 * clientV2Port);
        subprocessClientV2 = runWithPrefix(
          'rsbuild',
          ['dev', '--config', `${APP_PACKAGE_ROOT}/client-v2/rsbuild.config.ts`],
          {
            prefix: 'client-v2',
            color: 'magenta',
            env: {
              ...process.env,
              APP_V2_PORT: `${clientV2Port}`,
              APP_SETTINGS_PORT: `${settingsPort}`,
              NODE_ENV: 'development',
              RSPACK_HMR_CLIENT_PORT: `${clientV2Only ? clientV2Port : clientPort}`,
              API_BASE_URL: process.env.API_BASE_URL || process.env.API_BASE_PATH,
              API_CLIENT_STORAGE_PREFIX: process.env.API_CLIENT_STORAGE_PREFIX,
              API_CLIENT_STORAGE_TYPE: process.env.API_CLIENT_STORAGE_TYPE,
              API_CLIENT_SHARE_TOKEN: process.env.API_CLIENT_SHARE_TOKEN || 'false',
              WEBSOCKET_URL: process.env.WEBSOCKET_URL || buildWSURL(process.env.API_BASE_URL, serverPort),
              WS_PATH: process.env.WS_PATH,
              ESM_CDN_BASE_URL: process.env.ESM_CDN_BASE_URL || 'https://esm.sh',
              ESM_CDN_SUFFIX: process.env.ESM_CDN_SUFFIX || '',
              PROXY_TARGET_URL:
                process.env.PROXY_TARGET_URL || (serverPort ? `http://127.0.0.1:${serverPort}` : undefined),
            },
          },
        );
      };

      const runDevSettings = () => {
        console.log('starting client-settings', 1 * settingsPort);
        const { command, args, runOptions } = createSettingsDevProcessOptions({
          appPackageRoot: APP_PACKAGE_ROOT,
          appPort: APP_PORT,
          settingsPort,
          browserPort: clientV2Only ? clientV2Port : clientPort,
          appPublicPath: process.env.APP_PUBLIC_PATH,
          processEnv: {
            ...process.env,
            API_BASE_URL: process.env.API_BASE_URL || process.env.API_BASE_PATH,
            API_CLIENT_STORAGE_PREFIX: process.env.API_CLIENT_STORAGE_PREFIX,
            API_CLIENT_STORAGE_TYPE: process.env.API_CLIENT_STORAGE_TYPE,
            API_CLIENT_SHARE_TOKEN: process.env.API_CLIENT_SHARE_TOKEN || 'false',
            WEBSOCKET_URL: process.env.WEBSOCKET_URL || buildWSURL(process.env.API_BASE_URL, serverPort),
            WS_PATH: process.env.WS_PATH,
            ESM_CDN_BASE_URL: process.env.ESM_CDN_BASE_URL || 'https://esm.sh',
            ESM_CDN_SUFFIX: process.env.ESM_CDN_SUFFIX || '',
            PROXY_TARGET_URL:
              process.env.PROXY_TARGET_URL || (serverPort ? `http://127.0.0.1:${serverPort}` : undefined),
          },
        });
        subprocessSettings = runWithPrefix(command, args, runOptions);
      };

      if (clientV2Only) {
        runDevClientV2();
        runDevSettings();
        return;
      }

      const runDevClient = () => {
        console.log('starting client', 1 * clientPort);
        const command = shouldRunClientWithRsbuild ? 'rsbuild' : 'umi';
        const args = shouldRunClientWithRsbuild
          ? ['dev', '--config', `${APP_PACKAGE_ROOT}/client/rsbuild.config.ts`]
          : ['dev'];
        subprocessClient = runWithPrefix(command, args, {
          prefix: 'client',
          color: 'cyan',
          env: {
            ...process.env,
            stdio: 'inherit',
            shell: true,
            PORT: clientPort,
            APP_PORT: `${clientPort}`,
            APP_ROOT: `${APP_PACKAGE_ROOT}/client`,
            APP_V2_PORT: `${clientV2Port}`,
            APP_SETTINGS_PORT: `${settingsPort}`,
            NODE_ENV: 'development',
            RSPACK_HMR_CLIENT_PORT: `${clientPort}`,
            API_BASE_URL: process.env.API_BASE_URL || process.env.API_BASE_PATH,
            API_CLIENT_STORAGE_PREFIX: process.env.API_CLIENT_STORAGE_PREFIX,
            API_CLIENT_STORAGE_TYPE: process.env.API_CLIENT_STORAGE_TYPE,
            API_CLIENT_SHARE_TOKEN: process.env.API_CLIENT_SHARE_TOKEN || 'false',
            WEBSOCKET_URL: process.env.WEBSOCKET_URL || buildWSURL(process.env.API_BASE_URL, serverPort),
            PROXY_TARGET_URL:
              process.env.PROXY_TARGET_URL || (serverPort ? `http://127.0.0.1:${serverPort}` : undefined),
          },
        });
      };

      const restartSubprocess = async (subprocessRef, port, start) => {
        if (!subprocessRef) {
          start();
          return;
        }
        subprocessRef.cancel();
        let i = 0;
        while (i <= 10) {
          ++i;
          const result = await isPortReachable(port);
          if (!result) {
            break;
          }
          await sleep(500);
        }
        start();
      };

      if (shouldRunClient) {
        const storagePluginPath = resolvePluginStoragePath();
        const watcher = chokidar.watch(`${storagePluginPath}/**/*`, {
          cwd: process.cwd(),
          ignored: /(^|[/\\])\../, // 忽略隐藏文件
          persistent: true,
          depth: 1, // 只监听第一层目录
        });

        await fs.promises.mkdir(path.dirname(process.env.WATCH_FILE), { recursive: true });
        let isReady = false;

        const restartClient = _.debounce(async () => {
          if (!isReady) return;
          generatePlugins();
          if (shouldRunClient) {
            await restartSubprocess(subprocessClient, clientPort, runDevClient);
          }
          if (shouldRunClientV2) {
            await restartSubprocess(subprocessClientV2, clientV2Port, runDevClientV2);
          }
          if (shouldRunSettings) {
            await restartSubprocess(subprocessSettings, settingsPort, runDevSettings);
          }
          await fs.promises.writeFile(process.env.WATCH_FILE, `export const watchId = '${uid()}';`, 'utf-8');
        }, 500);

        watcher
          .on('ready', () => {
            console.log('watching plugin folder changes...');
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
        console.log(`server url: http://127.0.0.1:${serverPort}`);
        if (portalHostPort) {
          console.log(`portal-host url: http://127.0.0.1:${portalHostPort}`);
        }

        const filteredArgs = process.argv.filter(
          (item, i) => !item.startsWith('--inspect') && !(process.argv[i - 1] === '--inspect' && Number.parseInt(item)),
        );

        const argv = [
          'watch',
          '--clear-screen=false',
          ...(inspect ? [`--inspect=${inspect === true ? 9229 : inspect}`] : []),
          `--ignore=${resolvePluginStoragePath()}/**`,
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
            env: colorizedDevLogEnv(process.env, {
              APP_PORT: serverPort,
              PORTALS_DIR: portalsDir,
              ...(portalHostPort
                ? {
                    PORTAL_HOST_DRIVER: process.env.PORTAL_HOST_DRIVER || 'tsx',
                    PORTAL_HOST_PRESTART: process.env.PORTAL_HOST_PRESTART || 'true',
                    PORTAL_HOST_PORT: `${portalHostPort}`,
                    PORTAL_HOST_BIND: process.env.PORTAL_HOST_BIND || '127.0.0.1',
                    PORTAL_HOST_ENTRY: path.resolve(APP_PACKAGE_ROOT, '../server/src/portal-host/index.ts'),
                    PORTAL_HOST_TSCONFIG: SERVER_TSCONFIG_PATH,
                  }
                : {}),
            }),
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

      if (shouldRunSettings) {
        runDevSettings();
      }
    });
};

module.exports._test = {
  buildAppDevForwardArgs,
  createSettingsDevProcessOptions,
  forwardDevToAppDev,
  resolveDevRuntimeMode,
  resolveSettingsDevPort,
};
