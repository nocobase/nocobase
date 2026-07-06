/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { VscPermissionHook } from '@nocobase/plugin-vsc-file';
import { VscPermissionHookRegistry } from '@nocobase/plugin-vsc-file';
import { Plugin } from '@nocobase/server';
import { resolve } from 'path';

import { LIGHT_EXTENSION_ACL_ACTIONS, LIGHT_EXTENSION_ACL_SNIPPET } from '../constants';
import {
  createLightExtensionCapabilitiesResource,
  lightExtensionCapabilitiesActionNames,
} from './resources/lightExtensionCapabilities';
import { createLightExtensionEntriesResource, lightExtensionEntryActionNames } from './resources/lightExtensionEntries';
import { createLightExtensionFilesResource, lightExtensionFileActionNames } from './resources/lightExtensionFiles';
import { createLightExtensionReposResource, lightExtensionRepoActionNames } from './resources/lightExtensionRepos';
import { LightExtensionAuditService } from './services/LightExtensionAuditService';
import { LightExtensionEntryScanner } from './services/LightExtensionEntryScanner';
import { LightExtensionFileService } from './services/LightExtensionFileService';
import { LightExtensionPermissionService } from './services/LightExtensionPermissionService';
import { LightExtensionRepoService } from './services/LightExtensionRepoService';
import { LightExtensionValidator } from './services/LightExtensionValidator';

type VscPermissionHookRegistrar = {
  registerPermissionHook: (hook: VscPermissionHook) => () => void;
};

type VscPermissionHookRegistryProvider = {
  getPermissionHookRegistry: () => VscPermissionHookRegistry;
};

type PluginManagerLike = {
  get?: (name: string) => unknown;
  getPlugins?: () => Map<unknown, unknown>;
};

type PluginLoadListener = (plugin: unknown, options?: unknown) => void;

type AppWithPluginEvents = {
  pm?: PluginManagerLike;
  resourceManager?: {
    define?: (resource: unknown) => void;
    options?: {
      prefix?: string;
    };
  };
  acl?: {
    registerSnippet?: (snippet: { name: string; actions: string[] }) => void;
  };
  on?: (eventName: 'afterLoadPlugin', listener: PluginLoadListener) => unknown;
  off?: (eventName: 'afterLoadPlugin', listener: PluginLoadListener) => unknown;
  removeListener?: (eventName: 'afterLoadPlugin', listener: PluginLoadListener) => unknown;
  use?: (
    middleware: (ctx: LightExtensionRouteContext, next: () => Promise<void>) => Promise<void>,
    options?: unknown,
  ) => void;
};

type LightExtensionRouteContext = {
  path: string;
  method: string;
  request?: {
    path: string;
  };
  state?: {
    lightExtensionCapabilitiesAlias?: boolean;
  };
};

const VSC_FILE_PLUGIN_ALIASES = ['@nocobase/plugin-vsc-file', 'vsc-file', 'plugin-vsc-file'];
const DOCUMENTED_CAPABILITIES_ROUTE = '/light-extensions/capabilities';

export class PluginLightExtensionServer extends Plugin {
  private auditService?: LightExtensionAuditService;

  private permissionService?: LightExtensionPermissionService;

  private repoService?: LightExtensionRepoService;

  private fileService?: LightExtensionFileService;

  private validator?: LightExtensionValidator;

