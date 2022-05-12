const chalk = require('chalk');
const { Command } = require('commander');
const { resolve } = require('path');
const { getVersion, run, promptForTs, runAppCommand, hasCorePackages, updateJsonFile, hasTsNode } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('upgrade')
    .allowUnknownOption()
    .action(async () => {
      promptForTs();
      const version = await getVersion();
      if (hasCorePackages()) {
        await runAppCommand('upgrade');
        // console.log(chalk.yellow('The upgrade command can only be used in project scaffolding'));
        return;
      }
      if (!hasTsNode()) {
        return;
      }
      await run('yarn', ['add', '@nocobase/cli', '@nocobase/devtools', '-W']);
      const clientPackage = resolve(process.cwd(), 'packages/app/client/package.json');
      const serverPackage = resolve(process.cwd(), 'packages/app/server/package.json');
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
      console.log(chalk.green(`✨  NocoBase has been upgraded to v${version}`));
    });
};
