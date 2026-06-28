/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type { RunJSSourceAdapter } from '@nocobase/plugin-vsc-file';

import { createFlowModelRunJSSourceAdapters } from './flow-model-adapters';

type PluginWithApp = {
  db: Database;
  app: {
    pm: PluginManagerLike;
  };
};

type PluginManagerLike = {
  get?: (name: string) => unknown;
  getPlugins?: () => Map<unknown, unknown>;
};

type RunJSSourceAdapterRegistrar = {
  registerRunJSSourceAdapter: (adapter: RunJSSourceAdapter) => () => void;
};

const VSC_FILE_PLUGIN_ALIASES = ['@nocobase/plugin-vsc-file', 'vsc-file', 'plugin-vsc-file'];

export function registerFlowModelRunJSSourceAdapters(plugin: PluginWithApp): void {
  const registrar = findRunJSSourceAdapterRegistrar(plugin.app.pm);
  if (!registrar) {
    return;
  }

  for (const adapter of createFlowModelRunJSSourceAdapters(plugin.db)) {
    registrar.registerRunJSSourceAdapter(adapter);
  }
}

function findRunJSSourceAdapterRegistrar(pm: PluginManagerLike): RunJSSourceAdapterRegistrar | null {
  for (const alias of VSC_FILE_PLUGIN_ALIASES) {
    const plugin = pm.get?.(alias);
    if (isRunJSSourceAdapterRegistrar(plugin)) {
      return plugin;
    }
  }

  const plugins = pm.getPlugins?.();
  if (!plugins) {
    return null;
  }

  for (const plugin of plugins.values()) {
    if (isRunJSSourceAdapterRegistrar(plugin)) {
      return plugin;
    }
  }

  return null;
}

function isRunJSSourceAdapterRegistrar(value: unknown): value is RunJSSourceAdapterRegistrar {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as { registerRunJSSourceAdapter?: unknown }).registerRunJSSourceAdapter === 'function'
  );
}
