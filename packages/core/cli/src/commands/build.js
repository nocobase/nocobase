const { resolve } = require('path');
const { Command } = require('commander');
const { run, nodeCheck, isPackageValid, promptForTs } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  const { APP_PACKAGE_ROOT } = process.env;
  const clientPackage = `${APP_PACKAGE_ROOT}/client`;
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
      if (!pkgs.length || !pkgs.includes(clientPackage) || (pkgs.includes(clientPackage) && pkgs.length > 1)) {
        await run('nocobase-build', process.argv.slice(3));
      }
      if (!pkgs.length || pkgs.includes(clientPackage)) {
        await run('umi', ['build'], {
          env: {
            APP_ROOT: `packages/${APP_PACKAGE_ROOT}/client`,
          },
        });
      }
    });
};
