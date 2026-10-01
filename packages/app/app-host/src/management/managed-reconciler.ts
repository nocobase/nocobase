import { createDiagnosticLogger, type Logger } from '@nocobase/logging';
import {
  deploymentLog,
  deploymentFailure,
  withDeploymentLog,
  type DeploymentLogListener,
} from '../deployment-log.js';
/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ArtifactResolver } from '../artifact-resolver.ts';
import type { AppRuntimeRegistry } from '../app-registry.ts';
import type { AppVolumeManager } from '../deployment/volume-manager.ts';
import { fullErrorMessage } from '../errors.ts';
import path from 'node:path';
import { rm } from 'node:fs/promises';
import { readHostRuntime } from './runtime.ts';
import type {
  ApplyDeploymentSetResult,
  HostDeploymentSet,
  HostDeploymentSpec,
  HostDeploymentStatus,
  HostStatus,
} from './types.ts';

export interface ManagedReconcilerOptions {
  logger?: Logger;
  registry: AppRuntimeRegistry;
  artifactResolver: ArtifactResolver;
  volumes: AppVolumeManager;
  deploymentsDir: string;
}

export class ManagedReconciler {
  private readonly diagnostic: ReturnType<typeof createDiagnosticLogger>;
  private readonly registry: AppRuntimeRegistry;
  private readonly artifactResolver: ArtifactResolver;
  private readonly volumes: AppVolumeManager;
  private readonly deploymentsDir: string;
  private statuses = new Map<string, HostDeploymentStatus>();
  private desiredRevision = 0;
  private reconciledRevision = 0;
  private lastSetPayload: string | null = null;
  private operationPromise: Promise<unknown> = Promise.resolve({
    accepted: false,
    status: {
      mode: 'managed',
      runtime: readHostRuntime(),
      ready: false,
      desiredRevision: 0,
      reconciledRevision: 0,
      deployments: [],
    },
  });

  constructor(options: ManagedReconcilerOptions) {
    this.diagnostic = createDiagnosticLogger(options.logger);
    this.registry = options.registry;
    this.artifactResolver = options.artifactResolver;
    this.volumes = options.volumes;
    this.deploymentsDir = options.deploymentsDir;
  }

  applyDeploymentSet(
    deploymentSet: HostDeploymentSet,
  ): Promise<ApplyDeploymentSetResult> {
    const current = this.operationPromise
      .catch(() => undefined)
      .then(() => this.applyDeploymentSetUnlocked(deploymentSet));
    this.operationPromise = current;
    return current;
  }

  restoreDeploymentSet(
    deploymentSet: HostDeploymentSet,
  ): Promise<ApplyDeploymentSetResult> {
    const current = this.operationPromise
      .catch(() => undefined)
      .then(() => this.applyDeploymentSetUnlocked(deploymentSet, true));
    this.operationPromise = current;
    return current;
  }

  applyDeployment(
    deployment: HostDeploymentSpec,
    listener?: DeploymentLogListener,
  ): Promise<HostStatus> {
    return this.enqueue(async () => {
      validateDeploymentSet({ revision: 1, deployments: [deployment] });
      this.assertDeploymentIdentity(deployment);
      const revision = this.nextRevision();
      await withDeploymentLog(
        listener,
        deployment.appId,
        deployment.operationId ?? deployment.id,
        () => this.reconcileDeployment(revision, deployment),
      );
      this.reconciledRevision = revision;
      return this.getStatus();
    });
  }

