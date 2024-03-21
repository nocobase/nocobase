const chalk = require('chalk');
const { Command } = require('commander');
const { runAppCommand, runInstall, run, postCheck, nodeCheck, promptForTs } = require('../util');
const { getPortPromise } = require('portfinder');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  const { APP_PACKAGE_ROOT } = process.env;
  cli
    .command('dev')
    .option('-p, --port [port]')
    .option('--client')
    .option('--server')
    .option('--db-sync')
    .option('--inspect [port]')
    .allowUnknownOption()
    .action(async (opts) => {
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
        console.log('starting client', 1 * clientPort);
        run('umi', ['dev'], {
          env: {
            PORT: clientPort,
            APP_ROOT: `${APP_PACKAGE_ROOT}/client`,
            WEBSOCKET_URL:
              process.env.WEBSOCKET_URL ||
              (serverPort ? `ws://localhost:${serverPort}${process.env.WS_PATH}` : undefined),
            PROXY_TARGET_URL:
              process.env.PROXY_TARGET_URL || (serverPort ? `http://127.0.0.1:${serverPort}` : undefined),
          },
        });
      }
    });
};
