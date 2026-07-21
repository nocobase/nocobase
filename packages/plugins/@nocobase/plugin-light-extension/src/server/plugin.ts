/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_ENTRY_SCHEMA_LOCAL_PATH } from '@nocobase/light-extension-sdk/schema';
import type {
  RemoteSyncRuntime,
  RunJSSourceAdapter,
  RunJSSourceAdapterRegistry,
  RunJSSourceAuthoringInspector,
  VscPermissionHook,
} from './vsc-file/public-api';
import type { LightExtensionOwnerAuthoringContextResolver } from '../shared/context-pack';
import { VscFileService, VscPermissionHookRegistry } from './vsc-file/public-api';
import { VscFileServerModule } from './vsc-file/plugin';
import { Plugin } from '@nocobase/server';
import { resolve } from 'path';

import { LIGHT_EXTENSION_ACL_ACTIONS, LIGHT_EXTENSION_ACL_SNIPPET } from '../constants';
import { LightExtensionError } from '../shared/errors';
import { lightExtensionEntryV1SchemaFileContent } from './lightExtensionEntrySchema';
import {
  createLightExtensionCapabilitiesResource,
  lightExtensionCapabilitiesActionNames,
} from './resources/lightExtensionCapabilities';
import { createLightExtensionEntriesResource, lightExtensionEntryActionNames } from './resources/lightExtensionEntries';
import {
  createLightExtensionContextsResource,
  lightExtensionContextActionNames,
} from './resources/lightExtensionContexts';
import { createLightExtensionFilesResource, lightExtensionFileActionNames } from './resources/lightExtensionFiles';
import { createLightExtensionReposResource, lightExtensionRepoActionNames } from './resources/lightExtensionRepos';
import {
  createLightExtensionSyncResource,
  lightExtensionSyncActionNames,
  sanitizeUnsafeLightExtensionSyncTransport,
} from './resources/lightExtensionSync';
import type { LightExtensionResourceContext } from './resources/resourceAction';
import {
  createLightExtensionRuntimeResource,
  lightExtensionRuntimeActionNames,
} from './resources/lightExtensionRuntime';
import {
  createLightExtensionReferencesResource,
  lightExtensionReferenceActionNames,
} from './resources/lightExtensionReferences';
import {
  createLightExtensionPreviewProblemsResource,
  lightExtensionPreviewProblemActionNames,
} from './resources/lightExtensionPreviewProblems';
import { createLightExtensionsResource, lightExtensionActionNames } from './resources/lightExtensions';
import { LightExtensionAuditService } from './services/LightExtensionAuditService';
import { LightExtensionCompilePreviewService } from './services/LightExtensionCompilePreviewService';
import {
  LightExtensionContextPackService,
  type LightExtensionContextCollectionLike,
} from './services/LightExtensionContextPackService';
import { LightExtensionCompileWorkerPool } from './services/LightExtensionCompileWorkerPool';
import type {
  ClientAppDescriptor,
  ClientAppReferenceResolver,
  ClientAppStaticRequest,
  ClientAppStaticResponse,
  ClientAppSummary,
} from './services/ClientAppService';
import { ClientAppService } from './services/ClientAppService';
import { JsPortalStorage } from './services/JsPortalStorage';
import { LightExtensionEntryService } from './services/LightExtensionEntryService';
import { LightExtensionFileService } from './services/LightExtensionFileService';
import { LightExtensionPermissionService } from './services/LightExtensionPermissionService';
import {
  CacheLightExtensionPreviewProblemStorage,
  LightExtensionPreviewProblemService,
} from './services/LightExtensionPreviewProblemService';
import { LightExtensionRemotePullService } from './services/LightExtensionRemotePullService';
import { LightExtensionRepoService } from './services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from './services/LightExtensionRuntimeCompileService';
import { LightExtensionValidator } from './services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from './services/LightExtensionWorkspaceCompilerBridge';
import { RuntimeResolveService } from './services/RuntimeResolveService';
import { ReferenceService } from './services/ReferenceService';
import { MoveSourceService } from './services/MoveSourceService';
import { MoveToInlineService } from './services/MoveToInlineService';
import { ReferenceOwnerAuthoringContextResolverRegistry } from './services/ReferenceOwnerRegistry';

