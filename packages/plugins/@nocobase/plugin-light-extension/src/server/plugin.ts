/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_ENTRY_SCHEMA_LOCAL_PATH } from '@nocobase/light-extension-sdk/schema';
import {
  getOrCreateRunJSWorkspaceServerModule,
  type RunJSSourceAdapter,
  type RunJSSourceAdapterRegistry,
  type RunJSSourceAuthoringInspector,
  type RunJSWorkspaceServerModule,
  type VscPermissionHook,
  type VscPermissionHookRegistry,
  VscFileService,
} from '@nocobase/runjs-workspace/server';
import type { RemoteSyncRuntime } from './vsc-file/public-api';
import { LightExtensionRemoteSyncModule } from './vsc-file/plugin';
import { Plugin } from '@nocobase/server';
import { resolve } from 'path';

import { LIGHT_EXTENSION_ACL_ACTIONS, LIGHT_EXTENSION_ACL_SNIPPET } from '../constants';
import { LightExtensionError } from '../shared/errors';
import { registerLightExtensionDomainAvailabilityGuard } from './domainAvailability';
import { lightExtensionExternalizationCapabilities } from './externalizationCapabilities';
import { lightExtensionEntryV1SchemaFileContent } from './lightExtensionEntrySchema';
import {
  createLightExtensionCapabilitiesResource,
  lightExtensionCapabilitiesActionNames,
} from './resources/lightExtensionCapabilities';
import { createLightExtensionEntriesResource, lightExtensionEntryActionNames } from './resources/lightExtensionEntries';
import { createLightExtensionFilesResource, lightExtensionFileActionNames } from './resources/lightExtensionFiles';
import { createLightExtensionReposResource, lightExtensionRepoActionNames } from './resources/lightExtensionRepos';
import {
  createLightExtensionCreateJobsResource,
  lightExtensionCreateJobActionNames,
} from './resources/lightExtensionCreateJobs';
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
import { createLightExtensionsResource, lightExtensionActionNames } from './resources/lightExtensions';
import { LightExtensionAuditService } from './services/LightExtensionAuditService';
import { LightExtensionCompilePreviewService } from './services/LightExtensionCompilePreviewService';
import { LightExtensionCompileWorkerPool } from './services/LightExtensionCompileWorkerPool';
import { LightExtensionCreateFromRemoteService } from './services/LightExtensionCreateFromRemoteService';
import { LightExtensionCreateJobExecutor } from './services/LightExtensionCreateJobExecutor';
import { LightExtensionCreateJobRunner } from './services/LightExtensionCreateJobRunner';
import { LightExtensionCreateJobStore } from './services/LightExtensionCreateJobStore';
import { LightExtensionEntryService } from './services/LightExtensionEntryService';
import { LightExtensionFileService } from './services/LightExtensionFileService';
import { LightExtensionPermissionService } from './services/LightExtensionPermissionService';
import { LightExtensionRemotePullService } from './services/LightExtensionRemotePullService';
import { LightExtensionRepoService } from './services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from './services/LightExtensionRuntimeCompileService';
import { LightExtensionValidator } from './services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from './services/LightExtensionWorkspaceCompilerBridge';
import { RuntimeResolveService } from './services/RuntimeResolveService';
import { ReferenceService } from './services/ReferenceService';
import { MoveSourceService } from './services/MoveSourceService';
import { MoveToInlineService } from './services/MoveToInlineService';

