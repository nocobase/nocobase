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
const { run, isDev } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('clean')
    .allowUnknownOption()
    .action(() => {
      if (!isDev()) {
        return;
      }
      run('rimraf', ['-rf', './storage/app-dev']);
      run('rimraf', ['-rf', 'packages/*/*/{lib,esm,es,dist,node_modules}']);
      run('rimraf', ['-rf', 'packages/*/@*/*/{lib,esm,es,dist,node_modules}']);
    });
};
