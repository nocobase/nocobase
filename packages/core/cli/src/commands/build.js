const { resolve, dirname } = require('path');
const { Command } = require('commander');
const { run, nodeCheck, isPackageValid, promptForTs } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  const { APP_PACKAGE_ROOT } = process.env;
  const clientPackage = `core/app`;
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
      await run('nocobase-build', process.argv.slice(3));
      if (!pkgs.length || pkgs.includes(clientPackage)) {
        const file = require.resolve('@nocobase/app');
        await run('umi', ['build'], {
          env: {
            APP_ROOT: `${dirname(dirname(file))}/client`,
            NODE_ENV: 'production',
          },
        });
      }
    });
};
