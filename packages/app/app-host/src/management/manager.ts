import type { Logger } from '@nocobase/logging';
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
import { readHostRuntime } from './runtime.ts';
import type {
  ApplyDeploymentSetResult,
  HostDeploymentSpec,
  HostDeploymentSet,
  HostStatus,
} from './types.ts';

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
  removeDeployment(appId: string): Promise<HostStatus>;
  getStatus(): Promise<HostStatus>;
  restartApp(appId: string): Promise<HostStatus>;
}

export interface HostManagerOptions {
  logger?: Logger;
  mode: AppHostMode;
  registry: AppRuntimeRegistry;
  deploymentCatalog: DeploymentCatalog;
  artifactResolver: ArtifactResolver;
}

type HostModeState =
  | { mode: 'standalone'; reconciler: StandaloneReconciler }
  | { mode: 'managed'; reconciler: ManagedReconciler };

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
    this.state =
      options.mode === 'standalone'
        ? {
            mode: 'standalone',
            reconciler: new StandaloneReconciler(
              options.deploymentCatalog,
              options.registry,
            ),
          }
        : {
            mode: 'managed',
            reconciler: new ManagedReconciler({
              logger: options.logger,
              registry: options.registry,
              artifactResolver: options.artifactResolver,
              volumes: options.deploymentCatalog.volumes,
              deploymentsDir: options.deploymentCatalog.deploymentsDir,
            }),
          };
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
    return this.state.reconciler.applyDeploymentSet(deploymentSet);
  }

  applyDeployment(
    deployment: HostDeploymentSpec,
    listener?: DeploymentLogListener,
  ): Promise<HostStatus> {
    if (this.state.mode !== 'managed') {
      throw new Error('Deployments require managed host mode');
    }
    return this.state.reconciler.applyDeployment(deployment, listener);
  }

  startDeployment(deployment: HostDeploymentSpec): Promise<HostStatus> {
    if (this.state.mode !== 'managed') {
      throw new Error('Deployments require managed host mode');
    }
    return this.state.reconciler.startDeployment(deployment);
  }

  stopDeployment(appId: string): Promise<HostStatus> {
    if (this.state.mode !== 'managed') {
      throw new Error('Deployments require managed host mode');
    }
    return this.state.reconciler.stopDeployment(appId);
  }

  removeDeployment(appId: string): Promise<HostStatus> {
    if (this.state.mode !== 'managed') {
      throw new Error('Deployments require managed host mode');
    }
    return this.state.reconciler.removeDeployment(appId);
  }

  async getStatus(): Promise<HostStatus> {
    if (this.state.mode === 'managed') {
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
    if (this.state.mode === 'managed')
      return this.state.reconciler.restartApp(appId);
    if (!this.registry.isActive(appId)) {
      throw new Error(`App "${appId}" is not running`);
    }
    await this.registry.reload(appId, { reason: 'host app restart' });
    return this.getStatus();
  }
}
