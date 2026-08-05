/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JS_TEMPLATE_SCHEMA_LOCAL_PATH } from '@nocobase/js-template-sdk/schema';
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
import { JsTemplateRemoteSyncModule } from './vsc-file/plugin';
import { Plugin } from '@nocobase/server';
import { resolve } from 'path';

import { JS_TEMPLATE_ACL_ACTIONS, JS_TEMPLATE_ACL_SNIPPET, JS_TEMPLATE_COLLECTIONS } from '../constants';
import { JsTemplateError } from '../shared/errors';
import { registerJsTemplateDomainAvailabilityGuard } from './domainAvailability';
import { jsTemplateExternalizationCapabilities } from './externalizationCapabilities';
import { jsTemplateV1SchemaFileContent } from './jsTemplateSchema';
import {
  createJsTemplateCapabilitiesResource,
  jsTemplateCapabilitiesActionNames,
} from './resources/jsTemplateCapabilities';
import { createJsTemplatesResource, jsTemplateActionNames } from './resources/jsTemplates';
import { createJsTemplateFilesResource, jsTemplateFileActionNames } from './resources/jsTemplateFiles';
import { createJsTemplateProjectsResource, jsTemplateProjectActionNames } from './resources/jsTemplateProjects';
import { createJsTemplateCreateJobsResource, jsTemplateCreateJobActionNames } from './resources/jsTemplateCreateJobs';
import {
  createJsTemplateSyncResource,
  jsTemplateSyncActionNames,
  sanitizeUnsafeJsTemplateSyncTransport,
} from './resources/jsTemplateSync';
import type { JsTemplateResourceContext } from './resources/resourceAction';
import { createJsTemplateRuntimeResource, jsTemplateRuntimeActionNames } from './resources/jsTemplateRuntime';
import { createJsTemplateUsagesResource, jsTemplateUsageActionNames } from './resources/jsTemplateUsages';
import { JsTemplateAuditService } from './services/JsTemplateAuditService';
import { JsTemplateCompilePreviewService } from './services/JsTemplateCompilePreviewService';
import { JsTemplateCompileWorkerPool } from './services/JsTemplateCompileWorkerPool';
import { JsTemplateCreateFromRemoteService } from './services/JsTemplateCreateFromRemoteService';
import { JsTemplateCreateJobExecutor } from './services/JsTemplateCreateJobExecutor';
import { JsTemplateCreateJobRunner } from './services/JsTemplateCreateJobRunner';
import { JsTemplateCreateJobStore } from './services/JsTemplateCreateJobStore';
import { JsTemplateService } from './services/JsTemplateService';
import { JsTemplateFileService } from './services/JsTemplateFileService';
import { JsTemplatePermissionService } from './services/JsTemplatePermissionService';
import { JsTemplateRemotePullService } from './services/JsTemplateRemotePullService';
import { JsTemplateProjectService } from './services/JsTemplateProjectService';
import { JsTemplateCompileService } from './services/JsTemplateCompileService';
import { JsTemplateValidator } from './services/JsTemplateValidator';
import { JsTemplateWorkspaceCompilerBridge } from './services/JsTemplateWorkspaceCompilerBridge';
import { JsTemplateRuntimeService } from './services/JsTemplateRuntimeService';
import { JsTemplateUsageService } from './services/JsTemplateUsageService';
import { SaveAsJsTemplateService } from './services/SaveAsJsTemplateService';
import { DetachJsTemplateToInlineService } from './services/DetachJsTemplateToInlineService';
import { DeleteJsTemplateService } from './services/DeleteJsTemplateService';

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
    middleware: (ctx: JsTemplateRouteContext, next: () => Promise<void>) => Promise<void>,
    options?: unknown,
  ) => void;
};

type JsTemplateRouteContext = {
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
};

export class PluginJsTemplateServer extends Plugin {
  private runJSWorkspaceServerModule?: RunJSWorkspaceServerModule;

  private remoteSyncModule?: JsTemplateRemoteSyncModule;

  private auditService?: JsTemplateAuditService;

  private permissionService?: JsTemplatePermissionService;

  private projectService?: JsTemplateProjectService;

  private fileService?: JsTemplateFileService;

  private validator?: JsTemplateValidator;

  private workspaceCompilerBridge?: JsTemplateWorkspaceCompilerBridge;

  private compilePreviewService?: JsTemplateCompilePreviewService;

  private runtimeService?: JsTemplateRuntimeService;

  private runtimeCompileService?: JsTemplateCompileService;

