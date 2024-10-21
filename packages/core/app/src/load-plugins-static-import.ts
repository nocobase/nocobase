/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { findBuiltInPlugins, findLocalPlugins } from '@nocobase/preset-nocobase';
import { PluginManager } from '@nocobase/server';

export async function loadPluginsStaticImport() {
  const packages = [...(await findBuiltInPlugins()), ...(await findLocalPlugins())];
  for (const name of packages) {
    const { packageName } = await PluginManager.parseName(name);

    try {
      const plugin = require(packageName);
      if (plugin && plugin.staticImport) {
        plugin.staticImport();
      }
    } catch (error) {
      continue;
    }
  }
}
