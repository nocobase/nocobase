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
    .command('repair')
    .auth()
    .preload()
    .action(async (options) => {
      app.log.info('start repair data...');
      const Collection = app.db.getCollection('collections');
      if (Collection) {
        // @ts-ignore
        await Collection.repository.setApp(app);
        // @ts-ignore
        await Collection.repository.load();
      }
      await app.emitAsync('repair', options);
    });
};
