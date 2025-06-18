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

const REPL = require('repl');

export default (app: Application) => {
  app
    .command('console')
    .preload()
    .action(async () => {
      await app.start();
      const repl = (REPL.start('nocobase > ').context.app = app);
      repl.on('exit', async function (err) {
        if (err) {
          app.log.error(err);
          process.exit(1);
        }
        await app.stop();
        process.exit(0);
      });
    });
};