type AppWithPluginEvents = {
  log?: unknown;
  cacheManager?: {
    createCache?: (options: { name: string; prefix?: string }) => Promise<{
      set(key: string, value: unknown, ttl?: number): Promise<void>;
      get<T>(key: string): Promise<T | undefined>;
      del(key: string): Promise<void>;
    }>;
  };
  lockManager?: {
    runExclusive<T>(key: string, callback: () => Promise<T>, ttl?: number): Promise<T>;
  };
  resourceManager?: {
    define?: (resource: unknown) => void;
    options?: {
      prefix?: string;
    };
  };
  dataSourceManager?: {
    get?: (key: string) =>
      | {
          acl?: {
            can?: (input: { roles: string[]; resource: string; action: string }) => unknown;
          };
          collectionManager?: {
            getCollection?: (name: string) => unknown;
          };
        }
      | undefined;
  };
  acl?: {
    allow?: (
      resource: string,
      actions: string | string[],
      condition:
        | string
        | ((ctx: {
            can?: (input: { resource: string; action: string }) => unknown | Promise<unknown>;
          }) => boolean | Promise<boolean>),
    ) => void;
    registerSnippet?: (snippet: { name: string; actions: string[] }) => void;
  };
  on?: (eventName: 'afterStart' | 'beforeStop', listener: () => Promise<void>) => unknown;
  off?: (eventName: 'afterStart' | 'beforeStop', listener: () => Promise<void>) => unknown;
  removeListener?: (eventName: 'afterStart' | 'beforeStop', listener: () => Promise<void>) => unknown;
  use?: (
    middleware: (ctx: LightExtensionRouteContext, next: () => Promise<void>) => Promise<void>,
    options?: unknown,
  ) => void;
};

type LightExtensionRouteContext = {
  body?: unknown;
  path: string;
  method: string;
  status?: number;
  type?: string;
  set?: (name: string, value: string) => void;
  request?: {
    path: string;
    headers?: Record<string, string | string[] | undefined>;
  };
  state?: {
    lightExtensionCapabilitiesAlias?: boolean;
  };
};

const DOCUMENTED_CAPABILITIES_ROUTE = '/light-extensions/capabilities';
const DOCUMENTED_COMPILE_PREVIEW_ROUTE = /^\/light-extensions\/([^/]+)\/compile-preview$/;
const DOCUMENTED_RUNTIME_RESOLVE_ROUTE = '/light-extension-runtime/resolve';
const DOCUMENTED_RUNTIME_ARTIFACT_ROUTE = /^\/light-extension-runtime\/artifacts\/([^/]+)$/;

export class PluginLightExtensionServer extends Plugin {
  private vscFileServerModule?: VscFileServerModule;

  private auditService?: LightExtensionAuditService;

  private permissionService?: LightExtensionPermissionService;

  private repoService?: LightExtensionRepoService;

  private fileService?: LightExtensionFileService;

  private validator?: LightExtensionValidator;

  private workspaceCompilerBridge?: LightExtensionWorkspaceCompilerBridge;

  private compilePreviewService?: LightExtensionCompilePreviewService;

  private contextPackService?: LightExtensionContextPackService;

  private readonly referenceOwnerContextResolvers = new ReferenceOwnerAuthoringContextResolverRegistry();

  private runtimeResolveService?: RuntimeResolveService;

  private runtimeCompileService?: LightExtensionRuntimeCompileService;

  private compileWorkerPool?: LightExtensionCompileWorkerPool;

  private entryService?: LightExtensionEntryService;

  private referenceService?: ReferenceService;

  private previewProblemService?: LightExtensionPreviewProblemService;

  private moveSourceService?: MoveSourceService;

  private moveToInlineService?: MoveToInlineService;

  private clientAppService?: ClientAppService;

  private unregisterVscPermissionHook?: () => void;

  private remotePullRecoveryListener?: () => Promise<void>;

  private remotePullRecoveryPromise?: Promise<void>;

  private compileShutdownListener?: () => Promise<void>;

  async resolveClientApp(entryId: string): Promise<ClientAppDescriptor> {
    return this.requireClientAppService().resolveClientApp(entryId);
  }

  async serveClientAppAsset(input: ClientAppStaticRequest): Promise<ClientAppStaticResponse> {
    return this.requireClientAppService().serveClientAppAsset(input);
  }

