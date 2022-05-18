const { Command } = require('commander');
const { nodeCheck, runAppCommand, promptForTs } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('test')
    .option('-c, --db-clean')
    .allowUnknownOption()
    .action(async (options) => {
      nodeCheck();
      if (options.dbClean) {
        promptForTs();
        await runAppCommand('db:clean', '-y');
      }
      process.argv.splice(2, 1, '-i');
      require('jest-cli/bin/jest');
    });
};
