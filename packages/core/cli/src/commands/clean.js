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
    .action(async () => {
      if (!isDev()) {
        return;
      }
      await run('rimraf', ['-rf', './storage/app-dev']);
      await run('rimraf', ['-rf', 'packages/*/*/{lib,esm,es,dist,node_modules}']);
    });
};
