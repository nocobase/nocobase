import type { JournalPage, JournalQuery, Logger } from '@nocobase/logging';
import type { DeploymentLogListener } from './../deployment-log.js';
/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ArtifactResolver } from '../artifact-resolver.ts';
import type { AppConfigReloadResult } from '@nocobase/app-server/config';
import type { AppRuntimeRegistry } from '../app-registry.ts';
import type { DeploymentCatalog } from '../deployment/catalog.ts';
import {
  StandaloneReconciler,
  type StandaloneReconcileResult,
} from '../deployment/standalone-reconciler.ts';
import type { AppHostMode } from '../host-mode.ts';
import { ManagedReconciler } from './managed-reconciler.ts';
import type { OperationLog } from './operation-log.ts';
import { ManagedScopes } from './scopes.ts';
import { readHostRuntime } from './runtime.ts';
import type {
  ApplyDeploymentSetResult,
  HostDeploymentSpec,
  HostDeploymentSet,
  HostDescription,
  HostOperation,
  HostScope,
  HostScopeCheck,
  HostStatus,
  HostStatusQuery,
} from './types.ts';

/**
 * The Host management service: what a control plane (the Hub, release management) calls to run Apps on a Host.
 *
 * A control plane with several environments names one in a set or a deployment (`scope`): the set then replaces only
 * that scope's Apps under the scope's own revision, an App belongs to one scope, a deployment with an operation ID runs
 * at most once and its outcome stays readable through `getOperation`, also after either side restarted, and the scope
 * names the backend its Apps run on (`describeHost` lists them) with that backend's settings and credentials. Without
 * a scope every call behaves as it did before scopes existed.
 */
export interface HostManagementService {
  restoreDeploymentSet(
    deploymentSet: HostDeploymentSet,
  ): Promise<ApplyDeploymentSetResult>;
  reloadAppConfig(appId: string): Promise<AppConfigReloadResult | null>;
  publishAppConfig(
    appId: string,
    content: string,
  ): Promise<AppConfigReloadResult | null>;
  applyDeploymentSet(
    deploymentSet: HostDeploymentSet,
  ): Promise<ApplyDeploymentSetResult>;
  applyDeployment(
    deployment: HostDeploymentSpec,
    listener?: DeploymentLogListener,
  ): Promise<HostStatus>;
  startDeployment(deployment: HostDeploymentSpec): Promise<HostStatus>;
  stopDeployment(appId: string): Promise<HostStatus>;
  /** Removes the App and, unless `purgeData` is false, its data. */
  removeDeployment(
    appId: string,
    options?: { purgeData?: boolean },
  ): Promise<HostStatus>;
  /** The Host's status, or one scope's or some Apps' part of it. */
  getStatus(query?: HostStatusQuery): Promise<HostStatus>;
  restartApp(appId: string): Promise<HostStatus>;
  /**
   * How a deployment with this operation ID ended, from the operation log that outlives the Host process; null when
   * the Host never recorded it. Pass the deployment's scope.
   */
  getOperation(
    operationId: string,
    options?: { scope?: HostScope },
  ): Promise<HostOperation | null>;
  /** The Host's identity and the backends its Apps can run on. */
  describeHost(): Promise<HostDescription>;
  /** Whether a scope's backend settings and credentials work, without changing the scope. */
  checkScope(scope: HostScope): Promise<HostScopeCheck>;
  /** An App's runtime log. */
  readAppLogs(appId: string, query: JournalQuery): Promise<JournalPage>;
}

export interface HostManagerOptions {
  logger?: Logger;
  mode: AppHostMode;
  registry: AppRuntimeRegistry;
  deploymentCatalog: DeploymentCatalog;
  artifactResolver: ArtifactResolver;
  /** Where a managed Host records deployment outcomes; in memory when omitted. */
  operations?: OperationLog;
}

type HostModeState =
  | { mode: 'standalone'; reconciler: StandaloneReconciler }
  | {
      mode: 'managed';
      reconciler: ManagedReconciler;
      scopes: ManagedScopes;
    };

export class HostManager implements HostManagementService {
  publishAppConfig(
    appId: string,
    content: string,
  ): Promise<AppConfigReloadResult | null> {
    if (this.state.mode !== 'managed')
      throw new Error('Configuration publishing requires managed host mode');
    return this.state.reconciler.publishAppConfig(appId, content);
  }
  restoreDeploymentSet(
    deploymentSet: HostDeploymentSet,
  ): Promise<ApplyDeploymentSetResult> {
    if (this.state.mode !== 'managed')
      throw new Error('Deployment restoration requires managed host mode');
    if (deploymentSet?.scope)
      return this.state.scopes.applySet(deploymentSet, true);
    this.state.scopes.assertAccepting();
    return this.state.reconciler.restoreDeploymentSet(deploymentSet);
  }
  reloadAppConfig(
    appId: string,
  ): ReturnType<HostManagementService['reloadAppConfig']> {
    return this.registry.reloadAppConfig(appId);
  }
  private readonly registry: AppRuntimeRegistry;
  private readonly state: HostModeState;

