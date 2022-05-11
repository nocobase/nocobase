const { resolve } = require('path');
const { Command } = require('commander');
const { run, nodeCheck, isPackageValid, promptForTs } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('build')
    .allowUnknownOption()
    .argument('[packages...]')
    .option('-c, --compile', 'compile the @nocobase/build package')
    .action(async (pkgs, options) => {
      promptForTs();
      nodeCheck();
      if (isPackageValid('umi-tools/cli')) {
        if (options.compile || !isPackageValid('@nocobase/build/lib')) {
          await run('umi-tools', ['build'], {
            cwd: resolve(process.cwd(), 'packages/core/build'),
          });
        }
      }
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
