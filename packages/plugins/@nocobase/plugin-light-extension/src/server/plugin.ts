/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { VscPermissionHook } from '@nocobase/plugin-vsc-file';
import { Plugin } from '@nocobase/server';
import { resolve } from 'path';

import { LIGHT_EXTENSION_ACL_ACTIONS, LIGHT_EXTENSION_ACL_SNIPPET } from '../constants';
import { LightExtensionAuditService } from './services/LightExtensionAuditService';
import { LightExtensionPermissionService } from './services/LightExtensionPermissionService';

type VscPermissionHookRegistrar = {
  registerPermissionHook: (hook: VscPermissionHook) => () => void;
};

type PluginManagerLike = {
  get?: (name: string) => unknown;
  getPlugins?: () => Map<unknown, unknown>;
};

type PluginLoadListener = (plugin: unknown, options?: unknown) => void;

type AppWithPluginEvents = {
  pm?: PluginManagerLike;
  acl?: {
    allow?: (resourceName: string, actionNames: readonly string[] | string, condition?: string) => void;
    registerSnippet?: (snippet: { name: string; actions: string[] }) => void;
  };
  on?: (eventName: 'afterLoadPlugin', listener: PluginLoadListener) => unknown;
  off?: (eventName: 'afterLoadPlugin', listener: PluginLoadListener) => unknown;
  removeListener?: (eventName: 'afterLoadPlugin', listener: PluginLoadListener) => unknown;
};

const VSC_FILE_PLUGIN_ALIASES = ['@nocobase/plugin-vsc-file', 'vsc-file', 'plugin-vsc-file'];

export class PluginLightExtensionServer extends Plugin {
  private auditService?: LightExtensionAuditService;

  private permissionService?: LightExtensionPermissionService;

  private unregisterVscPermissionHook?: () => void;

  private pendingVscPluginListener?: PluginLoadListener;

  async afterAdd() {}

  async beforeLoad() {
    const db = this.db;
    if (!db || this.options.packageName || db.hasCollection('lightExtensionRepos')) {
      return;
    }

    await db.import({
      directory: resolve(__dirname, 'collections'),
    });
  }

  async load() {
    const db = this.db;
    if (!db) {
      return;
    }

    this.auditService = new LightExtensionAuditService(db);
    this.permissionService = new LightExtensionPermissionService(this.auditService);
    this.registerAclActions();
    this.registerVscPermissionHookWhenAvailable();
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {
    this.unregisterVscPermissionHookWhenNeeded();
  }

  async remove() {
    this.unregisterVscPermissionHookWhenNeeded();
  }

  private registerAclActions() {
    const app = this.app as unknown as AppWithPluginEvents;
    app.acl?.allow?.('lightExtension', [...LIGHT_EXTENSION_ACL_ACTIONS], 'loggedIn');
    app.acl?.registerSnippet?.({
      name: LIGHT_EXTENSION_ACL_SNIPPET,
      actions: LIGHT_EXTENSION_ACL_ACTIONS.map((action) => `lightExtension:${action}`),
    });
  }

  private registerVscPermissionHookWhenAvailable() {
    if (this.tryRegisterVscPermissionHook()) {
      return;
    }

    const app = this.app as unknown as AppWithPluginEvents;
    if (!app.on || this.pendingVscPluginListener) {
      return;
    }

    const onAfterLoadPlugin: PluginLoadListener = () => {
      if (this.tryRegisterVscPermissionHook()) {
        this.removePendingVscPluginListener();
      }
    };
    this.pendingVscPluginListener = onAfterLoadPlugin;
    app.on('afterLoadPlugin', onAfterLoadPlugin);
  }

  private tryRegisterVscPermissionHook(): boolean {
    if (this.unregisterVscPermissionHook || !this.permissionService) {
      return Boolean(this.unregisterVscPermissionHook);
    }

    const registrar = findVscPermissionHookRegistrar((this.app as unknown as AppWithPluginEvents).pm);
    if (!registrar) {
      return false;
    }

    this.unregisterVscPermissionHook = registrar.registerPermissionHook(
      this.permissionService.createVscPermissionHook(),
    );
    return true;
  }

  private unregisterVscPermissionHookWhenNeeded() {
    this.removePendingVscPluginListener();
    this.unregisterVscPermissionHook?.();
    this.unregisterVscPermissionHook = undefined;
  }

  private removePendingVscPluginListener() {
    if (!this.pendingVscPluginListener) {
      return;
    }

    const app = this.app as unknown as AppWithPluginEvents;
    if (app.off) {
      app.off('afterLoadPlugin', this.pendingVscPluginListener);
    } else {
      app.removeListener?.('afterLoadPlugin', this.pendingVscPluginListener);
    }
    this.pendingVscPluginListener = undefined;
  }
}

function findVscPermissionHookRegistrar(pm?: PluginManagerLike): VscPermissionHookRegistrar | null {
  if (!pm) {
    return null;
  }

  for (const alias of VSC_FILE_PLUGIN_ALIASES) {
    const plugin = pm.get?.(alias);
    if (isVscPermissionHookRegistrar(plugin)) {
      return plugin;
    }
  }

  const plugins = pm.getPlugins?.();
  if (!plugins) {
    return null;
  }

  for (const plugin of plugins.values()) {
    if (isVscPermissionHookRegistrar(plugin)) {
      return plugin;
    }
  }

  return null;
}

function isVscPermissionHookRegistrar(value: unknown): value is VscPermissionHookRegistrar {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as { registerPermissionHook?: unknown }).registerPermissionHook === 'function'
  );
}

export default PluginLightExtensionServer;
