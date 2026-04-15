/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const { resolve } = require('path');
const { Command } = require('commander');
const { run, nodeCheck, isPackageValid } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('tar')
    .allowUnknownOption()
    .argument('[packages...]')
    .option('-v, --version', 'print version')
    .option('-c, --compile', 'compile the @nocobase/build package')
    .option('-w, --watch', 'watch compile the @nocobase/build package')
    .action(async (pkgs, options) => {
      nodeCheck();
      if (options.compile || options.watch || isPackageValid('@nocobase/build/src/index.ts')) {
        await run('yarn', ['build', options.watch ? '--watch' : ''], {
          cwd: resolve(process.cwd(), 'packages/core/build'),
        });
        if (options.watch) return;
      }
      await run('nocobase-build', [...pkgs, '--only-tar', options.version ? '--version' : '']);
    });
};
