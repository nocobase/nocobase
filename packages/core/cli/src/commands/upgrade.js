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
  await writeJSON(descPath, json, { spaces: 2, encoding: 'utf8' });
}

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('upgrade')
    .allowUnknownOption()
    .option('--raw')
    .option('--next')
    .option('-S|--skip-code-update')
    .action(async (options) => {
      checkDBDialect();
      if (options.skipCodeUpdate) {
        await runAppCommand('upgrade');
      } else {
        await run('nocobase', ['update-deps']);
        await run('nocobase', ['upgrade', '--skip-code-update']);
      }
    });
};
