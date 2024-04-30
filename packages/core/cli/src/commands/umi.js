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
  const { APP_PACKAGE_ROOT } = process.env;
  cli
    .command('umi')
    .allowUnknownOption()
    .action(() => {
      if (!isDev()) {
        return;
      }
      run('umi', process.argv.slice(3), {
        env: {
          APP_ROOT: `${APP_PACKAGE_ROOT}/client`,
        },
      });
    });
};