type AppWithPluginEvents = {
  log?: unknown;
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
  private runJSWorkspaceServerModule?: RunJSWorkspaceServerModule;

  private remoteSyncModule?: LightExtensionRemoteSyncModule;

  private auditService?: LightExtensionAuditService;

  private permissionService?: LightExtensionPermissionService;

  private repoService?: LightExtensionRepoService;

  private fileService?: LightExtensionFileService;

  private validator?: LightExtensionValidator;

  private workspaceCompilerBridge?: LightExtensionWorkspaceCompilerBridge;

  private compilePreviewService?: LightExtensionCompilePreviewService;

  private runtimeResolveService?: RuntimeResolveService;

  private runtimeCompileService?: LightExtensionRuntimeCompileService;

  private compileWorkerPool?: LightExtensionCompileWorkerPool;

  private entryService?: LightExtensionEntryService;

  private referenceService?: ReferenceService;

  private moveSourceService?: MoveSourceService;

  private moveToInlineService?: MoveToInlineService;

  private unregisterVscPermissionHook?: () => void;

  private unregisterExternalizationCapability?: () => void;

  private remotePullRecoveryListener?: () => Promise<void>;

  private remotePullRecoveryPromise?: Promise<void>;

  private compileShutdownListener?: () => Promise<void>;

  private createJobStore?: LightExtensionCreateJobStore;

  private createJobExecutor?: LightExtensionCreateJobExecutor;

  private createJobRunner?: LightExtensionCreateJobRunner;

  private createJobStartListener?: () => Promise<void>;

  private createJobStopListener?: () => Promise<void>;

  private domainAvailable = false;

  private domainAvailabilityGuardRegistered = false;

  registerPermissionHook(hook: VscPermissionHook): () => void {
    return this.requireRunJSWorkspaceServerModule().registerPermissionHook(hook);
  }

  getPermissionHookRegistry(): VscPermissionHookRegistry {
    return this.requireRunJSWorkspaceServerModule().getPermissionHookRegistry();
  }

  registerRunJSSourceAdapter(adapter: RunJSSourceAdapter): () => void {
    return this.requireRunJSWorkspaceServerModule().registerRunJSSourceAdapter(adapter);
  }

  getRunJSSourceAdapterRegistry(): RunJSSourceAdapterRegistry {
    return this.requireRunJSWorkspaceServerModule().getRunJSSourceAdapterRegistry();
  }

  registerRunJSSourceAuthoringInspector(inspector: RunJSSourceAuthoringInspector): () => void {
    return this.requireRunJSWorkspaceServerModule().registerRunJSSourceAuthoringInspector(inspector);
  }

  getRemoteSyncRuntime(): RemoteSyncRuntime {
    return this.requireRemoteSyncModule().getRemoteSyncRuntime();
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

    await this.requireRunJSWorkspaceServerModule().beforeLoad();

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

    await this.shutdownCreateJobRunner();
    await this.shutdownCompileInfrastructure();
    this.unregisterVscPermissionHookWhenNeeded();
    this.unregisterExternalizationCapabilityWhenNeeded();
    const workspaceModule = this.requireRunJSWorkspaceServerModule();
    await workspaceModule.load();
    this.registerExternalizationCapability(workspaceModule);
    const remoteSyncModule = this.requireRemoteSyncModule();
    await remoteSyncModule.load();
    this.domainAvailable = true;
    this.registerDomainAvailabilityGuard();

    this.auditService = new LightExtensionAuditService(db);
    this.permissionService = new LightExtensionPermissionService(this.auditService);
    this.validator = new LightExtensionValidator();
    this.workspaceCompilerBridge = new LightExtensionWorkspaceCompilerBridge(this.auditService, this.permissionService);
    const app = this.app as unknown as AppWithPluginEvents;
    const sharedVscPermissionHooks = workspaceModule.getPermissionHookRegistry();
    this.repoService = new LightExtensionRepoService(
      db,
      this.auditService,
      this.permissionService,
      sharedVscPermissionHooks,
      this.validator,
      this.app.name,
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
    );
    this.referenceService = new ReferenceService(db, this.auditService, this.permissionService);
    const apiBasePath = (this.app as unknown as AppWithPluginEvents).resourceManager?.options?.prefix;
    this.runtimeResolveService = new RuntimeResolveService(db, typeof apiBasePath === 'string' ? { apiBasePath } : {});
    this.compileWorkerPool = new LightExtensionCompileWorkerPool();
    this.runtimeCompileService = new LightExtensionRuntimeCompileService(
      db,
      this.fileService,
      this.entryService,
      this.workspaceCompilerBridge,
      {
        compileExecutor: this.compileWorkerPool,
        validator: this.validator,
      },
    );
    this.createJobStore = new LightExtensionCreateJobStore(db);
    const createFromRemoteService = new LightExtensionCreateFromRemoteService(
      db,
      this.auditService,
      this.repoService,
      this.runtimeCompileService,
      () => remoteSyncModule.getRemoteSyncRuntime(),
    );
    this.createJobExecutor = new LightExtensionCreateJobExecutor(
      db,
      this.repoService,
      this.runtimeCompileService,
      createFromRemoteService,
    );
    this.createJobRunner = new LightExtensionCreateJobRunner(
      this.createJobStore,
      this.createJobExecutor,
      {
        applicationName: this.app.name,
        eventQueue: this.app.eventQueue,
        logger: this.app.logger,
      },
      this.auditService,
    );
    this.repoService.useReferenceService(this.referenceService);
    this.repoService.useRemoteSyncLifecycleGate({
      assertRepositoryIdle: (repoId, transaction) =>
        remoteSyncModule.getRemoteSyncRuntime().assertRepositoryIdle(repoId, transaction),
    });
    this.runtimeCompileService.useReferenceService(this.referenceService);
    this.moveSourceService = new MoveSourceService(
      db,
      this.repoService,
      this.fileService,
      this.entryService,
      this.runtimeCompileService,
      this.referenceService,
      () => workspaceModule.getRunJSSourceAdapterRegistry(),
      this.app.name,
    );
    this.moveToInlineService = new MoveToInlineService(
      db,
      this.entryService,
      this.workspaceCompilerBridge,
      this.referenceService,
      () => new VscFileService(db, workspaceModule.getPermissionHookRegistry()),
      () => workspaceModule.getRunJSSourceAdapterRegistry(),
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
      createLightExtensionReposResource(
        db,
        this.repoService,
        this.runtimeCompileService,
        this.createJobStore,
        this.createJobRunner,
        this.app.name,
        this.auditService,
      ),
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
        getRemoteSyncRuntime: () => remoteSyncModule.getRemoteSyncRuntime(),
        createJobStore: this.createJobStore,
        createJobRunner: this.createJobRunner,
        applicationName: this.app.name,
      }),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createLightExtensionCreateJobsResource({
        store: this.createJobStore,
        runner: this.createJobRunner,
        permissionService: this.permissionService,
        applicationName: this.app.name,
        auditService: this.auditService,
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
    this.registerCreateJobLifecycleListeners();
    this.registerCompileShutdownListener();
  }

  async afterDisable() {
    await this.shutdownCreateJobRunner();
    this.domainAvailable = false;
    this.unregisterExternalizationCapabilityWhenNeeded();
    await this.shutdownCompileInfrastructure();
    this.unregisterVscPermissionHookWhenNeeded();
    this.removeRemotePullRecoveryListener();
    await this.remoteSyncModule?.afterDisable();
  }

  async afterEnable() {
    this.domainAvailable = true;
    this.registerExternalizationCapability(this.requireRunJSWorkspaceServerModule());
    await this.startCreateJobRunner();
    await this.runRemoteRecovery();
  }

  async remove() {
    await this.shutdownCreateJobRunner();
    this.domainAvailable = false;
    this.unregisterExternalizationCapabilityWhenNeeded();
    this.unregisterVscPermissionHookWhenNeeded();
    this.removeRemotePullRecoveryListener();
    await this.remoteSyncModule?.remove();
    await this.shutdownCompileInfrastructure();
  }

  private requireRunJSWorkspaceServerModule(): RunJSWorkspaceServerModule {
    const db = this.db;
    if (!db) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_RUNTIME_UNAVAILABLE',
        'RunJS Workspace server module is unavailable',
      );
    }
    this.runJSWorkspaceServerModule = getOrCreateRunJSWorkspaceServerModule(this.app, db);
    return this.runJSWorkspaceServerModule;
  }

  private requireRemoteSyncModule(): LightExtensionRemoteSyncModule {
    const db = this.db;
    if (!db) {
      throw new LightExtensionError('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', 'Remote sync runtime is unavailable');
    }
    if (!this.remoteSyncModule || !this.remoteSyncModule.isBoundTo(db)) {
      this.remoteSyncModule = new LightExtensionRemoteSyncModule(
        this.app,
        db,
        this.requireRunJSWorkspaceServerModule().getPermissionHookRegistry(),
      );
    }
    return this.remoteSyncModule;
  }

  private registerExternalizationCapability(workspaceModule: RunJSWorkspaceServerModule) {
    this.unregisterExternalizationCapabilityWhenNeeded();
    this.unregisterExternalizationCapability = workspaceModule.registerRunJSExternalizationCapability(
      lightExtensionExternalizationCapabilities,
    );
  }

  private unregisterExternalizationCapabilityWhenNeeded() {
    this.unregisterExternalizationCapability?.();
    this.unregisterExternalizationCapability = undefined;
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

  private registerDomainAvailabilityGuard() {
    if (this.domainAvailabilityGuardRegistered) {
      return;
    }
    const app = this.app as unknown as AppWithPluginEvents;
    if (!app.use) {
      return;
    }
    registerLightExtensionDomainAvailabilityGuard(
      this.app,
      () => this.domainAvailable,
      'light-extension-domain-availability',
    );
    this.domainAvailabilityGuardRegistered = true;
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

  private registerCreateJobLifecycleListeners() {
    this.removeCreateJobLifecycleListeners();
    const app = this.app as unknown as AppWithPluginEvents;
    if (!app.on) {
      return;
    }
    this.createJobStartListener = async () => {
      await this.startCreateJobRunner();
    };
    this.createJobStopListener = async () => {
      await this.shutdownCreateJobRunner();
    };
    app.on('afterStart', this.createJobStartListener);
    app.on('beforeStop', this.createJobStopListener);
  }

  private removeCreateJobLifecycleListeners() {
    const app = this.app as unknown as AppWithPluginEvents;
    for (const [eventName, listener] of [
      ['afterStart', this.createJobStartListener],
      ['beforeStop', this.createJobStopListener],
    ] as const) {
      if (!listener) {
        continue;
      }
      if (app.off) {
        app.off(eventName, listener);
      } else {
        app.removeListener?.(eventName, listener);
      }
    }
    this.createJobStartListener = undefined;
    this.createJobStopListener = undefined;
  }

  private async startCreateJobRunner(): Promise<void> {
    if (!this.db?.hasCollection?.('lightExtensionCreateJobs')) {
      return;
    }
    await this.createJobRunner?.start();
  }

  private async shutdownCreateJobRunner(): Promise<void> {
    this.removeCreateJobLifecycleListeners();
    const runner = this.createJobRunner;
    this.createJobRunner = undefined;
    this.createJobExecutor = undefined;
    this.createJobStore = undefined;
    if (runner) {
      await runner.stop();
    }
  }

  private registerAclActions() {
    const app = this.app as unknown as AppWithPluginEvents;
    app.acl?.allow?.('lightExtensionRuntime', [...lightExtensionRuntimeActionNames], 'loggedIn');
    app.acl?.allow?.('lightExtensionCapabilities', [...lightExtensionCapabilitiesActionNames], 'public');
    app.acl?.allow?.('lightExtensionCreateJobs', [...lightExtensionCreateJobActionNames], 'loggedIn');
    this.registerSyncAcl(app);
    app.acl?.registerSnippet?.({
      name: LIGHT_EXTENSION_ACL_SNIPPET,
      actions: [
        ...LIGHT_EXTENSION_ACL_ACTIONS.map((action) => `lightExtension:${action}`),
        ...lightExtensionActionNames.map((action) => `lightExtensions:${action}`),
        ...lightExtensionReferenceActionNames.map((action) => `lightExtensionReferences:${action}`),
        ...lightExtensionRepoActionNames.map((action) => `lightExtensionRepos:${action}`),
        ...lightExtensionCreateJobActionNames.map((action) => `lightExtensionCreateJobs:${action}`),
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

    const workspaceModule = this.requireRunJSWorkspaceServerModule();
    const permissionHooks = workspaceModule.getPermissionHookRegistry();
    this.unregisterVscPermissionHook = workspaceModule.registerPermissionHook(
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
    const remoteSyncModule = this.remoteSyncModule;
    if (!remoteSyncModule) {
      return;
    }
    const runtime = remoteSyncModule.getRemoteSyncRuntime();
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
    await this.remoteSyncModule?.afterEnable();
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

export default PluginLightExtensionServer;
