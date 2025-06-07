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
const { getInstanceIdAsync } = require('@nocobase/license-kit');
const path = require('path');
const fs = require('fs');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('generate-instance-id')
    .description('Generate InstanceID')
    .option('--force', 'Force generate InstanceID')
    .action(async (options) => {
      console.log('Generating InstanceID...');
      const dir = path.resolve(process.cwd(), 'storage/.license');
      const filePath = path.resolve(dir, 'instance-id');
      if (fs.existsSync(filePath) && !options.force) {
        console.log('InstanceID already exists at ' + filePath);
        return;
      } else {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        try {
          const instanceId = await getInstanceIdAsync();
          fs.writeFileSync(filePath, instanceId + '\n');
          console.log(chalk.greenBright(`InstanceID saved to ${filePath}`));
        } catch (e) {
          console.log(e);
        }
      }
    });
};