  private compileWorkerPool?: JsTemplateCompileWorkerPool;

  private templateService?: JsTemplateService;

  private usageService?: JsTemplateUsageService;

  private saveAsJsTemplateService?: SaveAsJsTemplateService;

  private detachToInlineService?: DetachJsTemplateToInlineService;

  private deleteJsTemplateService?: DeleteJsTemplateService;

  private unregisterVscPermissionHook?: () => void;

  private unregisterExternalizationCapability?: () => void;

  private remotePullRecoveryListener?: () => Promise<void>;

  private remotePullRecoveryPromise?: Promise<void>;

  private compileShutdownListener?: () => Promise<void>;

  private createJobStore?: JsTemplateCreateJobStore;

  private createJobExecutor?: JsTemplateCreateJobExecutor;

  private createJobRunner?: JsTemplateCreateJobRunner;

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

  async syncJsTemplateUsagesForNodeTree(
    input: { rootUid: string; action?: string },
    ctx: Parameters<JsTemplateUsageService['syncFlowModelUsagesForNodeTree']>[1] = {},
  ) {
    return this.usageService?.syncFlowModelUsagesForNodeTree(input, ctx);
  }

  async syncFlowModelUsagesForNodeTree(
    input: { rootUid: string; action?: string },
    ctx: Parameters<JsTemplateUsageService['syncFlowModelUsagesForNodeTree']>[1] = {},
  ) {
    return this.syncJsTemplateUsagesForNodeTree(input, ctx);
  }

  async markJsTemplateUsagesOwnerMissingForNodeTree(
    input: { rootUid: string; action?: string },
    ctx: Parameters<JsTemplateUsageService['markFlowModelUsagesOwnerMissingForNodeTree']>[1] = {},
  ) {
    return this.usageService?.markFlowModelUsagesOwnerMissingForNodeTree(input, ctx);
  }

  async markFlowModelUsagesOwnerMissingForNodeTree(
    input: { rootUid: string; action?: string },
    ctx: Parameters<JsTemplateUsageService['markFlowModelUsagesOwnerMissingForNodeTree']>[1] = {},
  ) {
    return this.markJsTemplateUsagesOwnerMissingForNodeTree(input, ctx);
  }