  async listSelectableClientApps(): Promise<ClientAppSummary[]> {
    return this.requireClientAppService().listSelectableClientApps();
  }

  registerClientAppReferenceResolver(resolver: ClientAppReferenceResolver): () => void {
    return this.requireClientAppService().useReferenceResolver(resolver);
  }

  registerPermissionHook(hook: VscPermissionHook): () => void {
    return this.requireVscFileServerModule().registerPermissionHook(hook);
  }

  getPermissionHookRegistry(): VscPermissionHookRegistry {
    return this.requireVscFileServerModule().getPermissionHookRegistry();
  }

  registerRunJSSourceAdapter(adapter: RunJSSourceAdapter): () => void {
    return this.requireVscFileServerModule().registerRunJSSourceAdapter(adapter);
  }

  getRunJSSourceAdapterRegistry(): RunJSSourceAdapterRegistry {
    return this.requireVscFileServerModule().getRunJSSourceAdapterRegistry();
  }

  registerRunJSSourceAuthoringInspector(inspector: RunJSSourceAuthoringInspector): () => void {
    return this.requireVscFileServerModule().registerRunJSSourceAuthoringInspector(inspector);
  }

  registerLightExtensionReferenceOwnerContextResolver(
    resolver: LightExtensionOwnerAuthoringContextResolver,
  ): () => void {
    return this.referenceOwnerContextResolvers.register(resolver);
  }

  getRemoteSyncRuntime(): RemoteSyncRuntime {
    return this.requireVscFileServerModule().getRemoteSyncRuntime();
  }

  async syncFlowModelReferencesForNodeTree(
    input: { rootUid: string; action?: string },
    ctx: Parameters<ReferenceService['syncFlowModelReferencesForNodeTree']>[1] = {},
  ) {
    return this.referenceService?.syncFlowModelReferencesForNodeTree(input, ctx);
  }

  async markFlowModelReferencesOwnerMissingForNodeTree(
    input: { rootUid: string; action?: string },
    ctx: Parameters<ReferenceService['markFlowModelReferencesOwnerMissingForNodeTree']>[1] = {},
  ) {
    return this.referenceService?.markFlowModelReferencesOwnerMissingForNodeTree(input, ctx);
  }

