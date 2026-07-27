/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type { Application } from '@nocobase/server';
import { runJSSourceCodeInspectorRegistry } from '@nocobase/server';
import { resolve } from 'node:path';

import { createRunJSSourceAuditActions, createVscFileAuditActions } from './audit';
import type { VscPermissionHook } from './permissions';
import { createRunJSSourcePermissionHook, VscPermissionHookRegistry } from './permissions';
import { createVscFileResource, vscFileActionNames } from './resources/vscFile';
import {
  createRunJSSourcesResource,
  inspectRunJSSourceCode,
  RunJSSourceAdapterRegistry,
  RunJSSourceAuthoringInspectorRegistry,
  runJSSourceActionNames,
} from './runjs-sources';
import type { RunJSSourceAdapter, RunJSSourceAuthoringInspector } from '../shared/runjs-source-types';

const RUNJS_WORKSPACE_SERVER_MODULE = Symbol.for('@nocobase/runjs-workspace/server-module');

type RunJSWorkspaceApplication = Application & {
  [RUNJS_WORKSPACE_SERVER_MODULE]?: RunJSWorkspaceServerModule;
};

export class RunJSWorkspaceServerModule {
  private unregisterSourceCodeInspector?: () => void;

  private readonly permissionHooks = createPermissionHookRegistry();

  private readonly runJSSourceAdapters = new RunJSSourceAdapterRegistry();

  private readonly runJSSourceAuthoringInspectors = new RunJSSourceAuthoringInspectorRegistry();

  private loaded = false;

  constructor(
    private readonly app: Application,
    private readonly db: Database,
  ) {}

  isBoundTo(db: Database): boolean {
    return this.db === db;
  }

  detach(): void {
    this.loaded = false;
    this.unregisterSourceCodeInspector?.();
    this.unregisterSourceCodeInspector = undefined;
  }

  registerPermissionHook(hook: VscPermissionHook): () => void {
    return this.permissionHooks.register(hook);
  }

  getPermissionHookRegistry(): VscPermissionHookRegistry {
    return this.permissionHooks;
  }

  registerRunJSSourceAdapter(adapter: RunJSSourceAdapter): () => void {
    return this.runJSSourceAdapters.register(adapter);
  }

  getRunJSSourceAdapterRegistry(): RunJSSourceAdapterRegistry {
    return this.runJSSourceAdapters;
  }

  registerRunJSSourceAuthoringInspector(inspector: RunJSSourceAuthoringInspector): () => void {
    return this.runJSSourceAuthoringInspectors.register(inspector);
  }

  getRunJSSourceAuthoringInspectorRegistry(): RunJSSourceAuthoringInspectorRegistry {
    return this.runJSSourceAuthoringInspectors;
  }

  async beforeLoad(): Promise<void> {
    if (this.db.hasCollection('vscFileRepositories')) {
      return;
    }
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });
  }

  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }
    this.loaded = true;
    this.unregisterSourceCodeInspector = runJSSourceCodeInspectorRegistry.register(inspectRunJSSourceCode);
    this.app.resourceManager.define(createVscFileResource(this.db, this.permissionHooks));
    this.app.resourceManager.define(
      createRunJSSourcesResource(
        this.db,
        this.runJSSourceAdapters,
        this.permissionHooks,
        this.runJSSourceAuthoringInspectors,
      ),
    );
    this.app.acl.allow('vscFile', [...vscFileActionNames], 'allowConfigure');
    this.app.acl.allow('runJSSources', [...runJSSourceActionNames], 'loggedIn');
    this.app.auditManager.registerActions(createVscFileAuditActions(this.db));
    this.app.auditManager.registerActions(createRunJSSourceAuditActions(this.db));
  }

  async afterDisable(): Promise<void> {
    this.loaded = false;
    this.unregisterSourceCodeInspector?.();
    this.unregisterSourceCodeInspector = undefined;
  }

  async remove(): Promise<void> {
    await this.afterDisable();
  }
}

export function getOrCreateRunJSWorkspaceServerModule(app: Application, db: Database): RunJSWorkspaceServerModule {
  const workspaceApp = app as RunJSWorkspaceApplication;
  const current = workspaceApp[RUNJS_WORKSPACE_SERVER_MODULE];
  if (!current || !current.isBoundTo(db)) {
    current?.detach();
    workspaceApp[RUNJS_WORKSPACE_SERVER_MODULE] = new RunJSWorkspaceServerModule(app, db);
  }
  return workspaceApp[RUNJS_WORKSPACE_SERVER_MODULE];
}

export function getRunJSWorkspaceServerModule(app: Application): RunJSWorkspaceServerModule | undefined {
  return (app as RunJSWorkspaceApplication)[RUNJS_WORKSPACE_SERVER_MODULE];
}

function createPermissionHookRegistry(): VscPermissionHookRegistry {
  const registry = new VscPermissionHookRegistry();
  registry.register(createRunJSSourcePermissionHook());
  return registry;
}
