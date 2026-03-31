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
    .command('db:sync')
    .auth()
    .preload()
    .action(async (...cliArgs) => {
      const [opts] = cliArgs;
      console.log('db sync...');

      const Collection = app.db.getCollection('collections');
      if (Collection) {
        // @ts-ignore
        await Collection.repository.setApp(app);
        // @ts-ignore
        await Collection.repository.load();
      }

      app.log.info('syncing database...');

      const force = false;
      await app.db.sync({
        force,
        alter: {
          drop: force,
        },
      });
    });
};
