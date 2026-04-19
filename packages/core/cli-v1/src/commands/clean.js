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
    .option('--dist', 'only clean build output (lib,esm,es,dist), keep node_modules')
    .action((options) => {
      if (!isDev()) {
        return;
      }
      if (options.dist) {
        run('rimraf', ['-rf', 'packages/*/*/{lib,esm,es}']);
        run('rimraf', ['-rf', 'packages/*/@*/*/{lib,esm,es,dist}']);
        // Clean dist separately, skip packages/core/cli/dist to keep the nb CLI functional
        const fg = require('fast-glob');
        const distDirs = fg.sync(['packages/*/*/dist', '!packages/core/cli/dist'], { onlyDirectories: true });
        if (distDirs.length) {
          run('rimraf', ['-rf', ...distDirs]);
        }
      } else {
        run('rimraf', ['-rf', './storage/app-dev']);
        run('rimraf', ['-rf', 'packages/*/*/{lib,esm,es,dist,node_modules}']);
        run('rimraf', ['-rf', 'packages/*/@*/*/{lib,esm,es,dist,node_modules}']);
      }
    });
};
