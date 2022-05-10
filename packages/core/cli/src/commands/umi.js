const chalk = require('chalk');
const { Command } = require('commander');
const { run, isDev } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('umi')
    .allowUnknownOption()
    .action(() => {
      if (!isDev()) {
        return;
      }
      run('umi', process.argv.slice(3), {
        env: {
          APP_ROOT: 'packages/app/client',
        },
      });
    });
};