  startDeployment(deployment: HostDeploymentSpec): Promise<HostStatus> {
    return this.enqueue(async () => {
      const running = {
        ...deployment,
        desiredState: 'running' as const,
        activation: 'eager' as const,
      };
      validateDeploymentSet({ revision: 1, deployments: [running] });
      this.assertDeploymentIdentity(running);
      const revision = this.nextRevision();
      if (this.registry.has(deployment.appId)) {
        this.markPending(revision, running);
        const previousDefinition = this.registry.definition(deployment.appId);
        const previousConfigPath = previousDefinition?.configPath;
        let candidateConfigPath: string | undefined;
        let definitionUpdated = false;
        let app;
        try {
          const configPath = await this.prepareConfig(
            running,
            previousConfigPath,
          );
          candidateConfigPath =
            running.config?.content !== undefined ? configPath : undefined;
          if (previousDefinition && previousConfigPath !== configPath) {
            await this.registry.updateDefinition(deployment.appId, {
              ...previousDefinition,
              configPath,
            });
            definitionUpdated = true;
          }
          app = await this.registry.ensureActive(deployment.appId);
          if (previousConfigPath && previousConfigPath !== configPath) {
            await this.volumes
              .removeConfig(deployment.appId, previousConfigPath)
              .catch((error: unknown) => {
                this.diagnostic.warn(
                  'Failed to clean up previous app configuration after start',
                  {
                    appId: deployment.appId,
                    error,
                  },
                );
              });
          }
        } catch (error) {
          if (definitionUpdated && previousDefinition) {
            await this.registry
              .updateDefinition(deployment.appId, previousDefinition)
              .catch((restoreError: unknown) => {
                this.diagnostic.warn(
                  'Failed to restore previous app definition after start failure',
                  {
                    appId: deployment.appId,
                    error: restoreError,
                  },
                );
              });
          }
          if (
            candidateConfigPath &&
            candidateConfigPath !== previousConfigPath
          ) {
            await this.volumes
              .removeConfig(deployment.appId, candidateConfigPath)
              .catch((cleanupError: unknown) => {
                this.diagnostic.warn(
                  'Failed to clean up candidate app configuration after start failure',
                  {
                    appId: deployment.appId,
                    error: cleanupError,
                  },
                );
              });
          }
          const status = this.requireStatus(deployment.appId);
          this.statuses.set(status.id, {
            ...status,
            observedState: 'failed',
            error: fullErrorMessage(error),
          });
          throw error;
        }
        this.statuses.set(deployment.id, {
          id: deployment.id,
          appId: deployment.appId,
          desiredState: 'running',
          observedState: 'running',
          revision,
          cacheHit: this.statuses.get(deployment.id)?.cacheHit ?? null,
          app,
          error: null,
        });
      } else {
        await this.reconcileDeployment(revision, running);
      }
      this.reconciledRevision = revision;
      return this.getStatus();
    });
  }

  private async prepareConfig(
    spec: HostDeploymentSpec,
    previousConfigPath?: string,
  ): Promise<string | undefined> {
    if (spec.config?.content !== undefined) {
      return await this.volumes.writeConfig(
        spec.appId,
        spec.config.revision ?? spec.id,
        spec.config.content,
      );
    }
    return spec.config
      ? (spec.config.path ??
          previousConfigPath ??
          this.volumes.configPath(spec.appId))
      : undefined;
  }

  stopDeployment(appId: string): Promise<HostStatus> {
    return this.enqueue(async () => {
      const status = this.requireStatus(appId);
      const revision = this.nextRevision();
      await this.registry.evict(appId, {
        reason: `deployment ${status.id} stopped`,
      });
      this.statuses.set(status.id, {
        ...status,
        desiredState: 'stopped',
        observedState: 'stopped',
        revision,
        cacheHit: status.cacheHit,
        app: null,
        error: null,
      });
      this.reconciledRevision = revision;
      return this.getStatus();
    });
  }

  removeDeployment(appId: string): Promise<HostStatus> {
    return this.enqueue(async () => {
      if (!/^[a-zA-Z0-9_-]+$/.test(appId)) throw new Error('Invalid app ID');
      const revision = this.nextRevision();
      const status = [...this.statuses.values()].find(
        (candidate) => candidate.appId === appId,
      );
      await this.registry.unregister(appId, {
        reason: status
          ? `deployment ${status.id} removed`
          : `app ${appId} removed`,
      });
      if (status) this.statuses.delete(status.id);
      await rm(path.join(this.deploymentsDir, appId), {
        recursive: true,
        force: true,
      });
      await rm(path.join(this.volumes.volumesDir, appId), {
        recursive: true,
        force: true,
      });
      this.reconciledRevision = revision;
      return this.getStatus();
    });
  }

