/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const chalk = require('chalk');
const { Command } = require('commander');
const { resolve } = require('path');
const { run, promptForTs, runAppCommand, hasCorePackages, updateJsonFile, hasTsNode } = require('../util');
const { existsSync, rmSync } = require('fs');

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
    .option('--next')
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
      const rmAppDir = () => {
        // If ts-node is not installed, do not do the following
        const appDevDir = resolve(process.cwd(), './storage/.app-dev');
        if (existsSync(appDevDir)) {
          rmSync(appDevDir, { recursive: true, force: true });
        }
      };
      const pkg = require('../../package.json');
      // get latest version
      const { stdout } = await run('npm', ['info', options.next ? '@nocobase/cli@next' : '@nocobase/cli', 'version'], {
        stdio: 'pipe',
      });
      if (pkg.version === stdout) {
        await runAppCommand('upgrade');
        rmAppDir();
        return;
      }
      const currentY = 1 * pkg.version.split('.')[1];
      const latestY = 1 * stdout.split('.')[1];
      if (options.next || currentY > latestY) {
        await run('yarn', ['add', '@nocobase/cli@next', '@nocobase/devtools@next', '-W']);
      } else {
        await run('yarn', ['add', '@nocobase/cli', '@nocobase/devtools', '-W']);
      }
      await run('yarn', ['install']);
      await runAppCommand('upgrade');
      rmAppDir();
    });
};
