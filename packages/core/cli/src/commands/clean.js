const chalk = require('chalk');
const { Command } = require('commander');
const { run, isDev } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('clean')
    .allowUnknownOption()
    .action(() => {
      if (!isDev()) {
        return;
      }
      run('rimraf', ['-rf', 'packages/*/*/{lib,esm,es,dist}']);
    });
};
