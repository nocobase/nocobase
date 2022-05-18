const { Command } = require('commander');
const { isDev, run, postCheck, runInstall, promptForTs } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  const { APP_PACKAGE_ROOT } = process.env;
  cli
    .command('start')
    .option('-p, --port [port]')
    .allowUnknownOption()
    .action(async (opts) => {
      if (opts.port) {
        process.env.APP_PORT = opts.port;
      }
      if (process.argv.includes('-h') || process.argv.includes('--help')) {
        promptForTs();
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
      await postCheck(opts);
      await run('node', [`./packages/${APP_PACKAGE_ROOT}/server/lib/index.js`, 'install', '-s']);
      run('pm2-runtime', ['start', `packages/${APP_PACKAGE_ROOT}/server/lib/index.js`, '--', ...process.argv.slice(2)]);
    });
};
