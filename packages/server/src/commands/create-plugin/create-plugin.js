const chalk = require('chalk');
const fse = require('fs-extra');
const { join } = require('path');
const createPackageJson = require('./resources/templates/package.json.js');
const createPluginClass = require('./resources/templates/plugin');

module.exports = async (name) => {
  const pluginName = `plugin-${name}`;

  const pluginPath = join(process.cwd(), `packages/${pluginName}`);
  const resourcePath = join(__dirname, 'resources');

  console.log(`Creating a new NocoBase plugin at ${chalk.green(pluginPath)}.`);
  await fse.copy(join(resourcePath, 'files'), pluginPath);

  await fse.outputFile(join(pluginPath, 'src/server/index.ts'), createPluginClass({ name }));

  // write server package.json
  await fse.writeJson(
    join(pluginPath, 'package.json'),
    createPackageJson({
      name: pluginName,
    }),
    {
      spaces: 2,
    },
  );
};
