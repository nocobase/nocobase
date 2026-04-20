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
const { keyDecrypt } = require('@nocobase/license-kit');
const path = require('path');
const fs = require('fs');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('view-license-key')
    .description('View License Key')
    .action(async (options) => {
      const dir = path.resolve(process.cwd(), 'storage/.license');
      const filePath = path.resolve(dir, 'license-key');
      if (!fs.existsSync(filePath)) {
        console.log('License key not found at ' + filePath);
        return;
      }
      const key = fs.readFileSync(filePath, 'utf-8');
      let keyDataStr;
      try {
        keyDataStr = keyDecrypt(key);
      } catch (e) {
        console.log('License key decrypt failed', e);
        return;
      }
      const keyData = JSON.parse(keyDataStr);
      const { accessKeyId, accessKeySecret } = keyData;
      console.log(chalk.greenBright(`Access Key ID: ${accessKeyId}`));
      console.log(chalk.greenBright(`Access Key Secret: ${accessKeySecret}`));
    });
};
