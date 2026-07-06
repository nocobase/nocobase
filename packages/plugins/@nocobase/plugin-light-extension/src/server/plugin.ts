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
import {
  createLightExtensionPublicationsResource,
  lightExtensionPublicationActionNames,
} from './resources/lightExtensionPublications';
import { createLightExtensionReposResource, lightExtensionRepoActionNames } from './resources/lightExtensionRepos';
import {
  createLightExtensionRuntimeResource,
  lightExtensionRuntimeActionNames,
} from './resources/lightExtensionRuntime';
import { createLightExtensionsResource, lightExtensionActionNames } from './resources/lightExtensions';
import { LightExtensionAuditService } from './services/LightExtensionAuditService';
import { LightExtensionAuthoringInspector } from './services/LightExtensionAuthoringInspector';
import { LightExtensionCompilePreviewService } from './services/LightExtensionCompilePreviewService';
import { LightExtensionEntryScanner } from './services/LightExtensionEntryScanner';
import { LightExtensionFileService } from './services/LightExtensionFileService';
import { LightExtensionPermissionService } from './services/LightExtensionPermissionService';
import { LightExtensionPublicationResolveService } from './services/LightExtensionPublicationResolveService';
import { LightExtensionPublicationService } from './services/LightExtensionPublicationService';
import { LightExtensionPublishService } from './services/LightExtensionPublishService';
import { LightExtensionRepoService } from './services/LightExtensionRepoService';
import { LightExtensionValidator } from './services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from './services/LightExtensionWorkspaceCompilerBridge';
import { RuntimeResolveService } from './services/RuntimeResolveService';

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
const DOCUMENTED_COMPILE_PREVIEW_ROUTE = /^\/light-extensions\/([^/]+)\/compile-preview$/;
const DOCUMENTED_PUBLICATION_ROUTE = /^\/light-extension-publications\/([^/]+)$/;
const DOCUMENTED_RUNTIME_RESOLVE_ROUTE = '/light-extension-runtime/resolve';

export class PluginLightExtensionServer extends Plugin {
  private auditService?: LightExtensionAuditService;

  private permissionService?: LightExtensionPermissionService;

  private repoService?: LightExtensionRepoService;

  private fileService?: LightExtensionFileService;

  private validator?: LightExtensionValidator;

  private authoringInspector?: LightExtensionAuthoringInspector;

  private workspaceCompilerBridge?: LightExtensionWorkspaceCompilerBridge;

  private compilePreviewService?: LightExtensionCompilePreviewService;

  private publicationService?: LightExtensionPublicationService;

  private publicationResolveService?: LightExtensionPublicationResolveService;

  private runtimeResolveService?: RuntimeResolveService;

  private publishService?: LightExtensionPublishService;

  private entryScanner?: LightExtensionEntryScanner;

  private unregisterVscPermissionHook?: () => void;

  private pendingVscPluginListener?: PluginLoadListener;

