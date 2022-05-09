const { Command } = require('commander');
const { run, isDev } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .allowUnknownOption()
    .option('-h, --help')
    .action(() => {
      if (isDev()) {
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
        const argv = ['./packages/app/server/lib/index.js', ...process.argv.slice(2)];
        run('node', argv);
      }
    });
};
