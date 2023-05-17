const { Command } = require('commander');
const { nodeCheck, runAppCommand, promptForTs, run } = require('../util');

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
        await runAppCommand('db:clean', ['-y']);
      }
      let index = process.argv.indexOf('-c');
      if (index > 0) {
        process.argv.splice(index, 1);
      }
      index = process.argv.indexOf('--db-clean');
      if (index > 0) {
        process.argv.splice(index, 1);
      }
      process.argv.splice(2, 1, '');
      // require('jest-cli/bin/jest');
      run('vitest', [process.argv[process.argv.length - 1]]);
    });
};
