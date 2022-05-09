const { Command } = require('commander');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('test')
    .allowUnknownOption()
    .action(() => {
      process.argv.splice(2, 1, '-i');
      require('jest-cli/bin/jest');
    });
};
