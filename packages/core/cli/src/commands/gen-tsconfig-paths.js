const { Command } = require('commander');
const { genTsConfigPaths } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli.command('gen-tsconfig-paths').action(() => {
    genTsConfigPaths();
  });
};
