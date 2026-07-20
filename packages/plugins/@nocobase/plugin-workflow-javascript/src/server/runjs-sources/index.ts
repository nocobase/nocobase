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

import { createWorkflowJavaScriptRunJSSourceAdapter } from './workflow-javascript-adapter';

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

export function registerWorkflowJavaScriptRunJSSourceAdapter(plugin: PluginWithApp): () => void {
  let unregisterAdapter: (() => void) | undefined;
  let listening = false;

  const tryRegister = (): boolean => {
    if (unregisterAdapter) {
      return true;
    }
    const registrar = findRunJSSourceAdapterRegistrar(plugin.app.pm);
    if (!registrar) {
      return false;
    }
    unregisterAdapter = registrar.registerRunJSSourceAdapter(createWorkflowJavaScriptRunJSSourceAdapter(plugin.db));
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
    unregisterAdapter?.();
    unregisterAdapter = undefined;
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
  for (const alias of LIGHT_EXTENSION_PLUGIN_ALIASES) {
    const plugin = pm.get?.(alias);
    if (isRunJSSourceAdapterRegistrar(plugin)) {
      return plugin;
    }
  }

  const plugins = pm.getPlugins?.();
  if (plugins) {
    for (const plugin of plugins.values()) {
      if (isRunJSSourceAdapterRegistrar(plugin)) {
        return plugin;
      }
    }
  }

  for (const alias of LEGACY_VSC_FILE_PLUGIN_ALIASES) {
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
