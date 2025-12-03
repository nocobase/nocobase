/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Application from '../application';

export default (app: Application) => {
  app
    .command('refresh-data')
    .auth()
    .preload()
    .action(async (options) => {
      app.log.info('refreshing data...');
      await app.emitAsync('beforeStart', app, {});
      await app.emitAsync('refresh-data', options);
    });
};
