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
      let clientPost = APP_PORT;
      let serverPost;
      nodeCheck();
      await postCheck(opts);
      if (server) {
        serverPost = APP_PORT;
      } else if (!server && !client) {
        serverPost = await getPortPromise({
          port: 1 * clientPost + 1,
        });
      }
      await runAppCommand('install', ['--silent']);
      if (opts.dbSync) {
        await runAppCommand('db:sync');
      }
      if (server || !client) {
        console.log('starting server', serverPost);
        const argv = [
          '-P',
          './tsconfig.server.json',
          '-r',
          'tsconfig-paths/register',
          `./packages/${APP_PACKAGE_ROOT}/server/src/index.ts`,
          'start',
          ...process.argv.slice(3),
          `--port=${serverPost}`,
        ];
        run('ts-node-dev', argv, {
          env: {
            APP_PORT: serverPost,
          },
        });
      }
      if (client || !server) {
        console.log('starting client', 1 * clientPost);
        run('umi', ['dev'], {
          env: {
            PORT: clientPost,
            APP_ROOT: `packages/${APP_PACKAGE_ROOT}/client`,
            PROXY_TARGET_URL: serverPost ? `http://127.0.0.1:${serverPost}` : undefined,
          },
        });
      }
    });
};
