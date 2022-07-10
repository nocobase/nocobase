const chalk = require('chalk');
const { Command } = require('commander');
const { resolve } = require('path');
const { getVersion, run, promptForTs, runAppCommand, hasCorePackages, updateJsonFile, hasTsNode } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  const { APP_PACKAGE_ROOT } = process.env;
  cli
    .command('upgrade')
    .allowUnknownOption()
    .option('--raw')
    .option('-S|--skip-code-update')
    .action(async (options) => {
      promptForTs();
      if (options.skipCodeUpdate) {
        await runAppCommand('upgrade');
        return;
      }
      if (hasCorePackages()) {
        await run('yarn', ['install']);
        await runAppCommand('upgrade');
        return;
      }
      if (!hasTsNode()) {
        return;
      }
      const version = await getVersion();
      await run('yarn', ['add', '@nocobase/cli', '@nocobase/devtools', '-W']);
      const clientPackage = resolve(process.cwd(), `packages/${APP_PACKAGE_ROOT}/client/package.json`);
      const serverPackage = resolve(process.cwd(), `packages/${APP_PACKAGE_ROOT}/server/package.json`);
      await updateJsonFile(clientPackage, (data) => {
        data.devDependencies['@nocobase/client'] = version;
        return data;
      });
      await updateJsonFile(serverPackage, (data) => {
        data.dependencies['@nocobase/preset-nocobase'] = version;
        return data;
      });
      await run('yarn', ['install']);
      await run('nocobase', ['build']);
      await runAppCommand('upgrade');
    });
};
