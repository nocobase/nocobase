const { Command } = require('commander');
const { run, isDev, promptForTs } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  const { APP_PACKAGE_ROOT } = process.env;
  cli
    .allowUnknownOption()
    .option('-h, --help')
    .option('--ts-node-dev')
    .action((options) => {
      const { tsNodeDev } = options;
      if (isDev()) {
        promptForTs();
        run(tsNodeDev ? 'ts-node-dev' : 'ts-node', [
          '-P',
          './tsconfig.server.json',
          '-r',
          'tsconfig-paths/register',
          `./packages/${APP_PACKAGE_ROOT}/server/src/index.ts`,
          ...process.argv.slice(2),
        ]);
      } else {
        run('node', [`./packages/${APP_PACKAGE_ROOT}/server/lib/index.js`, ...process.argv.slice(2)]);
      }
    });
};
