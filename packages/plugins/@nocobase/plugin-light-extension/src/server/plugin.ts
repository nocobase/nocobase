/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_ENTRY_SCHEMA_LOCAL_PATH } from '@nocobase/light-extension-sdk/schema';
import type { RemoteSyncRuntime, RunJSSourceAdapterRegistry, VscPermissionHook } from '@nocobase/plugin-vsc-file';
import { VscFileService, VscPermissionHookRegistry } from '@nocobase/plugin-vsc-file';
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
import { createLightExtensionFilesResource, lightExtensionFileActionNames } from './resources/lightExtensionFiles';
import { createLightExtensionReposResource, lightExtensionRepoActionNames } from './resources/lightExtensionRepos';
import { createLightExtensionSyncResource, lightExtensionSyncActionNames } from './resources/lightExtensionSync';
import {
  createLightExtensionRuntimeResource,
  lightExtensionRuntimeActionNames,
} from './resources/lightExtensionRuntime';
import {
  createLightExtensionReferencesResource,
  lightExtensionReferenceActionNames,
} from './resources/lightExtensionReferences';
import { createLightExtensionsResource, lightExtensionActionNames } from './resources/lightExtensions';
import { LightExtensionAuditService } from './services/LightExtensionAuditService';
import { LightExtensionCanonicalWorkspaceBuilder } from './services/LightExtensionCanonicalWorkspace';
import { LightExtensionCompilePreviewService } from './services/LightExtensionCompilePreviewService';
import { createLightExtensionCompileMetricsLoggerCollector } from './services/LightExtensionCompileMetrics';
import { LightExtensionEntryService } from './services/LightExtensionEntryService';
import { LightExtensionFileService } from './services/LightExtensionFileService';
import { LightExtensionPermissionService } from './services/LightExtensionPermissionService';
import {
  LIGHT_EXTENSION_PREVIEW_TICKET_CACHE_NAME,
  LIGHT_EXTENSION_PREVIEW_TICKET_CACHE_PREFIX,
  LightExtensionPreviewTicketStore,
  LightExtensionPreviewTicketVerifier,
} from './services/LightExtensionPreviewTicket';
import { LightExtensionRemotePullService } from './services/LightExtensionRemotePullService';
import { LightExtensionRepoService } from './services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from './services/LightExtensionRuntimeCompileService';
import { LightExtensionValidator } from './services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from './services/LightExtensionWorkspaceCompilerBridge';
import { LightExtensionTrustedCompileCacheService } from './services/LightExtensionTrustedCompileCacheService';
import { RuntimeResolveService } from './services/RuntimeResolveService';
import { ReferenceService } from './services/ReferenceService';
import { MoveSourceService } from './services/MoveSourceService';
import { MoveToInlineService } from './services/MoveToInlineService';

type VscPermissionHookRegistrar = {
  registerPermissionHook: (hook: VscPermissionHook) => () => void;
};

type VscPermissionHookRegistryProvider = {
  getPermissionHookRegistry: () => VscPermissionHookRegistry;
};

type RunJSSourceAdapterRegistryProvider = {
  getRunJSSourceAdapterRegistry: () => RunJSSourceAdapterRegistry;
};

type RemoteSyncRuntimeProvider = {
  getRemoteSyncRuntime: () => RemoteSyncRuntime;
};

type PluginManagerLike = {
  get?: (name: string) => unknown;
  getPlugins?: () => Map<unknown, unknown>;
};

type PluginLoadListener = (plugin: unknown, options?: unknown) => void;

