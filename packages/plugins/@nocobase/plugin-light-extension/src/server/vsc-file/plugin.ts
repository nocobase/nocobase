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
import type { VscPermissionHookRegistry } from '@nocobase/runjs-workspace/server';

import { createRemoteSyncAuditActions, createRemoteSyncAuditEmitter } from './remotes/audit';
import { RemoteSyncAdapterRegistry } from './remotes/RemoteSyncAdapterRegistry';
import type { RemoteSyncRuntime } from './remotes/RemoteSyncRuntime';
import { RemoteSyncRuntimeService } from './remotes/RemoteSyncRuntimeService';
import { GitHubGitTransport, GitHubRemoteAdapter } from './remotes/providers/github';
import { createRemoteInternalResources } from './remotes/resource';
import { RemoteCredentialResolver } from './remotes/security/RemoteCredentialResolver';

export class LightExtensionRemoteSyncModule {
  private readonly remoteAdapters = new RemoteSyncAdapterRegistry();

  private remoteSyncRuntime?: RemoteSyncRuntimeService;

  private unregisterGitHubAdapter?: () => void;

  private remoteRecoveryPromise?: Promise<void>;

  constructor(
    private readonly app: Application,
    private readonly db: Database,
    private readonly permissionHooks: VscPermissionHookRegistry,
  ) {}

  isBoundTo(db: Database): boolean {
    return this.db === db;
  }

  getRemoteSyncRuntime(): RemoteSyncRuntime {
    if (!this.remoteSyncRuntime) {
      throw new Error('Remote sync runtime is not loaded');
    }
    return this.remoteSyncRuntime;
  }

  async load(): Promise<void> {
    for (const resource of createRemoteInternalResources()) {
      this.app.resourceManager.define(resource);
    }
    this.unregisterGitHubAdapter?.();
    const credentialResolver = new RemoteCredentialResolver({
      db: this.db,
      environment: this.app.environment,
    });
    this.unregisterGitHubAdapter = this.remoteAdapters.register(
      new GitHubRemoteAdapter({
        credentialResolver,
        gitTransport: new GitHubGitTransport(),
      }),
    );
    this.remoteSyncRuntime = new RemoteSyncRuntimeService(this.db, {
      adapterRegistry: this.remoteAdapters,
      credentialResolver,
      permissionHooks: this.permissionHooks,
      audit: createRemoteSyncAuditEmitter(this.app.auditManager),
    });
    this.app.auditManager.registerActions(createRemoteSyncAuditActions());
  }

  async afterEnable(): Promise<void> {
    await this.runRemoteRecovery();
  }

  async afterDisable(): Promise<void> {
    this.unregisterRemoteRuntime();
  }

  async remove(): Promise<void> {
    this.unregisterRemoteRuntime();
  }

  private unregisterRemoteRuntime(): void {
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

/** @deprecated Import RunJSWorkspaceServerModule from @nocobase/runjs-workspace/server. */
export { RunJSWorkspaceServerModule as VscFileServerModule } from '@nocobase/runjs-workspace/server';

export default LightExtensionRemoteSyncModule;
