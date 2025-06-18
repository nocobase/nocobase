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
    .command('migrator')
    .preload()
    .action(async (opts) => {
      app.log.info('migrating...');
      await app.emitAsync('cli.beforeMigrator', opts);
      await app.db.migrator.runAsCLI(process.argv.slice(3));
      await app.stop();
    });
};