  publishAppConfig(
    appId: string,
    content: string,
  ): ReturnType<AppRuntimeRegistry['reloadAppConfig']> {
    return this.enqueue(async () => {
      const definition = this.registry.definition(appId);
      if (!definition) {
        throw new Error(
          `App "${appId}" is not registered; configuration was not published`,
        );
      }
      if (!definition.configPath) {
        throw new Error(
          `App "${appId}" has no runtime configuration file; configuration was not published`,
        );
      }
      await this.volumes.publishConfig(appId, definition.configPath, content);
      return this.registry.reloadAppConfig(appId);
    });
  }

  restartApp(appId: string): Promise<HostStatus> {
    return this.enqueue(async () => {
      if (!this.registry.isActive(appId))
        throw new Error(`App "${appId}" is not running`);
      await this.registry.reload(appId, { reason: 'host app restart' });
      return this.getStatus();
    });
  }

  getStatus(): HostStatus {
    const deployments = [...this.statuses.values()]
      .map((status) => {
        const app = this.registry.snapshot(status.appId) ?? null;
        return {
          ...status,
          app,
          observedState:
            status.observedState === 'failed'
              ? 'failed'
              : app
                ? 'running'
                : status.observedState === 'running'
                  ? 'stopped'
                  : status.observedState,
        } satisfies HostDeploymentStatus;
      })
      .sort((a, b) => a.id.localeCompare(b.id));
    return {
      mode: 'managed',
      runtime: readHostRuntime(),
      ready:
        this.reconciledRevision > 0 &&
        deployments.every(
          (deployment) =>
            deployment.observedState !== 'failed' || deployment.app !== null,
        ),
      desiredRevision: this.desiredRevision,
      reconciledRevision: this.reconciledRevision,
      deployments,
    };
  }

  private async applyDeploymentSetUnlocked(
    deploymentSet: HostDeploymentSet,
    restoring: boolean = false,
  ): Promise<ApplyDeploymentSetResult> {
    validateDeploymentSet(deploymentSet);
    for (const spec of deploymentSet.deployments) {
      const previous = this.statuses.get(spec.id);
      if (previous && previous.appId !== spec.appId) {
        throw new Error(
          `Deployment "${spec.id}" cannot change app ID from "${previous.appId}" to "${spec.appId}"`,
        );
      }
    }
    const setPayload = JSON.stringify(deploymentSet);
    if (deploymentSet.revision < this.desiredRevision) {
      return { accepted: false, status: this.getStatus() };
    }

    if (
      deploymentSet.revision === this.desiredRevision &&
      this.lastSetPayload !== setPayload
    ) {
      throw new Error(
        `Deployment set revision ${deploymentSet.revision} cannot be changed`,
      );
    }

    const accepted = deploymentSet.revision > this.desiredRevision;
    if (accepted) {
      this.desiredRevision = deploymentSet.revision;
      this.lastSetPayload = setPayload;
      for (const spec of deploymentSet.deployments) {
        if (!this.statuses.has(spec.id) && spec.desiredState === 'running') {
          this.markPending(deploymentSet.revision, spec);
        }
      }
      const desiredIds = new Set(
        deploymentSet.deployments.map((spec) => spec.id),
      );
      for (const [id, status] of this.statuses) {
        if (!desiredIds.has(id)) {
          await this.registry.unregister(status.appId, {
            reason: `deployment ${id} removed from deployment set`,
          });
          this.statuses.delete(id);
        }
      }
    }

    for (const spec of deploymentSet.deployments) {
      await this.reconcileDeployment(deploymentSet.revision, spec, restoring);
    }
    this.reconciledRevision = deploymentSet.revision;
    return { accepted, status: this.getStatus() };
  }

