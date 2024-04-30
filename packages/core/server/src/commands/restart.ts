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
    .command('restart')
    .ipc()
    .action(async (...cliArgs) => {
      if (!(await app.isStarted())) {
        app.log.info('app has not started');
        return;
      }
      await app.restart({
        cliArgs,
      });
      app.log.info('app has been restarted');
    });
};
