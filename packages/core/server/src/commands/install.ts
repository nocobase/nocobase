/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */

import Application from '../application';

export default (app: Application) => {
  app
    .command('install')
    .ipc()
    .auth()
    .option('-f, --force')
    .option('-c, --clean')
    .option('--lang <lang>')
    .action(async (options) => {
      if (options.lang) {
        process.env.INIT_APP_LANG = options.lang;
      }
      await app.install(options);
      const reinstall = options.clean || options.force;
      app.log.info(`app ${reinstall ? 'reinstalled' : 'installed'} successfully [v${app.getVersion()}]`);
    });
};
