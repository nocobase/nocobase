const chalk = require('chalk');
const { Command } = require('commander');
const { run, nodeCheck } = require('../util');

function concat(value, previous) {
  previous.push(value);
  return previous;
}

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('build')
    .allowUnknownOption()
    .argument('[packages...]')
    .action(async (pkgs) => {
      nodeCheck();
      if (!pkgs.length || !pkgs.includes('app/client') || (pkgs.includes('app/client') && pkgs.length > 1)) {
        await run('nocobase-build', process.argv.slice(3));
      }
      if (!pkgs.length || pkgs.includes('app/client')) {
        await run('umi', ['build'], {
          env: {
            APP_ROOT: 'packages/app/client',
          },
        });
      }
    });
};
