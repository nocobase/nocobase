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
    .command('db:clean')
    .auth()
    .option('-y, --yes')
    .action(async (opts) => {
      app.log.info('Clearing database');
      await app.db.clean({
        drop: opts.yes,
      });
    });
};