  async beforeLoad() {
    const db = this.db;
    if (!db) {
      return;
    }

    await this.requireRunJSWorkspaceServerModule().beforeLoad();

    if (this.options.packageName || db.hasCollection(JS_TEMPLATE_COLLECTIONS.projects)) {
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

    this.auditService = new JsTemplateAuditService(db);
    this.permissionService = new JsTemplatePermissionService(this.auditService);
    this.validator = new JsTemplateValidator();
    this.workspaceCompilerBridge = new JsTemplateWorkspaceCompilerBridge();
    const app = this.app as unknown as AppWithPluginEvents;
    const sharedVscPermissionHooks = workspaceModule.getPermissionHookRegistry();
    this.projectService = new JsTemplateProjectService(
      db,
      this.auditService,
      this.permissionService,
      sharedVscPermissionHooks,
      this.validator,
      this.app.name,
    );
    this.fileService = new JsTemplateFileService(
      db,
      this.permissionService,
      this.projectService,
      sharedVscPermissionHooks,
      this.validator,
    );
    this.templateService = new JsTemplateService(db, this.fileService, this.projectService, this.validator);
    this.compilePreviewService = new JsTemplateCompilePreviewService(
      db,
      this.auditService,
      this.fileService,
      this.permissionService,
      this.workspaceCompilerBridge,
      this.validator,
    );
    this.usageService = new JsTemplateUsageService(db, this.auditService, this.permissionService, this.projectService);
    const apiBasePath = (this.app as unknown as AppWithPluginEvents).resourceManager?.options?.prefix;
    this.runtimeService = new JsTemplateRuntimeService(db, typeof apiBasePath === 'string' ? { apiBasePath } : {});
    this.compileWorkerPool = new JsTemplateCompileWorkerPool();
    this.runtimeCompileService = new JsTemplateCompileService(
      db,
      this.fileService,
      this.templateService,
      this.workspaceCompilerBridge,
      {
        auditService: this.auditService,
        compileExecutor: this.compileWorkerPool,
        validator: this.validator,
      },
    );
    this.createJobStore = new JsTemplateCreateJobStore(db);
    const createFromRemoteService = new JsTemplateCreateFromRemoteService(
      db,
      this.auditService,
      this.projectService,
      this.runtimeCompileService,
      () => remoteSyncModule.getRemoteSyncRuntime(),
    );
    this.createJobExecutor = new JsTemplateCreateJobExecutor(
      db,
      this.projectService,
      this.runtimeCompileService,
      createFromRemoteService,
    );
    this.createJobRunner = new JsTemplateCreateJobRunner(
      this.createJobStore,
      this.createJobExecutor,
      {
        applicationName: this.app.name,
        eventQueue: this.app.eventQueue,
        logger: this.app.logger,
      },
      this.auditService,
    );
    this.projectService.useJsTemplateUsageService(this.usageService);
    this.projectService.useRemoteSyncLifecycleGate({
      assertRepositoryIdle: (repoId, transaction) =>
        remoteSyncModule.getRemoteSyncRuntime().assertRepositoryIdle(repoId, transaction),
    });
    this.runtimeCompileService.useJsTemplateUsageService(this.usageService);
    this.saveAsJsTemplateService = new SaveAsJsTemplateService(
      db,
      this.projectService,
      this.fileService,
      this.templateService,
      this.runtimeCompileService,
      this.usageService,
      () => workspaceModule.getRunJSSourceAdapterRegistry(),
      this.app.name,
    );
    this.detachToInlineService = new DetachJsTemplateToInlineService(
      db,
      this.projectService,
      this.templateService,
      this.workspaceCompilerBridge,
      this.usageService,
      () => new VscFileService(db, workspaceModule.getPermissionHookRegistry()),
      () => workspaceModule.getRunJSSourceAdapterRegistry(),
      this.app.name,
    );
    this.deleteJsTemplateService = new DeleteJsTemplateService(
      db,
      this.projectService,
      this.fileService,
      this.templateService,
      this.runtimeCompileService,
      this.usageService,
      this.permissionService,
      this.auditService,
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createJsTemplatesResource(
        this.templateService,
        this.runtimeService,
        this.compilePreviewService,
        this.saveAsJsTemplateService,
        this.detachToInlineService,
        this.deleteJsTemplateService,
      ),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createJsTemplateRuntimeResource(this.runtimeService),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createJsTemplateUsagesResource(this.usageService),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createJsTemplateProjectsResource(
        db,
        this.projectService,
        this.runtimeCompileService,
        this.createJobStore,
        this.createJobRunner,
        this.app.name,
        this.auditService,
      ),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createJsTemplateFilesResource(this.fileService, this.runtimeCompileService),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createJsTemplateCapabilitiesResource(this.validator),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createJsTemplateSyncResource({
        db,
        auditService: this.auditService,
        permissionService: this.permissionService,
        projectService: this.projectService,
        runtimeCompileService: this.runtimeCompileService,
        getRemoteSyncRuntime: () => remoteSyncModule.getRemoteSyncRuntime(),
        createJobStore: this.createJobStore,
        createJobRunner: this.createJobRunner,
        applicationName: this.app.name,
      }),
    );
    (this.app as unknown as AppWithPluginEvents).resourceManager?.define?.(
      createJsTemplateCreateJobsResource({
        store: this.createJobStore,
        permissionService: this.permissionService,
        applicationName: this.app.name,
        auditService: this.auditService,
      }),
    );
    this.registerEntrySchemaHttpRoute();
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
      throw new JsTemplateError('JS_TEMPLATE_RUNTIME_UNAVAILABLE', 'RunJS Workspace server module is unavailable');
    }
    this.runJSWorkspaceServerModule = getOrCreateRunJSWorkspaceServerModule(this.app, db);
    return this.runJSWorkspaceServerModule;
  }

