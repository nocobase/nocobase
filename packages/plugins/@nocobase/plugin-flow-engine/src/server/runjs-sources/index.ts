/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type { RunJSSourceAdapter } from '@nocobase/server';

import { createFlowModelRunJSSourceAdapters } from './flow-model-adapters';

type PluginWithApp = {
  db: Database;
  app: {
    pm: PluginManagerLike;
    on?: (eventName: 'afterLoadPlugin', listener: PluginLoadListener) => unknown;
    off?: (eventName: 'afterLoadPlugin', listener: PluginLoadListener) => unknown;
    removeListener?: (eventName: 'afterLoadPlugin', listener: PluginLoadListener) => unknown;
  };
};

type PluginLoadListener = (plugin: unknown, options?: unknown) => void;

type PluginManagerLike = {
  get?: (name: string) => unknown;
  getPlugins?: () => Map<unknown, unknown>;
};

type RunJSSourceAdapterRegistrar = {
  registerRunJSSourceAdapter: (adapter: RunJSSourceAdapter) => () => void;
};

const LIGHT_EXTENSION_PLUGIN_ALIASES = [
  '@nocobase/plugin-light-extension',
  'light-extension',
  'plugin-light-extension',
];
const LEGACY_VSC_FILE_PLUGIN_ALIASES = ['@nocobase/plugin-vsc-file', 'vsc-file', 'plugin-vsc-file'];

export function registerFlowModelRunJSSourceAdapters(plugin: PluginWithApp): () => void {
  let unregisterAdapters: Array<() => void> = [];
  let listening = false;

  const tryRegister = (): boolean => {
    if (unregisterAdapters.length) {
      return true;
    }
    const registrar = findRunJSSourceAdapterRegistrar(plugin.app.pm);
    if (!registrar) {
      return false;
    }

    unregisterAdapters = createFlowModelRunJSSourceAdapters(plugin.db).map((adapter) =>
      registrar.registerRunJSSourceAdapter(adapter),
    );

    return true;
  };

  const onAfterLoadPlugin: PluginLoadListener = () => {
    if (tryRegister()) {
      removeAfterLoadPluginListener(plugin, onAfterLoadPlugin);
      listening = false;
    }
  };

  if (!tryRegister()) {
    plugin.app.on?.('afterLoadPlugin', onAfterLoadPlugin);
    listening = true;
  }

  return () => {
    unregisterAdapters.forEach((unregister) => unregister());
    unregisterAdapters = [];
    if (listening) {
      removeAfterLoadPluginListener(plugin, onAfterLoadPlugin);
      listening = false;
    }
  };
}

function removeAfterLoadPluginListener(plugin: PluginWithApp, listener: PluginLoadListener): void {
  if (plugin.app.off) {
    plugin.app.off('afterLoadPlugin', listener);
    return;
  }
  plugin.app.removeListener?.('afterLoadPlugin', listener);
}

function findRunJSSourceAdapterRegistrar(pm: PluginManagerLike): RunJSSourceAdapterRegistrar | null {
  const lightExtension = findRunJSSourceAdapterRegistrarByAliases(pm, LIGHT_EXTENSION_PLUGIN_ALIASES);
  if (lightExtension) {
    return lightExtension;
  }

  const plugins = pm.getPlugins?.();
  if (plugins) {
    for (const plugin of plugins.values()) {
      if (isRunJSSourceAdapterRegistrar(plugin)) {
        return plugin;
      }
    }
  }

  return findRunJSSourceAdapterRegistrarByAliases(pm, LEGACY_VSC_FILE_PLUGIN_ALIASES);
}

function findRunJSSourceAdapterRegistrarByAliases(
  pm: PluginManagerLike,
  aliases: string[],
): RunJSSourceAdapterRegistrar | null {
  for (const alias of aliases) {
    const plugin = pm.get?.(alias);
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