type AppWithPluginEvents = {
  log?: unknown;
  pm?: PluginManagerLike;
  cacheManager?: {
    createCache?: (options: { name: string; prefix?: string }) => Promise<{
      set(key: string, value: unknown, ttl?: number): Promise<void>;
      get<T>(key: string): Promise<T | undefined>;
      del(key: string): Promise<void>;
    }>;
  };
  resourceManager?: {
    define?: (resource: unknown) => void;
    options?: {
      prefix?: string;
    };
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
  on?: (eventName: 'afterLoadPlugin' | 'afterStart', listener: PluginLoadListener | (() => Promise<void>)) => unknown;
  off?: (eventName: 'afterLoadPlugin' | 'afterStart', listener: PluginLoadListener | (() => Promise<void>)) => unknown;
  removeListener?: (
    eventName: 'afterLoadPlugin' | 'afterStart',
    listener: PluginLoadListener | (() => Promise<void>),
  ) => unknown;
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

const VSC_FILE_PLUGIN_ALIASES = ['@nocobase/plugin-vsc-file', 'vsc-file', 'plugin-vsc-file'];
const DOCUMENTED_CAPABILITIES_ROUTE = '/light-extensions/capabilities';
const DOCUMENTED_COMPILE_PREVIEW_ROUTE = /^\/light-extensions\/([^/]+)\/compile-preview$/;
const DOCUMENTED_RUNTIME_RESOLVE_ROUTE = '/light-extension-runtime/resolve';
const DOCUMENTED_RUNTIME_ARTIFACT_ROUTE = /^\/light-extension-runtime\/artifacts\/([^/]+)$/;

export class PluginLightExtensionServer extends Plugin {
  private auditService?: LightExtensionAuditService;

  private permissionService?: LightExtensionPermissionService;

  private repoService?: LightExtensionRepoService;

  private fileService?: LightExtensionFileService;

  private validator?: LightExtensionValidator;

  private workspaceCompilerBridge?: LightExtensionWorkspaceCompilerBridge;

  private compilePreviewService?: LightExtensionCompilePreviewService;

  private previewTicketVerifier?: LightExtensionPreviewTicketVerifier;

  private runtimeResolveService?: RuntimeResolveService;

  private runtimeCompileService?: LightExtensionRuntimeCompileService;

  private entryService?: LightExtensionEntryService;

  private referenceService?: ReferenceService;

  private moveSourceService?: MoveSourceService;

  private moveToInlineService?: MoveToInlineService;

  private unregisterVscPermissionHook?: () => void;

  private pendingVscPluginListener?: PluginLoadListener;

  private remotePullRecoveryListener?: () => Promise<void>;

  private remotePullRecoveryPromise?: Promise<void>;

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

  getPreviewTicketVerifier(): LightExtensionPreviewTicketVerifier | undefined {
    return this.previewTicketVerifier;
  }

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

    this.unregisterVscPermissionHookWhenNeeded();

    this.auditService = new LightExtensionAuditService(db);
    this.permissionService = new LightExtensionPermissionService(this.auditService);
    this.validator = new LightExtensionValidator();
    const compileMetricsCollector = (this.app as unknown as AppWithPluginEvents).log
      ? createLightExtensionCompileMetricsLoggerCollector(this.log)
      : undefined;
    this.workspaceCompilerBridge = new LightExtensionWorkspaceCompilerBridge(this.auditService, this.permissionService);
    const app = this.app as unknown as AppWithPluginEvents;
    const trustedCompileCache = new LightExtensionTrustedCompileCacheService(db);
    const previewTicketCache = await app.cacheManager?.createCache?.({
      name: LIGHT_EXTENSION_PREVIEW_TICKET_CACHE_NAME,
      prefix: LIGHT_EXTENSION_PREVIEW_TICKET_CACHE_PREFIX,
    });
    const previewTicketStore = previewTicketCache
      ? new LightExtensionPreviewTicketStore(previewTicketCache)
      : undefined;
    this.previewTicketVerifier = previewTicketStore
      ? new LightExtensionPreviewTicketVerifier(previewTicketStore, trustedCompileCache)
      : undefined;
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
    this.entryService = new LightExtensionEntryService(db, this.fileService, this.repoService, this.validator);
    this.compilePreviewService = new LightExtensionCompilePreviewService(
      db,
      this.auditService,
      this.fileService,
      this.permissionService,
      this.workspaceCompilerBridge,
      this.validator,
      compileMetricsCollector,
      {
        canonicalWorkspaceBuilder: new LightExtensionCanonicalWorkspaceBuilder(db),
        previewTicketStore,
        trustedCompileCache,
      },
    );
    this.referenceService = new ReferenceService(db, this.auditService, this.permissionService);
    const apiBasePath = (this.app as unknown as AppWithPluginEvents).resourceManager?.options?.prefix;
    this.runtimeResolveService = new RuntimeResolveService(db, typeof apiBasePath === 'string' ? { apiBasePath } : {});
    this.runtimeCompileService = new LightExtensionRuntimeCompileService(
      db,
      this.fileService,
      this.entryService,
      this.workspaceCompilerBridge,
      compileMetricsCollector,
    );
    this.repoService.useReferenceService(this.referenceService);
    this.repoService.useRemoteSyncLifecycleGate({
      assertRepositoryIdle: (repoId, transaction) =>
        requireRemoteSyncRuntime((this.app as unknown as AppWithPluginEvents).pm).assertRepositoryIdle(
          repoId,
          transaction,
        ),
    });
    this.runtimeCompileService.useReferenceService(this.referenceService);
    this.moveSourceService = new MoveSourceService(
      db,
      this.repoService,
      this.fileService,
      this.entryService,
      this.runtimeCompileService,
      this.referenceService,
      () => findRunJSSourceAdapterRegistry((this.app as unknown as AppWithPluginEvents).pm),
    );
    this.moveToInlineService = new MoveToInlineService(
      db,
      this.entryService,
      this.workspaceCompilerBridge,
      this.referenceService,
      () => {
        const permissionHooks = findVscPermissionHookRegistry((this.app as unknown as AppWithPluginEvents).pm);
        return permissionHooks ? new VscFileService(db, permissionHooks) : null;
      },
      () => findRunJSSourceAdapterRegistry((this.app as unknown as AppWithPluginEvents).pm),
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
        getRemoteSyncRuntime: () => requireRemoteSyncRuntime((this.app as unknown as AppWithPluginEvents).pm),
      }),
    );
    this.registerCapabilitiesHttpRoute();
    this.registerEntrySchemaHttpRoute();
    this.registerCompilePreviewHttpRoute();
    this.registerRuntimeResolveHttpRoute();
    this.registerRuntimeArtifactHttpRoute();
    this.registerAclActions();
    this.registerVscPermissionHookWhenAvailable();
    this.registerRemotePullRecoveryListener();
  }

  async afterDisable() {
    this.unregisterVscPermissionHookWhenNeeded();
    this.removeRemotePullRecoveryListener();
  }

  async afterEnable() {
    await this.runRemotePullRecovery();
  }

  async remove() {
    this.unregisterVscPermissionHookWhenNeeded();
    this.removeRemotePullRecoveryListener();
  }

  private registerAclActions() {
    const app = this.app as unknown as AppWithPluginEvents;
    app.acl?.allow?.('lightExtensionRuntime', [...lightExtensionRuntimeActionNames], 'loggedIn');
    app.acl?.allow?.('lightExtensionCapabilities', [...lightExtensionCapabilitiesActionNames], 'public');
    this.registerSyncAcl(app);
    app.acl?.registerSnippet?.({
      name: LIGHT_EXTENSION_ACL_SNIPPET,
      actions: [
        ...LIGHT_EXTENSION_ACL_ACTIONS.map((action) => `lightExtension:${action}`),
        ...lightExtensionActionNames.map((action) => `lightExtensions:${action}`),
        ...lightExtensionReferenceActionNames.map((action) => `lightExtensionReferences:${action}`),
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

  private registerRemotePullRecoveryListener() {
    this.removeRemotePullRecoveryListener();
    const app = this.app as unknown as AppWithPluginEvents;
    if (!app.on) {
      return;
    }
    const listener = async () => {
      await this.runRemotePullRecovery();
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
    const runtime = findRemoteSyncRuntime((this.app as unknown as AppWithPluginEvents).pm);
    if (!runtime) {
      return;
    }
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

function findRunJSSourceAdapterRegistry(pm?: PluginManagerLike): RunJSSourceAdapterRegistry | null {
  if (!pm) {
    return null;
  }

  for (const alias of VSC_FILE_PLUGIN_ALIASES) {
    const plugin = pm.get?.(alias);
    if (isRunJSSourceAdapterRegistryProvider(plugin)) {
      return plugin.getRunJSSourceAdapterRegistry();
    }
  }

  const plugins = pm.getPlugins?.();
  if (!plugins) {
    return null;
  }

  for (const plugin of plugins.values()) {
    if (isRunJSSourceAdapterRegistryProvider(plugin)) {
      return plugin.getRunJSSourceAdapterRegistry();
    }
  }

  return null;
}

function findRemoteSyncRuntime(pm?: PluginManagerLike): RemoteSyncRuntime | null {
  if (!pm) {
    return null;
  }

  for (const alias of VSC_FILE_PLUGIN_ALIASES) {
    const plugin = pm.get?.(alias);
    if (isRemoteSyncRuntimeProvider(plugin)) {
      return plugin.getRemoteSyncRuntime();
    }
  }

  const plugins = pm.getPlugins?.();
  if (!plugins) {
    return null;
  }
  for (const plugin of plugins.values()) {
    if (isRemoteSyncRuntimeProvider(plugin)) {
      return plugin.getRemoteSyncRuntime();
    }
  }
  return null;
}

function requireRemoteSyncRuntime(pm?: PluginManagerLike): RemoteSyncRuntime {
  const runtime = findRemoteSyncRuntime(pm);
  if (!runtime) {
    throw new LightExtensionError('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', 'Remote sync runtime is unavailable');
  }
  return runtime;
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

function isRunJSSourceAdapterRegistryProvider(value: unknown): value is RunJSSourceAdapterRegistryProvider {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as { getRunJSSourceAdapterRegistry?: unknown }).getRunJSSourceAdapterRegistry === 'function'
  );
}

function isRemoteSyncRuntimeProvider(value: unknown): value is RemoteSyncRuntimeProvider {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as { getRemoteSyncRuntime?: unknown }).getRemoteSyncRuntime === 'function'
  );
}

export default PluginLightExtensionServer;
