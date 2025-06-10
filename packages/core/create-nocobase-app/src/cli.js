/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const chalk = require('chalk');
const { resolve } = require('path');
const { Command } = require('commander');
const { AppGenerator } = require('./generator');
const { concat } = require('./util');
const packageJson = require('../package.json');

const cli = new Command('create-nocobase');

cli
  .arguments('<name>', 'directory of new NocoBase app')
  .option('--quickstart', 'quickstart app creation')
  .option('--skip-dev-dependencies')
  .option('-a, --all-db-dialect', 'install all database dialect dependencies')
  .option('-d, --db-dialect [dbDialect]', 'database dialect, current support postgres, mysql, mariadb, kingbase')
  .option('-e, --env <env>', 'environment variables write into .env file', concat, [])
  .description('create a new application')
  .action(async (name, options) => {
    if (options.quickstart) {
      console.log(`⚠️  ${chalk.yellow('quickstart option is deprecated')}`);
    }

    const generator = new AppGenerator({
      cwd: resolve(process.cwd(), name),
      args: options,
      context: {
        name,
        version: packageJson.version,
      },
    });

    await generator.run();
  });

module.exports = cli;