  constructor(options: HostManagerOptions) {
    this.registry = options.registry;
    if (options.mode === 'standalone')
      this.state = {
        mode: 'standalone',
        reconciler: new StandaloneReconciler(
          options.deploymentCatalog,
          options.registry,
        ),
      };
    else {
      const reconciler = new ManagedReconciler({
        logger: options.logger,
        registry: options.registry,
        artifactResolver: options.artifactResolver,
        volumes: options.deploymentCatalog.volumes,
        deploymentsDir: options.deploymentCatalog.deploymentsDir,
      });
      this.state = {
        mode: 'managed',
        reconciler,
        scopes: new ManagedScopes({
          reconciler,
          registry: options.registry,
          appVolumesDir: options.deploymentCatalog.volumes.volumesDir,
          operations: options.operations,
        }),
      };
    }
  }

  initialize(): Promise<StandaloneReconcileResult | null> {
    return this.state.mode === 'standalone'
      ? this.state.reconciler.reconcile()
      : Promise.resolve(null);
  }

  rescan(): Promise<StandaloneReconcileResult> {
    if (this.state.mode !== 'standalone') {
      throw new Error('Deployment directory scanning requires standalone mode');
    }
    return this.state.reconciler.reconcile();
  }

  applyDeploymentSet(
    deploymentSet: HostDeploymentSet,
  ): Promise<ApplyDeploymentSetResult> {
    if (this.state.mode !== 'managed') {
      throw new Error('Deployment sets require managed host mode');
    }
    if (deploymentSet?.scope)
      return this.state.scopes.applySet(deploymentSet, false);
    this.state.scopes.assertAccepting();
    return this.state.reconciler.applyDeploymentSet(deploymentSet);
  }

  applyDeployment(
    deployment: HostDeploymentSpec,
    listener?: DeploymentLogListener,
  ): Promise<HostStatus> {
    if (this.state.mode !== 'managed') {
      throw new Error('Deployments require managed host mode');
    }
    const { reconciler, scopes } = this.state;
    if (deployment?.scope) return scopes.applyDeployment(deployment, listener);
    scopes.assertAccepting();
    return scopes.recordUnscoped(deployment, () =>
      reconciler.applyDeployment(deployment, listener),
    );
  }

  startDeployment(deployment: HostDeploymentSpec): Promise<HostStatus> {
    if (this.state.mode !== 'managed') {
      throw new Error('Deployments require managed host mode');
    }
    const { reconciler, scopes } = this.state;
    scopes.assertAccepting();
    if (deployment?.scope)
      return scopes.startDeployment(deployment, (spec) =>
        reconciler.startDeployment(spec),
      );
    return reconciler.startDeployment(deployment);
  }

  stopDeployment(appId: string): Promise<HostStatus> {
    if (this.state.mode !== 'managed') {
      throw new Error('Deployments require managed host mode');
    }
    this.state.scopes.assertAccepting();
    return this.state.reconciler.stopDeployment(appId);
  }

  async removeDeployment(
    appId: string,
    options: { purgeData?: boolean } = {},
  ): Promise<HostStatus> {
    if (this.state.mode !== 'managed') {
      throw new Error('Deployments require managed host mode');
    }
    this.state.scopes.assertAccepting();
    const status = await this.state.reconciler.removeDeployment(appId, options);
    this.state.scopes.forget(appId);
    return status;
  }

  getOperation(
    operationId: string,
    options: { scope?: HostScope } = {},
  ): Promise<HostOperation | null> {
    if (this.state.mode !== 'managed') return Promise.resolve(null);
    return this.state.scopes.getOperation(operationId, options.scope);
  }

  describeHost(): Promise<HostDescription> {
    if (this.state.mode !== 'managed')
      throw new Error('Host description requires managed host mode');
    return Promise.resolve(this.state.scopes.describe('managed'));
  }

  checkScope(scope: HostScope): Promise<HostScopeCheck> {
    if (this.state.mode !== 'managed')
      throw new Error('Scopes require managed host mode');
    return this.state.scopes.check(scope);
  }

  readAppLogs(appId: string, query: JournalQuery): Promise<JournalPage> {
    if (this.state.mode !== 'managed')
      throw new Error('App logs require managed host mode');
    return this.state.scopes.logs(appId, query ?? {});
  }

  /**
   * Stops taking changes and waits (bounded) for the deployments under way to finish and record their outcome, as a
   * managed Host shuts down. Reads keep working.
   */
  async drain(timeoutMs: number): Promise<void> {
    if (this.state.mode === 'managed') {
      await this.state.scopes.drain(timeoutMs);
      await this.state.scopes.close();
    }
  }

  /** Records what a restarted Host needs to keep counting idle and dormancy time (managed mode). */
  async persistLifecycleState(): Promise<void> {
    if (this.state.mode === 'managed')
      await this.state.reconciler.persistLifecycleState();
  }

  async getStatus(query?: HostStatusQuery): Promise<HostStatus> {
    if (this.state.mode === 'managed') {
      if (query?.scope || query?.appIds) return this.state.scopes.status(query);
      return this.state.reconciler.getStatus();
    }
    return {
      mode: 'standalone',
      runtime: readHostRuntime(),
      ready: true,
      desiredRevision: 0,
      reconciledRevision: 0,
      deployments: [],
    };
  }

  async restartApp(appId: string): Promise<HostStatus> {
    if (this.state.mode === 'managed') {
      this.state.scopes.assertAccepting();
      return this.state.reconciler.restartApp(appId);
    }
    if (!this.registry.isActive(appId)) {
      throw new Error(`App "${appId}" is not running`);
    }
    await this.registry.reload(appId, { reason: 'host app restart' });
    return this.getStatus();
  }
}
