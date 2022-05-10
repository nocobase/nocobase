const { Command } = require('commander');
const { nodeCheck } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('test')
    .allowUnknownOption()
    .action(() => {
      nodeCheck();
      process.argv.splice(2, 1, '-i');
      require('jest-cli/bin/jest');
    });
};