  getWorkspaceCompilerBridge(): LightExtensionWorkspaceCompilerBridge | undefined {
    return this.workspaceCompilerBridge;
  }

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
    this.authoringInspector = new LightExtensionAuthoringInspector();
    this.workspaceCompilerBridge = new LightExtensionWorkspaceCompilerBridge(
      this.auditService,
      this.permissionService,
      this.authoringInspector,
    );
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
    this.compilePreviewService = new LightExtensionCompilePreviewService(
      db,
      this.auditService,
      this.fileService,
      this.permissionService,
      this.workspaceCompilerBridge,
      this.validator,
    );
    this.publicationService = new LightExtensionPublicationService(db, this.auditService, this.permissionService);
    this.publicationResolveService = new LightExtensionPublicationResolveService(
      db,
      this.auditService,
      this.permissionService,
    );
    this.runtimeResolveService = new RuntimeResolveService(this.publicationResolveService);
    this.publishService = new LightExtensionPublishService(
      db,
      this.fileService,
      this.permissionService,
      this.workspaceCompilerBridge,
      this.publicationService,
      this.validator,
      this.auditService,
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionsResource(this.compilePreviewService, this.publishService),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionPublicationsResource(this.publicationResolveService),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionRuntimeResource(this.runtimeResolveService),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionReposResource(this.repoService),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionFilesResource(this.fileService),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionEntriesResource(this.entryScanner, this.publicationService),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionCapabilitiesResource(this.validator),
    );
    this.registerCapabilitiesHttpRoute();
    this.registerCompilePreviewHttpRoute();
    this.registerPublicationHttpRoute();
    this.registerRuntimeResolveHttpRoute();
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
        ...lightExtensionActionNames.map((action) => `lightExtensions:${action}`),
        ...lightExtensionPublicationActionNames.map((action) => `lightExtensionPublications:${action}`),
        ...lightExtensionRuntimeActionNames.map((action) => `lightExtensionRuntime:${action}`),
        ...lightExtensionRepoActionNames.map((action) => `lightExtensionRepos:${action}`),
        ...lightExtensionFileActionNames.map((action) => `lightExtensionFiles:${action}`),
        ...lightExtensionEntryActionNames.map((action) => `lightExtensionEntries:${action}`),
        ...lightExtensionCapabilitiesActionNames.map((action) => `lightExtensionCapabilities:${action}`),
      ],
    });
  }

  private registerCompilePreviewHttpRoute() {
    const app = this.app as unknown as AppWithPluginEvents;
    app.use?.(
      async (ctx, next) => {
        const repoId = getDocumentedCompilePreviewRepoId(ctx.path, app.resourceManager?.options?.prefix);
        if (ctx.method !== 'POST' || !repoId) {
          await next();
          return;
        }

        const resourcePath = getCompilePreviewResourcePath(repoId, app.resourceManager?.options?.prefix);
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
        tag: 'light-extension-compile-preview',
        before: 'dataSource',
      },
    );
  }

  private registerPublicationHttpRoute() {
    const app = this.app as unknown as AppWithPluginEvents;
    app.use?.(
      async (ctx, next) => {
        const publicationId = getDocumentedPublicationId(ctx.path, app.resourceManager?.options?.prefix);
        if (ctx.method !== 'GET' || !publicationId) {
          await next();
          return;
        }

        const resourcePath = getPublicationResourcePath(publicationId, app.resourceManager?.options?.prefix);
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
        tag: 'light-extension-publications',
        before: 'dataSource',
      },
    );
  }

  private registerRuntimeResolveHttpRoute() {
    const app = this.app as unknown as AppWithPluginEvents;
    app.use?.(
      async (ctx, next) => {
        if (
          ctx.method !== 'POST' ||
          ctx.path !== getDocumentedRuntimeResolvePath(app.resourceManager?.options?.prefix)
        ) {
          await next();
          return;
        }

        const resourcePath = getRuntimeResolveResourcePath(app.resourceManager?.options?.prefix);
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
        tag: 'light-extension-runtime-resolve',
        before: 'dataSource',
      },
    );
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

function getDocumentedRuntimeResolvePath(resourcePrefix?: string): string {
  return `${normalizeBasePath(
    resourcePrefix ?? process.env.API_BASE_PATH ?? '/api',
  )}${DOCUMENTED_RUNTIME_RESOLVE_ROUTE}`;
}

function getDocumentedCompilePreviewRepoId(path: string, resourcePrefix?: string): string | null {
  const basePath = normalizeBasePath(resourcePrefix ?? process.env.API_BASE_PATH ?? '/api');
  if (!path.startsWith(`${basePath}/`)) {
    return null;
  }

  const routePath = path.slice(basePath.length);
  const match = DOCUMENTED_COMPILE_PREVIEW_ROUTE.exec(routePath);
  if (!match?.[1]) {
    return null;
  }

  return decodeURIComponent(match[1]);
}

function getDocumentedPublicationId(path: string, resourcePrefix?: string): string | null {
  const basePath = normalizeBasePath(resourcePrefix ?? process.env.API_BASE_PATH ?? '/api');
  if (!path.startsWith(`${basePath}/`)) {
    return null;
  }

  const routePath = path.slice(basePath.length);
  const match = DOCUMENTED_PUBLICATION_ROUTE.exec(routePath);
  if (!match?.[1]) {
    return null;
  }

  return decodeURIComponent(match[1]);
}

function getCapabilitiesResourcePath(resourcePrefix?: string): string {
  return `${normalizeBasePath(resourcePrefix ?? '')}/lightExtensionCapabilities:get`;
}

function getCompilePreviewResourcePath(repoId: string, resourcePrefix?: string): string {
  return `${normalizeBasePath(resourcePrefix ?? '')}/lightExtensions:compilePreview/${encodeURIComponent(repoId)}`;
}

function getPublicationResourcePath(publicationId: string, resourcePrefix?: string): string {
  return `${normalizeBasePath(resourcePrefix ?? '')}/lightExtensionPublications:get/${encodeURIComponent(
    publicationId,
  )}`;
}

function getRuntimeResolveResourcePath(resourcePrefix?: string): string {
  return `${normalizeBasePath(resourcePrefix ?? '')}/lightExtensionRuntime:resolve`;
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
