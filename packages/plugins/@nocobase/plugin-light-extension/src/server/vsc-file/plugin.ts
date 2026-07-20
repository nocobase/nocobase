/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, runJSSourceCodeInspectorRegistry } from '@nocobase/server';
import { resolve } from 'path';

import { createRunJSSourceAuditActions, createVscFileAuditActions } from './audit';
import { createRemoteSyncAuditActions, createRemoteSyncAuditEmitter } from './remotes/audit';
import { RemoteSyncAdapterRegistry } from './remotes/RemoteSyncAdapterRegistry';
import type { RemoteSyncRuntime } from './remotes/RemoteSyncRuntime';
import { RemoteSyncRuntimeService } from './remotes/RemoteSyncRuntimeService';
import { GitHubRemoteAdapter } from './remotes/providers/github';
import { RemoteCredentialResolver } from './remotes/security/RemoteCredentialResolver';
import { createRemoteInternalResources } from './remotes/resource';
import type { VscPermissionHook } from './permissions';
import { createRunJSSourcePermissionHook, VscPermissionHookRegistry } from './permissions';
import { RunJSSourceAuthoringInspectorRegistry } from './runjs-sources/RunJSSourceAuthoringInspectorRegistry';
import { RunJSSourceAdapterRegistry, createRunJSSourcesResource, runJSSourceActionNames } from './runjs-sources';
import { inspectRunJSSourceCode } from './runjs-sources/compiler/source-inspection';
import { createVscFileResource, vscFileActionNames } from './resources/vscFile';
import type { RunJSSourceAdapter, RunJSSourceAuthoringInspector } from '../../shared/vsc-file/runjs-source-types';

export class PluginVscFileServer extends Plugin {
  private unregisterSourceCodeInspector?: () => void;

  private readonly permissionHooks = createPermissionHookRegistry();

  private readonly runJSSourceAdapters = new RunJSSourceAdapterRegistry();

  private readonly runJSSourceAuthoringInspectors = new RunJSSourceAuthoringInspectorRegistry();

  private readonly remoteAdapters = new RemoteSyncAdapterRegistry();

  private remoteSyncRuntime?: RemoteSyncRuntimeService;

  private unregisterGitHubAdapter?: () => void;

  private remoteRecoveryListener?: () => Promise<void>;

  private remoteRecoveryPromise?: Promise<void>;

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

  getRemoteSyncRuntime(): RemoteSyncRuntime {
    if (!this.remoteSyncRuntime) {
      throw new Error('Remote sync runtime is not loaded');
    }
    return this.remoteSyncRuntime;
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
    this.unregisterSourceCodeInspector?.();
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
    for (const resource of createRemoteInternalResources()) {
      this.app.resourceManager.define(resource);
    }
    this.app.acl.allow('vscFile', [...vscFileActionNames], 'allowConfigure');
    this.app.acl.allow('runJSSources', [...runJSSourceActionNames], 'loggedIn');
    this.app.auditManager.registerActions(createVscFileAuditActions(this.db));
    this.app.auditManager.registerActions(createRunJSSourceAuditActions(this.db));
    this.unregisterGitHubAdapter?.();
    const credentialResolver = new RemoteCredentialResolver({
      db: this.db,
      environment: this.app.environment,
    });
    this.unregisterGitHubAdapter = this.remoteAdapters.register(
      new GitHubRemoteAdapter({
        credentialResolver,
      }),
    );
    this.remoteSyncRuntime = new RemoteSyncRuntimeService(this.db, {
      adapterRegistry: this.remoteAdapters,
      credentialResolver,
      permissionHooks: this.permissionHooks,
      audit: createRemoteSyncAuditEmitter(this.app.auditManager),
    });
    this.app.auditManager.registerActions(createRemoteSyncAuditActions());
    this.registerRemoteRecoveryListener();
  }

  async afterEnable() {
    await this.runRemoteRecovery();
  }

  async afterDisable() {
    this.unregisterSourceCodeInspector?.();
    this.unregisterSourceCodeInspector = undefined;
    this.unregisterRemoteRuntime();
  }

  async remove() {
    this.unregisterSourceCodeInspector?.();
    this.unregisterSourceCodeInspector = undefined;
    this.unregisterRemoteRuntime();
  }

  private registerRemoteRecoveryListener() {
    this.removeRemoteRecoveryListener();
    const listener = async () => {
      await this.runRemoteRecovery();
    };
    this.remoteRecoveryListener = listener;
    this.app.on('afterStart', listener);
  }

  private removeRemoteRecoveryListener() {
    if (!this.remoteRecoveryListener) {
      return;
    }
    this.app.off('afterStart', this.remoteRecoveryListener);
    this.remoteRecoveryListener = undefined;
  }

  private unregisterRemoteRuntime() {
    this.removeRemoteRecoveryListener();
    this.unregisterGitHubAdapter?.();
    this.unregisterGitHubAdapter = undefined;
    this.remoteSyncRuntime = undefined;
  }

  private async runRemoteRecovery(): Promise<void> {
    if (this.remoteRecoveryPromise) {
      return this.remoteRecoveryPromise;
    }
    const recovery = this.remoteSyncRuntime?.recoverPushJobs() ?? Promise.resolve();
    this.remoteRecoveryPromise = recovery;
    try {
      await recovery;
    } finally {
      if (this.remoteRecoveryPromise === recovery) {
        this.remoteRecoveryPromise = undefined;
      }
    }
  }
}

function createPermissionHookRegistry(): VscPermissionHookRegistry {
  const registry = new VscPermissionHookRegistry();
  registry.register(createRunJSSourcePermissionHook());
  return registry;
}

export default PluginVscFileServer;
