const { Command } = require('commander');
const { getVersion, run, isDev, hasCorePackages, updateJsonFile } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('upgrade')
    .allowUnknownOption()
    .action(async () => {
      const version = getVersion();
      if (hasCorePackages()) {
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
        data.dependencies['@nocobase/client'] = version;
        return data;
      });
      await updateJsonFile(serverPackage, (data) => {
        data.dependencies['@nocobase/preset-nocobase'] = version;
        return data;
      });
      const argv = ['install'];
      if (!isDev()) {
        argv.push('--production');
      }
      await run('yarn', argv);
    });
};