  async beforeLoad() {
    const db = this.db;
    if (!db) {
      return;
    }

    await this.requireVscFileServerModule().beforeLoad();

    if (this.options.packageName || db.hasCollection('lightExtensionRepos')) {
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

    this.unregisterVscPermissionHookWhenNeeded();
    const vscFileServerModule = this.requireVscFileServerModule();
    await vscFileServerModule.load();

    this.auditService = new LightExtensionAuditService(db);
    this.permissionService = new LightExtensionPermissionService(this.auditService);
    this.validator = new LightExtensionValidator();
    this.workspaceCompilerBridge = new LightExtensionWorkspaceCompilerBridge(this.auditService, this.permissionService);
    const app = this.app as unknown as AppWithPluginEvents;
    const sharedVscPermissionHooks = vscFileServerModule.getPermissionHookRegistry();
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
    this.entryService = new LightExtensionEntryService(db, this.fileService, this.repoService, this.validator);
    this.clientAppService = new ClientAppService(db, new JsPortalStorage());
    this.repoService.useClientAppService(this.clientAppService);
    this.compileWorkerPool = new LightExtensionCompileWorkerPool();
    this.compilePreviewService = new LightExtensionCompilePreviewService(
      db,
      this.auditService,
      this.fileService,
      this.permissionService,
      this.workspaceCompilerBridge,
      this.validator,
      this.compileWorkerPool,
    );
    this.referenceService = new ReferenceService(db, this.auditService, this.permissionService);
    if (app.cacheManager?.createCache && app.lockManager) {
      const previewProblemCache = await app.cacheManager.createCache({
        name: 'light-extension-preview-problems',
        prefix: 'light-extension:preview-problems',
      });
      this.previewProblemService = new LightExtensionPreviewProblemService(
        typeof (this.app as unknown as { name?: unknown }).name === 'string'
          ? (this.app as unknown as { name: string }).name || 'main'
          : 'main',
        new CacheLightExtensionPreviewProblemStorage(previewProblemCache, app.lockManager),
      );
    }
    this.contextPackService = new LightExtensionContextPackService(
      db,
      this.referenceService,
      this.referenceOwnerContextResolvers,
      {
        getCollection: (dataSourceKey, collectionName) => {
          const dataSource = (this.app as unknown as AppWithPluginEvents).dataSourceManager?.get?.(dataSourceKey);
          const collection = dataSource?.collectionManager?.getCollection?.(collectionName);
          return collection && typeof collection === 'object'
            ? (collection as LightExtensionContextCollectionLike)
            : null;
        },
        getPermission: async (dataSourceKey, collectionName, action, ctx) => {
          const dataSource = (this.app as unknown as AppWithPluginEvents).dataSourceManager?.get?.(dataSourceKey);
          const roles = getLightExtensionContextRoleNames(ctx.state);
          if (roles.length && dataSource?.acl?.can) {
            return dataSource.acl.can({ roles, resource: collectionName, action });
          }
          if (dataSourceKey === 'main' && ctx.can) {
            return ctx.can({ resource: collectionName, action });
          }
          return false;
        },
      },
    );
    const apiBasePath = (this.app as unknown as AppWithPluginEvents).resourceManager?.options?.prefix;
    this.runtimeResolveService = new RuntimeResolveService(db, typeof apiBasePath === 'string' ? { apiBasePath } : {});
    this.runtimeCompileService = new LightExtensionRuntimeCompileService(
      db,
      this.fileService,
      this.entryService,
      this.workspaceCompilerBridge,
      {
        compileExecutor: this.compileWorkerPool,
      },
    );
    this.repoService.useReferenceService(this.referenceService);
    this.repoService.useRemoteSyncLifecycleGate({
      assertRepositoryIdle: (repoId, transaction) =>
        vscFileServerModule.getRemoteSyncRuntime().assertRepositoryIdle(repoId, transaction),
    });
    this.runtimeCompileService.useReferenceService(this.referenceService);
    this.moveSourceService = new MoveSourceService(
      db,
      this.repoService,
      this.fileService,
      this.entryService,
      this.runtimeCompileService,
      this.referenceService,
      () => vscFileServerModule.getRunJSSourceAdapterRegistry(),
    );
    this.moveToInlineService = new MoveToInlineService(
      db,
      this.entryService,
      this.workspaceCompilerBridge,
      this.referenceService,
      () => new VscFileService(db, vscFileServerModule.getPermissionHookRegistry()),
      () => vscFileServerModule.getRunJSSourceAdapterRegistry(),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionsResource(this.compilePreviewService, this.moveSourceService, this.moveToInlineService),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionRuntimeResource(this.runtimeResolveService),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionReferencesResource(this.referenceService),
    );
    if (this.previewProblemService) {
      (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
        createLightExtensionPreviewProblemsResource(this.previewProblemService),
      );
    }
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionContextsResource(this.contextPackService),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionReposResource(db, this.repoService, this.runtimeCompileService),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionFilesResource(this.fileService, this.runtimeCompileService),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionEntriesResource(this.entryService, this.runtimeResolveService),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionCapabilitiesResource(this.validator),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionSyncResource({
        db,
        auditService: this.auditService,
        permissionService: this.permissionService,
        repoService: this.repoService,
        runtimeCompileService: this.runtimeCompileService,
        getRemoteSyncRuntime: () => vscFileServerModule.getRemoteSyncRuntime(),
      }),
    );
    this.registerCapabilitiesHttpRoute();
    this.registerEntrySchemaHttpRoute();
    this.registerCompilePreviewHttpRoute();
    this.registerRuntimeResolveHttpRoute();
    this.registerRuntimeArtifactHttpRoute();
    this.registerAclActions();
    this.registerVscPermissionHook();
    this.registerRemotePullRecoveryListener();
    this.registerCompileShutdownListener();
  }

  async afterDisable() {
    this.unregisterVscPermissionHookWhenNeeded();
    this.removeRemotePullRecoveryListener();
    await this.vscFileServerModule?.afterDisable();
  }

  async afterEnable() {
    await this.runRemoteRecovery();
  }

  async remove() {
    this.unregisterVscPermissionHookWhenNeeded();
    this.removeRemotePullRecoveryListener();
    await this.vscFileServerModule?.remove();
    await this.shutdownCompileInfrastructure();
  }

