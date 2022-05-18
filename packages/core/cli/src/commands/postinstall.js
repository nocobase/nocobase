const chalk = require('chalk');
const { Command } = require('commander');
const { run, isDev } = require('../util');
const { resolve } = require('path');
const { existsSync } = require('fs');
const { readFile, writeFile } = require('fs').promises;

/**
 * @param {Command} cli
 */
module.exports = (cli) => {
  const { APP_PACKAGE_ROOT } = process.env;
  cli
    .command('postinstall')
    .allowUnknownOption()
    .action(async () => {
      if (!isDev()) {
        return;
      }
      if (!existsSync(resolve(process.cwd(), '.enva'))) {
        const content = await readFile(resolve(process.cwd(), '.env.example'), 'utf-8');
        await writeFile(resolve(process.cwd(), '.enva'), content, 'utf-8');
      }
      run('umi', ['generate', 'tmp'], {
        stdio: 'pipe',
        env: {
          APP_ROOT: `packages/${APP_PACKAGE_ROOT}/client`,
        },
      });
    });
};