  private async reconcileDeployment(
    revision: number,
    spec: HostDeploymentSpec,
    restoring: boolean = false,
  ): Promise<void> {
    if (spec.desiredState === 'stopped') {
      await this.registry.evict(spec.appId, {
        reason: `deployment ${spec.id} stopped`,
      });
      this.statuses.set(spec.id, {
        id: spec.id,
        appId: spec.appId,
        desiredState: spec.desiredState,
        observedState: 'stopped',
        revision,
        cacheHit: this.statuses.get(spec.id)?.cacheHit ?? null,
        app: null,
        error: null,
      });
      return;
    }

    this.markPending(revision, spec);
    try {
      if (!this.registry.backendKinds().includes(spec.backend)) {
        throw new Error(
          `App backend "${spec.backend}" is not available on this host`,
        );
      }
      deploymentLog('resolving', 'Resolving release artifact');
      const artifact = restoring
        ? await this.artifactResolver.restore(spec.artifact)
        : await this.artifactResolver.resolve(spec.artifact);
      let result;
      const previousConfigPath = this.registry.definition(
        spec.appId,
      )?.configPath;
      let candidateConfigPath: string | undefined;
      try {
        deploymentLog(
          'preparing',
          'Preparing application configuration and persistent storage',
          { cacheHit: artifact.cacheHit },
        );
        const configPath =
          spec.config?.content !== undefined
            ? await this.volumes.writeConfig(
                spec.appId,
                spec.config.revision ?? spec.id,
                spec.config.content,
              )
            : spec.config
              ? (spec.config.path ?? this.volumes.configPath(spec.appId))
              : undefined;
        const dataDir = await this.volumes.prepareStorageDir(spec.appId);
        candidateConfigPath = configPath;
        deploymentLog('starting', 'Activating application');
        result = await this.registry.replaceDefinition(
          {
            ...artifact.definition,
            deploymentId: spec.operationId,
            logging: spec.logging,
            id: spec.appId,
            appName: spec.appId,
            basePath: spec.basePath ?? artifact.definition.basePath,
            backend: spec.backend,
            isolation: spec.backend,
            dataDir,
            configPath,
          },
          {
            activate: (spec.activation ?? 'lazy') === 'eager',
            reason: `deployment ${spec.id} revision ${revision}`,
          },
        );
        deploymentLog('switching', 'Application definition accepted', {
          activated: Boolean(result.app),
        });
        await artifact.commit();
        if (previousConfigPath && previousConfigPath !== configPath) {
          await this.volumes
            .removeConfig(spec.appId, previousConfigPath)
            .catch((error: unknown) => {
              this.diagnostic.warn(
                'Failed to clean up previous app configuration',
                {
                  appId: spec.appId,
                  error,
                },
              );
            });
        }
      } catch (error) {
        deploymentFailure(error);
        deploymentLog(
          'cleaning',
          'Removing rejected artifact and configuration',
          { err: error },
        );
        await artifact.rollback();
        if (
          spec.config?.content !== undefined &&
          candidateConfigPath &&
          candidateConfigPath !== previousConfigPath
        ) {
          await this.volumes
            .removeConfig(spec.appId, candidateConfigPath)
            .catch((cleanupError: unknown) => {
              this.diagnostic.warn(
                'Failed to clean up candidate app configuration',
                {
                  appId: spec.appId,
                  error: cleanupError,
                },
              );
            });
        }
        throw error;
      }
      this.statuses.set(spec.id, {
        id: spec.id,
        appId: spec.appId,
        desiredState: spec.desiredState,
        observedState: result.app ? 'running' : 'stopped',
        revision,
        cacheHit: artifact.cacheHit,
        app: result.app,
        error: null,
      });
    } catch (error) {
      deploymentFailure(error);
      this.statuses.set(spec.id, {
        id: spec.id,
        appId: spec.appId,
        desiredState: spec.desiredState,
        observedState: 'failed',
        revision,
        cacheHit: null,
        app: this.registry.snapshot(spec.appId) ?? null,
        error: fullErrorMessage(error),
      });
    }
  }

  private markPending(revision: number, spec: HostDeploymentSpec): void {
    this.statuses.set(spec.id, {
      id: spec.id,
      appId: spec.appId,
      desiredState: spec.desiredState,
      observedState: 'pending',
      revision,
      cacheHit: null,
      app: this.registry.snapshot(spec.appId) ?? null,
      error: null,
    });
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const current = this.operationPromise
      .catch(() => undefined)
      .then(operation);
    this.operationPromise = current;
    return current;
  }

  private nextRevision(): number {
    this.desiredRevision += 1;
    return this.desiredRevision;
  }

  private requireStatus(appId: string): HostDeploymentStatus {
    const status = [...this.statuses.values()].find(
      (candidate) => candidate.appId === appId,
    );
    if (!status) throw new Error(`Deployment for app "${appId}" was not found`);
    return status;
  }

