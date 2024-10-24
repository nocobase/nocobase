/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { findAllPlugins, PluginManager } from '@nocobase/server';

export async function runPluginStaticImports() {
  const packages = await findAllPlugins();
  for (const name of packages) {
    const { packageName } = await PluginManager.parseName(name);
    try {
      const plugin = require(packageName);
      if (plugin && plugin.staticImport) {
        await plugin.staticImport();
      }
    } catch (error) {
      continue;
    }
  }
}
