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
    .allowUnknownOption()
    .action(async (opts) => {
      promptForTs();
      if (process.argv.includes('-h') || process.argv.includes('--help')) {
        run('ts-node', [
          '-P',
          './tsconfig.server.json',
          '-r',
          'tsconfig-paths/register',
          `./packages/${APP_PACKAGE_ROOT}/server/src/index.ts`,
          ...process.argv.slice(2),
        ]);
        return;
      }
      const { port, client, server } = opts;
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
      await runAppCommand('install', ['--silent']);
      // if (opts.dbSync) {
      //   await runAppCommand('db:sync');
      // }
      if (server || !client) {
        console.log('starting server', serverPort);
        const argv = [
          '-P',
          './tsconfig.server.json',
          '-r',
          'tsconfig-paths/register',
          `./packages/${APP_PACKAGE_ROOT}/server/src/index.ts`,
          'start',
          ...process.argv.slice(3),
          `--port=${serverPort}`,
        ];
        if (opts.dbSync) {
          argv.push('--db-sync');
        }
        run('ts-node-dev', argv, {
          env: {
            APP_PORT: serverPort,
          },
        });
      }
      if (client || !server) {
        console.log('starting client', 1 * clientPort);
        run('umi', ['dev'], {
          env: {
            PORT: clientPort,
            APP_ROOT: `packages/${APP_PACKAGE_ROOT}/client`,
            PROXY_TARGET_URL: process.env.PROXY_TARGET_URL || (serverPort ? `http://127.0.0.1:${serverPort}` : undefined),
          },
        });
      }
    });
};
