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
import { PluginManager } from '../plugin-manager';
import { findAllPlugins } from '../plugin-manager/findPackageNames';

/**
 * TODO
 */
export default (app: Application) => {
  app
    .command('upgrade')
    .ipc()
    .auth()
    .action(async (options) => {
      await app.aiManager.documentManager.createDocsIndex({
        findAllPlugins,
        pm: PluginManager,
        logger: app.log,
      });

      await app.upgrade(options);
      app.log.info(`✨  NocoBase has been upgraded to v${app.getVersion()}`);
    });
};