  private entryScanner?: LightExtensionEntryScanner;

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
    this.validator = new LightExtensionValidator();
    const sharedVscPermissionHooks = findVscPermissionHookRegistry((this.app as unknown as AppWithPluginEvents).pm);
    this.repoService = new LightExtensionRepoService(
      db,
      this.auditService,
      this.permissionService,
      sharedVscPermissionHooks,
      this.validator,
    );
    this.fileService = new LightExtensionFileService(
      db,
      this.auditService,
      this.permissionService,
      this.repoService,
      sharedVscPermissionHooks,
      this.validator,
    );
    this.entryScanner = new LightExtensionEntryScanner(
      db,
      this.auditService,
      this.fileService,
      this.repoService,
      this.validator,
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionReposResource(this.repoService),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionFilesResource(this.fileService),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionEntriesResource(this.entryScanner),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionCapabilitiesResource(this.validator),
    );
    this.registerCapabilitiesHttpRoute();
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
    app.acl?.registerSnippet?.({
      name: LIGHT_EXTENSION_ACL_SNIPPET,
      actions: [
        ...LIGHT_EXTENSION_ACL_ACTIONS.map((action) => `lightExtension:${action}`),
        ...lightExtensionRepoActionNames.map((action) => `lightExtensionRepos:${action}`),
        ...lightExtensionFileActionNames.map((action) => `lightExtensionFiles:${action}`),
        ...lightExtensionEntryActionNames.map((action) => `lightExtensionEntries:${action}`),
        ...lightExtensionCapabilitiesActionNames.map((action) => `lightExtensionCapabilities:${action}`),
      ],
    });
  }

  private registerCapabilitiesHttpRoute() {
    const app = this.app as unknown as AppWithPluginEvents;
    app.use?.(
      async (ctx, next) => {
        if (ctx.method !== 'GET' || ctx.path !== getDocumentedCapabilitiesPath(app.resourceManager?.options?.prefix)) {
          await next();
          return;
        }

        if (!ctx.state) {
          ctx.state = {};
        }
        ctx.state.lightExtensionCapabilitiesAlias = true;
        const resourcePath = getCapabilitiesResourcePath(app.resourceManager?.options?.prefix);
        const originalPath = ctx.path;
        const originalRequestPath = ctx.request?.path;
        try {
          ctx.path = resourcePath;
          if (ctx.request) {
            ctx.request.path = resourcePath;
          }
          await next();
        } finally {
          ctx.path = originalPath;
          if (ctx.request && originalRequestPath) {
            ctx.request.path = originalRequestPath;
          }
        }
      },
      {
        tag: 'light-extension-capabilities',
        before: 'dataSource',
      },
    );
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
    const permissionHooks = findVscPermissionHookRegistry((this.app as unknown as AppWithPluginEvents).pm);
    if (permissionHooks) {
      this.repoService?.useVscPermissionHookRegistry(permissionHooks);
      this.fileService?.useVscPermissionHookRegistry(permissionHooks);
    }
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

function getDocumentedCapabilitiesPath(resourcePrefix?: string): string {
  return `${normalizeBasePath(resourcePrefix ?? process.env.API_BASE_PATH ?? '/api')}${DOCUMENTED_CAPABILITIES_ROUTE}`;
}

function getCapabilitiesResourcePath(resourcePrefix?: string): string {
  return `${normalizeBasePath(resourcePrefix ?? '')}/lightExtensionCapabilities:get`;
}

function normalizeBasePath(path: string): string {
  const normalized = `/${path.trim().replace(/^\/+|\/+$/g, '')}`;
  return normalized === '/' ? '' : normalized;
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

function findVscPermissionHookRegistry(pm?: PluginManagerLike): VscPermissionHookRegistry | undefined {
  if (!pm) {
    return undefined;
  }

  for (const alias of VSC_FILE_PLUGIN_ALIASES) {
    const plugin = pm.get?.(alias);
    if (isVscPermissionHookRegistryProvider(plugin)) {
      return plugin.getPermissionHookRegistry();
    }
  }

  const plugins = pm.getPlugins?.();
  if (!plugins) {
    return undefined;
  }

  for (const plugin of plugins.values()) {
    if (isVscPermissionHookRegistryProvider(plugin)) {
      return plugin.getPermissionHookRegistry();
    }
  }

  return undefined;
}

function isVscPermissionHookRegistrar(value: unknown): value is VscPermissionHookRegistrar {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as { registerPermissionHook?: unknown }).registerPermissionHook === 'function'
  );
}

function isVscPermissionHookRegistryProvider(value: unknown): value is VscPermissionHookRegistryProvider {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as { getPermissionHookRegistry?: unknown }).getPermissionHookRegistry === 'function'
  );
}

export default PluginLightExtensionServer;
