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
const { run, promptForTs, runAppCommand, hasCorePackages, downloadPro, hasTsNode, checkDBDialect } = require('../util');
const { existsSync, rmSync } = require('fs');
const { readJSON, writeJSON } = require('fs-extra');
const deepmerge = require('deepmerge');

async function updatePackage() {
  const sourcePath = resolve(__dirname, '../../templates/create-app-package.json');
  const descPath = resolve(process.cwd(), 'package.json');
  const sourceJson = await readJSON(sourcePath, 'utf8');
  const descJson = await readJSON(descPath, 'utf8');
  const json = deepmerge(descJson, sourceJson);
  await writeJSON(desc, json, { spaces: 2, encoding: 'utf8' });
}

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
      checkDBDialect();
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
      await updatePackage();
      await run('yarn', ['install']);
      await downloadPro();
      await runAppCommand('upgrade');
      await rmAppDir();
    });
};
