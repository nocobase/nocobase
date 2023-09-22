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
      run('rimraf', ['-rf', './storage/app-dev']);
      run('rimraf', ['-rf', 'packages/*/*/{lib,esm,es,dist,node_modules}']);
      run('rimraf', ['-rf', 'packages/*/@*/*/{lib,esm,es,dist,node_modules}']);
    });
};
