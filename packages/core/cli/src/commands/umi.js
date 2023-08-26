const chalk = require('chalk');
const { Command } = require('commander');
const { run, isDev } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  const { APP_PACKAGE_ROOT } = process.env;
  cli
    .command('umi')
    .allowUnknownOption()
    .action(() => {
      if (!isDev()) {
        return;
      }
      run('umi', process.argv.slice(3), {
        env: {
          APP_ROOT: `${APP_PACKAGE_ROOT}/client`,
        },
      });
    });
};