  private requireVscFileServerModule(): VscFileServerModule {
    if (!this.vscFileServerModule) {
      const db = this.db;
      if (!db) {
        throw new LightExtensionError('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', 'VSC file server module is unavailable');
      }
      this.vscFileServerModule = new VscFileServerModule(this.app, db);
    }
    return this.vscFileServerModule;
  }

  private requireClientAppService(): ClientAppService {
    if (!this.clientAppService) {
      throw new LightExtensionError('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', 'Client app service is unavailable');
    }
    return this.clientAppService;
  }

  private registerCompileShutdownListener() {
    this.removeCompileShutdownListener();
    const app = this.app as unknown as AppWithPluginEvents;
    if (!app.on) {
      return;
    }
    const listener = async () => {
      await this.shutdownCompileInfrastructure();
    };
    this.compileShutdownListener = listener;
    app.on('beforeStop', listener);
  }

  private removeCompileShutdownListener() {
    if (!this.compileShutdownListener) {
      return;
    }
    const app = this.app as unknown as AppWithPluginEvents;
    if (app.off) {
      app.off('beforeStop', this.compileShutdownListener);
    } else {
      app.removeListener?.('beforeStop', this.compileShutdownListener);
    }
    this.compileShutdownListener = undefined;
  }

  private async shutdownCompileInfrastructure(): Promise<void> {
    this.removeCompileShutdownListener();
    const pool = this.compileWorkerPool;
    this.compileWorkerPool = undefined;
    if (pool) {
      await pool.shutdown();
    }
  }

  private registerAclActions() {
    const app = this.app as unknown as AppWithPluginEvents;
    app.acl?.allow?.('lightExtensionRuntime', [...lightExtensionRuntimeActionNames], 'loggedIn');
    app.acl?.allow?.('lightExtensionPreviewProblems', [...lightExtensionPreviewProblemActionNames], 'loggedIn');
    app.acl?.allow?.('lightExtensionCapabilities', [...lightExtensionCapabilitiesActionNames], 'public');
    this.registerSyncAcl(app);
    app.acl?.registerSnippet?.({
      name: LIGHT_EXTENSION_ACL_SNIPPET,
      actions: [
        ...LIGHT_EXTENSION_ACL_ACTIONS.map((action) => `lightExtension:${action}`),
        ...lightExtensionActionNames.map((action) => `lightExtensions:${action}`),
        ...lightExtensionReferenceActionNames.map((action) => `lightExtensionReferences:${action}`),
        ...lightExtensionContextActionNames.map((action) => `lightExtensionContexts:${action}`),
        ...lightExtensionRepoActionNames.map((action) => `lightExtensionRepos:${action}`),
        ...lightExtensionFileActionNames.map((action) => `lightExtensionFiles:${action}`),
        ...lightExtensionEntryActionNames.map((action) => `lightExtensionEntries:${action}`),
        ...lightExtensionCapabilitiesActionNames.map((action) => `lightExtensionCapabilities:${action}`),
      ],
    });
  }

