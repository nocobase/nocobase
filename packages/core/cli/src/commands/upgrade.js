const { Command } = require('commander');
const { resolve } = require('path');
const { getVersion, run, isDev, hasCorePackages, updateJsonFile, hasTsNode } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('upgrade')
    .allowUnknownOption()
    .action(async () => {
      const version = await getVersion();
      if (hasCorePackages()) {
        return;
      }
      if (!hasTsNode()) {
        return;
      }
      const rootPackage = resolve(process.cwd(), 'package.json');
      const clientPackage = resolve(process.cwd(), 'packages/app/client/package.json');
      const serverPackage = resolve(process.cwd(), 'packages/app/server/package.json');
      await updateJsonFile(rootPackage, (data) => {
        data.dependencies['@nocobase/cli'] = version;
        data.devDependencies['@nocobase/devtools'] = version;
        return data;
      });
      await updateJsonFile(clientPackage, (data) => {
        data.devDependencies['@nocobase/client'] = version;
        return data;
      });
      await updateJsonFile(serverPackage, (data) => {
        data.dependencies['@nocobase/preset-nocobase'] = version;
        return data;
      });
      const argv = ['install'];
      await run('yarn', argv);
      await run('nocobase', ['build']);
      await run('nocobase', ['db:sync']);
    });
};
