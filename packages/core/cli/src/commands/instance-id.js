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
    .allowUnknownOption()
    .action(async () => {
      console.log('Generating InstanceID...');
      try {
        const dir = path.resolve(process.cwd(), 'storage/.license');
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const filePath = path.resolve(dir, 'InstanceID');
        const instanceId = await getInstanceIdAsync();
        fs.writeFileSync(filePath, instanceId + '\n');
        console.log(chalk.greenBright(`InstanceID saved to ${filePath}`));
      } catch (e) {
        console.log(e);
      }
    });
};
