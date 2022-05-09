const { Command } = require('commander');
const { run } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('umi')
    .allowUnknownOption()
    .action(() => {
      run('umi', process.argv.slice(3), {
        env: {
          APP_ROOT: 'packages/app/client',
        },
      });
    });
};