  private requireRemoteSyncModule(): JsTemplateRemoteSyncModule {
    const db = this.db;
    if (!db) {
      throw new JsTemplateError('JS_TEMPLATE_RUNTIME_UNAVAILABLE', 'Remote sync runtime is unavailable');
    }
    if (!this.remoteSyncModule || !this.remoteSyncModule.isBoundTo(db)) {
      this.remoteSyncModule = new JsTemplateRemoteSyncModule(
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
      jsTemplateExternalizationCapabilities,
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
    registerJsTemplateDomainAvailabilityGuard(this.app, () => this.domainAvailable, 'js-template-domain-availability');
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
    if (!this.db?.hasCollection?.(JS_TEMPLATE_COLLECTIONS.createJobs)) {
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
    app.acl?.allow?.('jsTemplateRuntime', [...jsTemplateRuntimeActionNames], 'loggedIn');
    app.acl?.allow?.('jsTemplateCapabilities', [...jsTemplateCapabilitiesActionNames], 'public');
    app.acl?.allow?.('jsTemplateCreateJobs', [...jsTemplateCreateJobActionNames], 'loggedIn');
    this.registerSyncAcl(app);
    app.acl?.registerSnippet?.({
      name: JS_TEMPLATE_ACL_SNIPPET,
      actions: [
        ...JS_TEMPLATE_ACL_ACTIONS.map((action) => `jsTemplate:${action}`),
        ...jsTemplateActionNames.map((action) => `jsTemplates:${action}`),
        ...jsTemplateUsageActionNames.map((action) => `jsTemplateUsages:${action}`),
        ...jsTemplateProjectActionNames.map((action) => `jsTemplateProjects:${action}`),
        ...jsTemplateCreateJobActionNames.map((action) => `jsTemplateCreateJobs:${action}`),
        ...jsTemplateFileActionNames.map((action) => `jsTemplateFiles:${action}`),
        ...jsTemplateCapabilitiesActionNames.map((action) => `jsTemplateCapabilities:${action}`),
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
    for (const actionName of jsTemplateSyncActionNames) {
      app.acl?.allow?.('jsTemplateSync', actionName, async (ctx) => {
        if (sanitizeUnsafeJsTemplateSyncTransport(ctx as unknown as JsTemplateResourceContext)) {
          return false;
        }
        if (!ctx.can) {
          return false;
        }
        for (const action of permissions[actionName]) {
          const permission = await ctx.can({ resource: 'jsTemplate', action });
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

  private registerEntrySchemaHttpRoute() {
    const app = this.app as unknown as AppWithPluginEvents;
    app.use?.(
      async (ctx, next) => {
        if (ctx.method !== 'GET' || ctx.path !== getEntrySchemaPath(app.resourceManager?.options?.prefix)) {
          await next();
          return;
        }

        const schemaHash = this.validator?.getCapabilities().sdk.templateSchemaSha256;
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
        ctx.body = jsTemplateV1SchemaFileContent;
      },
      {
        tag: 'js-template-entry-schema',
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
    this.projectService?.useVscPermissionHookRegistry(permissionHooks);
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
    if (!this.projectService || !this.permissionService || !this.runtimeCompileService || !this.auditService) {
      return;
    }
    const remoteSyncModule = this.remoteSyncModule;
    if (!remoteSyncModule) {
      return;
    }
    const runtime = remoteSyncModule.getRemoteSyncRuntime();
    const jobs = await runtime.getPullCoordinator().listRecoverablePullJobs();
    const pullService = new JsTemplateRemotePullService(
      this.permissionService,
      this.projectService,
      this.runtimeCompileService,
      runtime.getPullCoordinator(),
    );
    for (const job of jobs) {
      let projectId: string | null = null;
      try {
        if (!job.planFingerprint) {
          continue;
        }
        const remote = await runtime.getRemoteById(job.remoteId);
        const projectRecord = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).findOne({
          filter: { vscRepoId: remote.repoId },
        });
        if (!projectRecord) {
          continue;
        }
        projectId = String(projectRecord.get('id'));
        await pullService.pull(
          {
            projectId,
            remoteId: remote.id,
            expectedLocalCommitId: job.expectedLocalCommitId,
            expectedRemoteRevision: job.expectedRemoteRevision,
            expectedRemoteTargetVersion: job.remoteTargetVersion,
            planFingerprint: job.planFingerprint,
            idempotencyKey: job.idempotencyKey,
          },
          {
            requestId: `recover:${job.id}`,
            requestSource: 'js-template-pull-recovery',
          },
        );
      } catch (error) {
        if (!projectId) {
          continue;
        }
        try {
          await this.auditService.recordSyncEvent({
            projectId,
            action: 'syncPull',
            result: 'blocked',
            requestId: `recover:${job.id}`,
            reasonCode: error instanceof Error ? error.name : 'pull-recovery-failed',
            message: 'syncPull recovery failed',
          });
        } catch {
          // Pull recovery and its durable job state must not depend on js-template audit persistence.
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

function getEntrySchemaPath(resourcePrefix?: string): string {
  return `${normalizeBasePath(resourcePrefix ?? process.env.API_BASE_PATH ?? '/api')}${JS_TEMPLATE_SCHEMA_LOCAL_PATH}`;
}

function normalizeBasePath(path: string): string {
  const normalized = `/${path.trim().replace(/^\/+|\/+$/g, '')}`;
  return normalized === '/' ? '' : normalized;
}

export default PluginJsTemplateServer;