  private assertDeploymentIdentity(deployment: HostDeploymentSpec): void {
    const statusById = this.statuses.get(deployment.id);
    if (statusById && statusById.appId !== deployment.appId) {
      throw new Error(
        `Deployment "${deployment.id}" cannot change app ID from "${statusById.appId}" to "${deployment.appId}"`,
      );
    }
    const statusByAppId = [...this.statuses.values()].find(
      (status) => status.appId === deployment.appId,
    );
    if (statusByAppId && statusByAppId.id !== deployment.id) {
      throw new Error(
        `App "${deployment.appId}" is already managed by deployment "${statusByAppId.id}"`,
      );
    }
  }
}

function validateDeploymentSet(deploymentSet: HostDeploymentSet): void {
  if (!deploymentSet || typeof deploymentSet !== 'object') {
    throw new Error('Deployment set must be an object');
  }
  if (
    !Number.isSafeInteger(deploymentSet.revision) ||
    deploymentSet.revision < 1
  ) {
    throw new Error('Deployment set revision must be a positive safe integer');
  }
  if (!Array.isArray(deploymentSet.deployments)) {
    throw new Error('Deployment set deployments must be an array');
  }
  const deploymentIds = new Set<string>();
  const appIds = new Set<string>();
  const basePaths = new Set<string>();
  for (const spec of deploymentSet.deployments) {
    if (!spec || typeof spec !== 'object') {
      throw new Error('Deployment must be an object');
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(spec.id)) {
      throw new Error(`Invalid deployment ID "${spec.id}"`);
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(spec.appId)) {
      throw new Error(`Invalid app ID "${spec.appId}"`);
    }
    if (spec.desiredState !== 'running' && spec.desiredState !== 'stopped') {
      throw new Error(
        `Invalid desired state "${String(spec.desiredState)}" for deployment "${spec.id}"`,
      );
    }
    if (spec.backend !== 'in-process') {
      throw new Error(
        `App backend "${String(spec.backend)}" is not supported by this host version`,
      );
    }
    if (
      spec.activation !== undefined &&
      spec.activation !== 'lazy' &&
      spec.activation !== 'eager'
    ) {
      throw new Error(
        `Invalid activation policy "${String(spec.activation)}" for deployment "${spec.id}"`,
      );
    }
    const restartPolicy = (
      spec as HostDeploymentSpec & { restartPolicy?: unknown }
    ).restartPolicy;
    if (restartPolicy !== undefined) {
      throw new Error(
        `Restart policy is not supported by the in-process backend for deployment "${spec.id}"`,
      );
    }
    if (
      !spec.artifact ||
      typeof spec.artifact !== 'object' ||
      typeof spec.artifact.key !== 'string' ||
      typeof spec.artifact.appId !== 'string' ||
      typeof spec.artifact.version !== 'string' ||
      typeof spec.artifact.checksum !== 'string'
    ) {
      throw new Error(`Invalid artifact reference for deployment "${spec.id}"`);
    }
    if (spec.config !== undefined) {
      if (
        !spec.config ||
        typeof spec.config !== 'object' ||
        spec.config.provider !== 'file' ||
        (spec.config.path !== undefined &&
          (typeof spec.config.path !== 'string' ||
            !path.isAbsolute(spec.config.path)))
      ) {
        throw new Error(`Invalid file config for deployment "${spec.id}"`);
      }
    }
    if (deploymentIds.has(spec.id)) {
      throw new Error(`Duplicate deployment ID "${spec.id}"`);
    }
    if (appIds.has(spec.appId)) {
      throw new Error(`Duplicate app ID "${spec.appId}"`);
    }
    deploymentIds.add(spec.id);
    appIds.add(spec.appId);
    if (spec.artifact.appId !== spec.appId) {
      throw new Error(
        `Deployment "${spec.id}" artifact app ID must match "${spec.appId}"`,
      );
    }
    const basePath = spec.basePath ?? `/${spec.appId}`;
    if (!/^\/[a-zA-Z0-9_-]+$/.test(basePath) || basePath.startsWith('/__')) {
      throw new Error(`Invalid deployment base path "${basePath}"`);
    }
    if (basePaths.has(basePath)) {
      throw new Error(`Duplicate deployment base path "${basePath}"`);
    }
    basePaths.add(basePath);
  }
}
