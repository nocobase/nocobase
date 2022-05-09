const { Command } = require('commander');
const { isDev, run } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('start')
    .option('--pm2')
    .allowUnknownOption()
    .action((opts) => {
      if (isDev() && !opts.pm2) {
        const argv = [
          '-P',
          './tsconfig.server.json',
          '-r',
          'tsconfig-paths/register',
          './packages/app/server/src/index.ts',
          ...process.argv.slice(2),
        ];
        run('ts-node-dev', argv);
      } else {
        const argv = [
          'start',
          'packages/app/server/lib/index.js',
          '--',
          ...process.argv.slice(2),
        ];
        run('pm2-runtime', argv);
      }
    });
};
