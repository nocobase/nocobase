const { Command } = require('commander');
const { run, isDev, isPackageValid } = require('../util');
const { resolve } = require('path');
const { existsSync } = require('fs');
const { readFile, writeFile } = require('fs').promises;
const { createStoragePluginsSymlink } = require('@nocobase/utils/plugin-symlink');

/**
 * @param {Command} cli
 */
module.exports = (cli) => {
  const { APP_PACKAGE_ROOT } = process.env;
  cli
    .command('postinstall')
    .allowUnknownOption()
    .action(async () => {
      await createStoragePluginsSymlink();
      if (!isDev()) {
        return;
      }
      const cwd = process.cwd();
      if (!existsSync(resolve(cwd, '.env')) && existsSync(resolve(cwd, '.env.example'))) {
        const content = await readFile(resolve(cwd, '.env.example'), 'utf-8');
        await writeFile(resolve(cwd, '.env'), content, 'utf-8');
      }
      if (!existsSync(resolve(cwd, '.env.test')) && existsSync(resolve(cwd, '.env.test.example'))) {
        const content = await readFile(resolve(cwd, '.env.test.example'), 'utf-8');
        await writeFile(resolve(cwd, '.env.test'), content, 'utf-8');
      }
      if (!isPackageValid('umi')) {
        return;
      }
      run('umi', ['generate', 'tmp'], {
        stdio: 'pipe',
        env: {
          APP_ROOT: `${APP_PACKAGE_ROOT}/client`,
        },
      });
    });
};
