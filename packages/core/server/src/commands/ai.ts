/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type Application from '../application';
import { findAllPlugins } from '../plugin-manager/findPackageNames';
import { PluginManager } from '../plugin-manager';

export default (app: Application) => {
  const ai = app.command('ai');

  ai.command('create-docs-index')
    .option('--pkg [pkg]', 'Generate docs index for the specified plugin package (comma separated).')
    .action(async (...cliArgs) => {
      const [opts] = cliArgs as [{ pkg?: string | string[] }?];
      await app.aiManager.documentManager.createDocsIndex({
        pkg: opts?.pkg,
        findAllPlugins,
        pm: PluginManager,
        logger: app.log,
      });
    });
};
