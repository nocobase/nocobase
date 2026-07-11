/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { resolve } from 'path';

import { createRunJSSourceAuditActions, createVscFileAuditActions } from './audit';
import type { VscPermissionHook } from './permissions';
import { createRunJSSourcePermissionHook, VscPermissionHookRegistry } from './permissions';
import { RunJSSourceAuthoringInspectorRegistry } from './runjs-sources/RunJSSourceAuthoringInspectorRegistry';
import { RunJSSourceAdapterRegistry, createRunJSSourcesResource, runJSSourceActionNames } from './runjs-sources';
import { createVscFileResource, vscFileActionNames } from './resources/vscFile';
import type { RunJSSourceAdapter, RunJSSourceAuthoringInspector } from '../shared/runjs-source-types';

export class PluginVscFileServer extends Plugin {
  private readonly permissionHooks = createPermissionHookRegistry();

  private readonly runJSSourceAdapters = new RunJSSourceAdapterRegistry();

  private readonly runJSSourceAuthoringInspectors = new RunJSSourceAuthoringInspectorRegistry();

  registerPermissionHook(hook: VscPermissionHook): () => void {
    return this.permissionHooks.register(hook);
  }

  getPermissionHookRegistry(): VscPermissionHookRegistry {
    return this.permissionHooks;
  }

  registerRunJSSourceAdapter(adapter: RunJSSourceAdapter): () => void {
    return this.runJSSourceAdapters.register(adapter);
  }

  registerRunJSSourceAuthoringInspector(inspector: RunJSSourceAuthoringInspector): () => void {
    return this.runJSSourceAuthoringInspectors.register(inspector);
  }

  async beforeLoad() {
    if (this.options.packageName || this.db.hasCollection('vscFileRepositories')) {
      return;
    }

    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });
  }

  async load() {
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
}

function createPermissionHookRegistry(): VscPermissionHookRegistry {
  const registry = new VscPermissionHookRegistry();
  registry.register(createRunJSSourcePermissionHook());
  return registry;
}

export default PluginVscFileServer;
