/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */

import dayjs from 'dayjs';
import fs from 'fs';
import { dirname, resolve } from 'path';
import Application from '../application';

export default (app: Application) => {
  app
    .command('create-migration')
    .argument('<name>')
    .option('--pkg <pkg>')
    .option('--on [on]')
    .action(async (name, options) => {
      const pkg = options.pkg;
      const dir = await fs.promises.realpath(resolve(process.env.NODE_MODULES_PATH, pkg));
      const filename = resolve(
        dir,
        pkg === '@nocobase/server' ? 'src' : 'src/server',
        'migrations',
        `${dayjs().format('YYYYMMDDHHmmss')}-${name}.ts`,
      );
      const version = app.getVersion();
      // 匹配主版本号、次版本号、小版本号和后缀的正则表达式
      const regex = /(\d+)\.(\d+)\.(\d+)(-[\w.]+)?/;
      const nextVersion = version.replace(regex, (match, major, minor, patch, suffix) => {
        // 将小版本号转换为整数并加1
        const newPatch = parseInt(patch) + 1;
        // 返回新的版本号
        return `${major}.${minor}.${newPatch}${suffix || ''}`;
      });
      const from = pkg === '@nocobase/server' ? `../migration` : '@nocobase/server';
      const data = `import { Migration } from '${from}';

export default class extends Migration {
  on = '${options.on || 'afterLoad'}'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<${nextVersion}';

  async up() {
    // coding
  }
}
`;
      await fs.promises.mkdir(dirname(filename), { recursive: true });
      await fs.promises.writeFile(filename, data, 'utf8');
      app.log.info(`migration file in ${filename}`);
    });
};
