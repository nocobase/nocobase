const chalk = require('chalk');
const { Command } = require('commander');
const { run, isDev } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('doc')
    .allowUnknownOption()
    .action(() => {
      if (!isDev()) {
        return;
      }
      const argv = process.argv.slice(3);
      const argument = argv.shift() || 'dev';
      run('dumi', [argument, ...argv]);
    });
};