  private registerSyncAcl(app: AppWithPluginEvents) {
    const permissions = {
      get: ['manageSyncSource', 'pullFromSyncSource', 'pushToSyncSource'],
      configure: ['manageSyncSource'],
      disconnect: ['manageSyncSource'],
      testConnection: ['manageSyncSource'],
      plan: ['manageSyncSource', 'pullFromSyncSource', 'pushToSyncSource'],
      pull: ['pullFromSyncSource'],
      push: ['pushToSyncSource'],
      createFromGit: ['create', 'manageSyncSource', 'pullFromSyncSource'],
    } as const;
    for (const actionName of lightExtensionSyncActionNames) {
      app.acl?.allow?.('lightExtensionSync', actionName, async (ctx) => {
        if (sanitizeUnsafeLightExtensionSyncTransport(ctx as unknown as LightExtensionResourceContext)) {
          return false;
        }
        if (!ctx.can) {
          return false;
        }
        for (const action of permissions[actionName]) {
          const permission = await ctx.can({ resource: 'lightExtension', action });
          const allowed = permission !== false && permission !== null && typeof permission !== 'undefined';
          if (actionName === 'createFromGit' && !allowed) {
            return false;
          }
          if (actionName !== 'createFromGit' && allowed) {
            return true;
          }
        }
        return actionName === 'createFromGit';
      });
    }
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

  private registerRuntimeArtifactHttpRoute() {
    const app = this.app as unknown as AppWithPluginEvents;
    app.use?.(
      async (ctx, next) => {
        const artifactHash = getDocumentedRuntimeArtifactHash(ctx.path, app.resourceManager?.options?.prefix);
        if (ctx.method !== 'GET' || !artifactHash) {
          await next();
          return;
        }

        const resourcePath = getRuntimeArtifactResourcePath(artifactHash, app.resourceManager?.options?.prefix);
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
        tag: 'light-extension-runtime-artifact',
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

  private registerEntrySchemaHttpRoute() {
    const app = this.app as unknown as AppWithPluginEvents;
    app.use?.(
      async (ctx, next) => {
        if (ctx.method !== 'GET' || ctx.path !== getEntrySchemaPath(app.resourceManager?.options?.prefix)) {
          await next();
          return;
        }

        const schemaHash = this.validator?.getCapabilities().sdk.entrySchemaSha256;
        if (!schemaHash) {
          ctx.status = 503;
          return;
        }
        const etag = `"${schemaHash}"`;
        ctx.set?.('ETag', etag);
        ctx.set?.('Cache-Control', 'public, max-age=300');
        if (ctx.request?.headers?.['if-none-match'] === etag) {
          ctx.status = 304;
          return;
        }
        ctx.status = 200;
        ctx.type = 'application/schema+json';
        ctx.body = lightExtensionEntryV1SchemaFileContent;
      },
      {
        tag: 'light-extension-entry-schema',
        before: 'auth',
      },
    );
  }

  private registerVscPermissionHook() {
    if (!this.permissionService) {
      return;
    }

    const vscFileServerModule = this.requireVscFileServerModule();
    const permissionHooks = vscFileServerModule.getPermissionHookRegistry();
    this.unregisterVscPermissionHook = vscFileServerModule.registerPermissionHook(
      this.permissionService.createVscPermissionHook(),
    );
    this.repoService?.useVscPermissionHookRegistry(permissionHooks);
    this.fileService?.useVscPermissionHookRegistry(permissionHooks);
  }

  private unregisterVscPermissionHookWhenNeeded() {
    this.unregisterVscPermissionHook?.();
    this.unregisterVscPermissionHook = undefined;
  }

  private registerRemotePullRecoveryListener() {
    this.removeRemotePullRecoveryListener();
    const app = this.app as unknown as AppWithPluginEvents;
    if (!app.on) {
      return;
    }
    const listener = async () => {
      await this.runRemoteRecovery();
    };
    this.remotePullRecoveryListener = listener;
    app.on('afterStart', listener);
  }

  private removeRemotePullRecoveryListener() {
    if (!this.remotePullRecoveryListener) {
      return;
    }
    const app = this.app as unknown as AppWithPluginEvents;
    if (app.off) {
      app.off('afterStart', this.remotePullRecoveryListener);
    } else {
      app.removeListener?.('afterStart', this.remotePullRecoveryListener);
    }
    this.remotePullRecoveryListener = undefined;
  }

  private async recoverPullJobs(): Promise<void> {
    if (!this.repoService || !this.permissionService || !this.runtimeCompileService || !this.auditService) {
      return;
    }
    const vscFileServerModule = this.vscFileServerModule;
    if (!vscFileServerModule) {
      return;
    }
    const runtime = vscFileServerModule.getRemoteSyncRuntime();
    const jobs = await runtime.getPullCoordinator().listRecoverablePullJobs();
    const pullService = new LightExtensionRemotePullService(
      this.permissionService,
      this.repoService,
      this.runtimeCompileService,
      runtime.getPullCoordinator(),
    );
    for (const job of jobs) {
      let repoId: string | null = null;
      try {
        if (!job.planFingerprint) {
          continue;
        }
        const remote = await runtime.getRemoteById(job.remoteId);
        const repoRecord = await this.db.getRepository('lightExtensionRepos').findOne({
          filter: { vscRepoId: remote.repoId },
        });
        if (!repoRecord) {
          continue;
        }
        repoId = String(repoRecord.get('id'));
        await pullService.pull(
          {
            repoId,
            remoteId: remote.id,
            expectedLocalCommitId: job.expectedLocalCommitId,
            expectedRemoteRevision: job.expectedRemoteRevision,
            expectedRemoteTargetVersion: job.remoteTargetVersion,
            planFingerprint: job.planFingerprint,
            idempotencyKey: job.idempotencyKey,
          },
          {
            requestId: `recover:${job.id}`,
            requestSource: 'light-extension-pull-recovery',
          },
        );
      } catch (error) {
        if (!repoId) {
          continue;
        }
        try {
          await this.auditService.recordSyncEvent({
            repoId,
            action: 'syncPull',
            result: 'blocked',
            requestId: `recover:${job.id}`,
            reasonCode: error instanceof Error ? error.name : 'pull-recovery-failed',
            message: 'syncPull recovery failed',
          });
        } catch {
          // Pull recovery and its durable job state must not depend on light-extension audit persistence.
        }
      }
    }
  }

  private async runRemotePullRecovery(): Promise<void> {
    if (this.remotePullRecoveryPromise) {
      return this.remotePullRecoveryPromise;
    }
    const recovery = this.recoverPullJobs();
    this.remotePullRecoveryPromise = recovery;
    try {
      await recovery;
    } finally {
      if (this.remotePullRecoveryPromise === recovery) {
        this.remotePullRecoveryPromise = undefined;
      }
    }
  }

  private async runRemoteRecovery(): Promise<void> {
    await this.vscFileServerModule?.afterEnable();
    await this.runRemotePullRecovery();
  }
}

function getDocumentedCapabilitiesPath(resourcePrefix?: string): string {
  return `${normalizeBasePath(resourcePrefix ?? process.env.API_BASE_PATH ?? '/api')}${DOCUMENTED_CAPABILITIES_ROUTE}`;
}

function getEntrySchemaPath(resourcePrefix?: string): string {
  return `${normalizeBasePath(
    resourcePrefix ?? process.env.API_BASE_PATH ?? '/api',
  )}${LIGHT_EXTENSION_ENTRY_SCHEMA_LOCAL_PATH}`;
}

function getDocumentedRuntimeResolvePath(resourcePrefix?: string): string {
  return `${normalizeBasePath(
    resourcePrefix ?? process.env.API_BASE_PATH ?? '/api',
  )}${DOCUMENTED_RUNTIME_RESOLVE_ROUTE}`;
}

function getDocumentedRuntimeArtifactHash(path: string, resourcePrefix?: string): string | null {
  const basePath = normalizeBasePath(resourcePrefix ?? process.env.API_BASE_PATH ?? '/api');
  if (!path.startsWith(`${basePath}/`)) {
    return null;
  }
  const match = DOCUMENTED_RUNTIME_ARTIFACT_ROUTE.exec(path.slice(basePath.length));
  if (!match?.[1]) {
    return null;
  }
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
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

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function getCapabilitiesResourcePath(resourcePrefix?: string): string {
  return `${normalizeBasePath(resourcePrefix ?? '')}/lightExtensionCapabilities:get`;
}

function getCompilePreviewResourcePath(repoId: string, resourcePrefix?: string): string {
  return `${normalizeBasePath(resourcePrefix ?? '')}/lightExtensions:compilePreview/${encodeURIComponent(repoId)}`;
}

function getRuntimeResolveResourcePath(resourcePrefix?: string): string {
  return `${normalizeBasePath(resourcePrefix ?? '')}/lightExtensionRuntime:resolve`;
}

function getRuntimeArtifactResourcePath(artifactHash: string, resourcePrefix?: string): string {
  return `${normalizeBasePath(resourcePrefix ?? '')}/lightExtensionRuntime:getArtifact/${encodeURIComponent(
    artifactHash,
  )}`;
}

function normalizeBasePath(path: string): string {
  const normalized = `/${path.trim().replace(/^\/+|\/+$/g, '')}`;
  return normalized === '/' ? '' : normalized;
}

function getLightExtensionContextRoleNames(state?: Record<string, unknown>): string[] {
  if (Array.isArray(state?.currentRoles)) {
    return state.currentRoles.map((role) => (typeof role === 'string' ? role.trim() : '')).filter(Boolean);
  }
  const currentRole = typeof state?.currentRole === 'string' ? state.currentRole.trim() : '';
  return currentRole ? [currentRole] : [];
}

export default PluginLightExtensionServer;
