/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const { Command } = require('commander');
const { run, isDev, isPackageValid, generatePlaywrightPath } = require('../util');
const { dirname, resolve } = require('path');
const { existsSync, mkdirSync, readFileSync, appendFileSync } = require('fs');
const { readFile, writeFile } = require('fs').promises;
const { createStoragePluginsSymlink, createDevPluginsSymlink } = require('@nocobase/utils/plugin-symlink');
const { generatePlugins } = require('@nocobase/devtools/umiConfig');

function writeToExclude() {
  const excludePath = resolve(process.cwd(), '.git', 'info', 'exclude');
  const content = 'packages/pro-plugins/\n';
  const dirPath = dirname(excludePath);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
  let fileContent = '';
  if (existsSync(excludePath)) {
    fileContent = readFileSync(excludePath, 'utf-8');
  }
  if (!fileContent.includes(content)) {
    appendFileSync(excludePath, content);
  }
}

/**
 * @param {Command} cli
 */
module.exports = (cli) => {
  const { APP_PACKAGE_ROOT } = process.env;
  cli
    .command('postinstall')
    .allowUnknownOption()
    .option('--skip-umi')
    .action(async (options) => {
      writeToExclude();
      generatePlugins();
      generatePlaywrightPath(true);
      await createStoragePluginsSymlink();
      if (!isDev()) {
        return;
      }
      await createDevPluginsSymlink();
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
      if (!options.skipUmi) {
        run('umi', ['generate', 'tmp'], {
          stdio: 'pipe',
          env: {
            APP_ROOT: `${APP_PACKAGE_ROOT}/client`,
          },
        });
      }
    });
};
