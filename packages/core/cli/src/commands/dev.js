const chalk = require('chalk');
const { Command } = require('commander');
const { runAppCommand, runInstall, run, postCheck, nodeCheck, promptForTs } = require('../util');
const { getPortPromise } = require('portfinder');
const { CliHttpServer } = require('../cli-http-server');

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
    .option('--skip-install')
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

      const { port, client, server, skipInstall } = opts;

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
        const cliHttpServer = CliHttpServer.getInstance();
        cliHttpServer.listen(serverPort);

        if (!skipInstall) {
          cliHttpServer.setCliDoingWork('install');
          await runAppCommand('install', ['--silent'], {});
          cliHttpServer.setCliDoingWork('install done');
        }

        cliHttpServer.setCliDoingWork('start server process');

        const argv = [
          'watch',
          '--tsconfig',
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

        const runDevServer = () => {
          const child = run('tsx', argv, {
            env: {
              APP_PORT: serverPort,
              AS_WORKER_PROCESS: 'true',
              MAIN_PROCESS_SOCKET_PATH: cliHttpServer.socketPath,
            },
          });

          cliHttpServer.devChildPid = child.pid;

          child.on('exit', (code) => {
            console.log(`child process exited with code ${code}`);
            if (code === 143) {
              runDevServer();
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
            APP_ROOT: `packages/${APP_PACKAGE_ROOT}/client`,
            PROXY_TARGET_URL:
              process.env.PROXY_TARGET_URL || (serverPort ? `http://127.0.0.1:${serverPort}` : undefined),
          },
        });
      }
    });
};
