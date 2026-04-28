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

/**
 * TODO
 */
export default (app: Application) => {
  app
    .command('upgrade')
    .ipc()
    .auth()
    .action(async (options) => {
      await app.upgrade(options);
      app.log.info(`✨  NocoBase has been upgraded to v${app.getVersion()}`);
    });
};
