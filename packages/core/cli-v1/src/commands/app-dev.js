/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const { run } = require('../util');

/**
 *
 * @param {import('commander').Command} cli
 */
module.exports = (cli) => {
  cli
    .command('app-dev')
    .description('Run the published app shell with local plugin development support')
    .allowUnknownOption()
    .action(async () => {
      await run('nocobase-v1', ['dev', '--rsbuild', ...process.argv.slice(3)], {
        env: {
          NOCOBASE_DEV_LOCAL_PLUGINS_ONLY: 'true',
        },
      });
    });
};
