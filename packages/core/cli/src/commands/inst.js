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
const { keygen } = require('../environment-keygen');
const path = require('path');
/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('inst')
    .allowUnknownOption()
    .action(() => {
      // if (!isDev()) {
      //   return;
      // }
      // run('rimraf', ['-rf', './storage/app-dev']);
      // run('rimraf', ['-rf', 'packages/*/*/{lib,esm,es,dist,node_modules}']);
      // run('rimraf', ['-rf', 'packages/*/@*/*/{lib,esm,es,dist,node_modules}']);
      const filePath = path.resolve(process.cwd(), 'instance.enc');
      keygen({ filePath });
      console.log(chalk.greenBright(`Instance key saved to ${filePath}`));
    });
};
