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
      if (hasTsNode()) promptForTs();
      if (hasCorePackages()) {
        // await run('yarn', ['install']);
        await runAppCommand('upgrade');
        return;
      }
      if (options.skipCodeUpdate) {
        await runAppCommand('upgrade');
        return;
      }
      // await runAppCommand('upgrade');
      if (!hasTsNode()) {
        await runAppCommand('upgrade');
        return;
      }
      // If ts-node is not installed, do not do the following
      await run('yarn', ['add', '@nocobase/cli', '@nocobase/devtools', '-W']);
      await run('yarn', ['install']);
      await runAppCommand('upgrade');
    });
};
