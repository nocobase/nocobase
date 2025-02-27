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
const { run, promptForTs, runAppCommand, hasCorePackages, downloadPro, hasTsNode } = require('../util');
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
        await downloadPro();
        await runAppCommand('upgrade');
        return;
      }
      if (options.skipCodeUpdate) {
        await downloadPro();
        await runAppCommand('upgrade');
        return;
      }
      // await runAppCommand('upgrade');
      if (!hasTsNode()) {
        await downloadPro();
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
      let distTag = 'latest';
      if (pkg.version.includes('alpha')) {
        distTag = 'alpha';
      } else if (pkg.version.includes('beta')) {
        distTag = 'beta';
      }
      // get latest version
      const { stdout } = await run('npm', ['info', `@nocobase/cli@${distTag}`, 'version'], {
        stdio: 'pipe',
      });
      if (pkg.version === stdout) {
        await downloadPro();
        await runAppCommand('upgrade');
        await rmAppDir();
        return;
      }
      await run('yarn', ['add', `@nocobase/cli@${distTag}`, `@nocobase/devtools@${distTag}`, '-W']);
      await run('yarn', ['install']);
      await downloadPro();
      await runAppCommand('upgrade');
      await rmAppDir();
    });
};
