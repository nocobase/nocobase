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

import type {
  ArtifactResolver,
  ResolvedArtifact,
} from '../artifact-resolver.ts';
import type { AppRuntimeRegistry } from '../app-registry.ts';
import type { AppDefinition } from '../app-types.ts';
import { isServiceBackend, type ServiceBackend } from '../service-backend.ts';
import type { AppVolumeManager } from '../deployment/volume-manager.ts';
import { fullErrorMessage } from '../errors.ts';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { readHostRuntime } from './runtime.ts';
import type {
  ApplyDeploymentSetResult,
  HostDeploymentSet,
  HostDeploymentSpec,
  HostDeploymentStatus,
  HostStatus,
} from './types.ts';

/**
 * What a managed Host remembers of an App across its own restarts, in `<appRevisionsDir>/<appId>/.lifecycle.json`:
 * when it was last requested, and whether it is dormant (its expanded release removed) with the definition to
 * register it under until a request prepares it again.
 */
interface LifecycleState {
  readonly formatVersion: 1;
  readonly lastAccessedAt: number | null;
  readonly dormant: boolean;
  readonly checksum?: string;
  readonly definition?: AppDefinition;
}

const LIFECYCLE_STATE_FILE = '.lifecycle.json';

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
  /** The latest spec per App: what a dormant App is prepared again from. */
  private readonly specs = new Map<string, HostDeploymentSpec>();
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
    this.registry.setDormancyHooks({
      hibernate: (definition, lastAccessedAt) =>
        this.hibernate(definition, lastAccessedAt),
      materialize: (definition) => this.materialize(definition),
    });
    this.registry.onLifecycle((event) => {
      if (event.kind !== 'idle-stopped') return;
      void this.writeLifecycleState(event.appId, {
        formatVersion: 1,
        lastAccessedAt: event.lastAccessedAt,
        dormant: false,
      }).catch((error: unknown) =>
        this.diagnostic.warn('Failed to record app lifecycle state', {
          appId: event.appId,
          error,
        }),
      );
    });
  }

  /** Records every App's last access, so a restarted Host keeps counting idle and dormancy time from it. */
  async persistLifecycleState(): Promise<void> {
    await Promise.allSettled(
      [...this.specs.keys()].map(async (appId) => {
        if (this.registry.isDormant(appId)) return;
        await this.writeLifecycleState(appId, {
          formatVersion: 1,
          lastAccessedAt: this.registry.lastAccessedAt(appId),
          dormant: false,
        });
      }),
    );
  }

  private lifecycleStatePath(appId: string): string {
    if (!/^[a-zA-Z0-9_-]+$/.test(appId)) throw new Error('Invalid app ID');
    return path.join(this.deploymentsDir, appId, LIFECYCLE_STATE_FILE);
  }

  private async readLifecycleState(
    appId: string,
  ): Promise<LifecycleState | null> {
    try {
      const value = JSON.parse(
        await readFile(this.lifecycleStatePath(appId), 'utf8'),
      ) as Partial<LifecycleState>;
      return value.formatVersion === 1 ? (value as LifecycleState) : null;
    } catch {
      return null;
    }
  }

  private async writeLifecycleState(
    appId: string,
    state: LifecycleState,
  ): Promise<void> {
    const target = this.lifecycleStatePath(appId);
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
      // An App on an external-service backend has no expanded release, so its directory may not exist yet.
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(temporary, `${JSON.stringify(state)}\n`, {
        mode: 0o600,
      });
      await rename(temporary, target);
    } finally {
      await rm(temporary, { force: true });
    }
  }

  /** Removes a stopped App's expanded release; its definition, configuration and data stay. */
  private async hibernate(
    definition: AppDefinition,
    lastAccessedAt: number,
  ): Promise<void> {
    const spec = this.specs.get(definition.id);
    if (!spec)
      throw new Error(
        `App "${definition.id}" has no deployment to prepare it from later`,
      );
    await this.writeLifecycleState(definition.id, {
      formatVersion: 1,
      lastAccessedAt,
      dormant: true,
      checksum: spec.artifact.checksum.toLowerCase(),
      definition,
    });
    const root = path.join(this.deploymentsDir, definition.id);
    const entries = await readdir(root, { withFileTypes: true }).catch(
      () => [],
    );
    for (const entry of entries) {
      if (!entry.isDirectory() || !/^[a-f0-9]{64}$/.test(entry.name)) continue;
      // Renamed first, so that an interrupted removal never leaves a revision that looks installed.
      const trash = path.join(root, `.${randomUUID()}.dormant`);
      await rename(path.join(root, entry.name), trash);
      await rm(trash, { recursive: true, force: true });
    }
  }

  /** Expands a dormant App's release again, at the same content-addressed path its definition names. */
  private async materialize(definition: AppDefinition): Promise<void> {
    const spec = this.specs.get(definition.id);
    if (!spec)
      throw new Error(`App "${definition.id}" has no deployment to prepare`);
    const artifact = await this.artifactResolver.resolve(spec.artifact);
    if (
      artifact.definition.server?.rootDir !== definition.server?.rootDir ||
      artifact.definition.server?.entrypoint !== definition.server?.entrypoint
    ) {
      await artifact.rollback();
      throw new Error(
        `App "${definition.id}" was prepared from a release that does not match its definition`,
      );
    }
    await artifact.commit();
    await this.writeLifecycleState(definition.id, {
      formatVersion: 1,
      lastAccessedAt: this.registry.lastAccessedAt(definition.id),
      dormant: false,
    });
  }

  /** The definition a deployment registers, with its idle and dormancy policy. */
  private lifecyclePolicy(
    definition: AppDefinition,
    spec: HostDeploymentSpec,
  ): AppDefinition['resourcePolicy'] {
    if (spec.idleStopMs === undefined && spec.dormantAfterMs === undefined)
      return definition.resourcePolicy;
    return {
      ...definition.resourcePolicy,
      ...(spec.idleStopMs !== undefined ? { idleTtlMs: spec.idleStopMs } : {}),
      ...(spec.dormantAfterMs !== undefined
        ? { dormantAfterMs: spec.dormantAfterMs }
        : {}),
    };
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
        () => this.reconcileDeployment(revision, deployment, false, true),
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
        this.specs.set(deployment.appId, running);
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
          const envChanged = !sameEnv(previousDefinition?.env, running.env);
          if (
            previousDefinition &&
            (previousConfigPath !== configPath || envChanged)
          ) {
            await this.registry.updateDefinition(deployment.appId, {
              ...previousDefinition,
              configPath,
              env: running.env ? { ...running.env } : undefined,
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

  /**
   * Removes the App: its runtime, definition and unpacked releases, and with `purgeData` (the default) its data
   * volume too. An App on an external-service backend also loses what that backend ran it on.
   */
  removeDeployment(
    appId: string,
    options: { readonly purgeData?: boolean } = {},
  ): Promise<HostStatus> {
    return this.enqueue(async () => {
      if (!/^[a-zA-Z0-9_-]+$/.test(appId)) throw new Error('Invalid app ID');
      const purgeData = options.purgeData !== false;
      const revision = this.nextRevision();
      const status = [...this.statuses.values()].find(
        (candidate) => candidate.appId === appId,
      );
      const definition = this.registry.definition(appId);
      await this.registry.unregister(appId, {
        reason: status
          ? `deployment ${status.id} removed`
          : `app ${appId} removed`,
      });
      if (definition) await this.disposeService(definition, purgeData);
      if (status) this.statuses.delete(status.id);
      this.specs.delete(appId);
      await rm(path.join(this.deploymentsDir, appId), {
        recursive: true,
        force: true,
      });
      if (purgeData)
        await rm(path.join(this.volumes.volumesDir, appId), {
          recursive: true,
          force: true,
        });
      this.reconciledRevision = revision;
      return this.getStatus();
    });
  }

  /**
   * Converges one scope: removes `remove` (their data stays) and reconciles `deployments`, leaving every other App of
   * the Host alone. The scope's revision is its caller's business; the Host-wide revision moves on.
   */
  reconcileScope(options: {
    readonly deployments: readonly HostDeploymentSpec[];
    readonly remove: readonly string[];
    readonly restoring: boolean;
  }): Promise<HostStatus> {
    return this.enqueue(async () => {
      validateDeploymentSet({
        revision: 1,
        deployments: [...options.deployments],
      });
      for (const spec of options.deployments)
        this.assertDeploymentIdentity(spec);
      const revision = this.nextRevision();
      for (const appId of options.remove) {
        const status = [...this.statuses.values()].find(
          (candidate) => candidate.appId === appId,
        );
        const definition = this.registry.definition(appId);
        await this.registry.unregister(appId, {
          reason: `app ${appId} removed from its scope`,
        });
        if (definition) await this.disposeService(definition, false);
        if (status) this.statuses.delete(status.id);
        this.specs.delete(appId);
      }
      for (const spec of options.deployments) {
        if (!this.statuses.has(spec.id) && spec.desiredState === 'running')
          this.markPending(revision, spec);
        await this.reconcileDeployment(revision, spec, options.restoring);
      }
      this.reconciledRevision = revision;
      return this.getStatus();
    });
  }

  /** The spec an App was last deployed or restored with. */
  specOf(appId: string): HostDeploymentSpec | undefined {
    return this.specs.get(appId);
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
        const spec = this.specs.get(status.appId);
        return {
          ...status,
          scopeId: spec?.scope?.id ?? null,
          operationId: spec?.operationId ?? null,
          version: app?.desiredVersion ?? spec?.artifact.version ?? null,
          artifact: spec?.artifact.checksum ?? null,
          app,
          lifecycle: this.registry.lifecycle(status.appId) ?? null,
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
      counters: (() => {
        const metrics = this.registry.getMetrics();
        return {
          activations: metrics.activations,
          idleStops: metrics.idleEvictions,
          dormancies: metrics.dormancies,
          materializations: metrics.materializations,
        };
      })(),
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
          const definition = this.registry.definition(status.appId);
          await this.registry.unregister(status.appId, {
            reason: `deployment ${id} removed from deployment set`,
          });
          if (definition) await this.disposeService(definition, false);
          this.statuses.delete(id);
          this.specs.delete(status.appId);
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
    deploying: boolean = false,
  ): Promise<void> {
    if (spec.desiredState !== 'stopped' && spec.backend !== 'in-process') {
      await this.reconcileService(revision, spec, restoring, deploying);
      return;
    }
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
      const saved = restoring
        ? await this.readLifecycleState(spec.appId)
        : null;
      let restoredDormant = false;
      let artifact: ResolvedArtifact;
      if (restoring) {
        try {
          artifact = await this.artifactResolver.restore(spec.artifact);
        } catch (error) {
          // A dormant App has no expanded release by design: register it as it was, to be prepared on its next request.
          if (
            !saved?.dormant ||
            !saved.definition ||
            saved.checksum !== spec.artifact.checksum.toLowerCase()
          )
            throw error;
          restoredDormant = true;
          artifact = {
            reference: spec.artifact,
            definition: saved.definition,
            cacheHit: true,
            commit: () => Promise.resolve(),
            rollback: () => Promise.resolve(),
          };
        }
      } else {
        artifact = await this.artifactResolver.resolve(spec.artifact);
        this.registry.markMaterialized(spec.appId);
      }
      this.specs.set(spec.appId, spec);
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
        const wasRegistered = this.registry.has(spec.appId);
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
            env: spec.env ? { ...spec.env } : undefined,
            resourcePolicy: this.lifecyclePolicy(artifact.definition, spec),
          },
          {
            activate:
              !restoredDormant && (spec.activation ?? 'lazy') === 'eager',
            reason: `deployment ${spec.id} revision ${revision}`,
          },
        );
        if (restoredDormant) this.registry.markDormant(spec.appId);
        else if (saved?.dormant)
          await this.writeLifecycleState(spec.appId, {
            ...saved,
            dormant: false,
            definition: undefined,
          }).catch(() => undefined);
        if (saved?.lastAccessedAt) {
          // A restarted Host keeps counting from the persisted access; a live one never moves it back.
          if (wasRegistered)
            this.registry.touch(spec.appId, saved.lastAccessedAt);
          else
            this.registry.restoreLastAccess(spec.appId, saved.lastAccessedAt);
        } else if (!restoring)
          await this.writeLifecycleState(spec.appId, {
            formatVersion: 1,
            lastAccessedAt: this.registry.lastAccessedAt(spec.appId),
            dormant: false,
          }).catch(() => undefined);
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

  /** The external-service backend of a definition or spec, or null for an in-process one. */
  private serviceBackend(
    backend: AppDefinition['backend'],
  ): ServiceBackend | null {
    if (backend === 'in-process') return null;
    const found = this.registry
      .listBackends()
      .find((candidate) => candidate.kind === backend);
    if (!found || !isServiceBackend(found))
      throw new Error(`App backend "${backend}" is not available on this host`);
    return found;
  }

  /** Removes what an external-service backend ran a removed App on; in-process Apps have nothing there. */
  private async disposeService(
    definition: AppDefinition,
    purgeData: boolean,
  ): Promise<void> {
    if (definition.backend === 'in-process') return;
    try {
      await this.serviceBackend(definition.backend)?.dispose(definition, {
        purgeData,
      });
    } catch (error) {
      this.diagnostic.warn('Failed to remove the service of a removed app', {
        appId: definition.id,
        error,
      });
    }
  }

  /**
   * An App on an external-service backend: no release to unpack here, the backend runs it from `backendOptions`. Its
   * file configuration is still written to its volume, which the backend copies into the service. A restored App whose
   * service still runs is adopted at once; one whose service is gone is registered dormant when it may be.
   */
  private async reconcileService(
    revision: number,
    spec: HostDeploymentSpec,
    restoring: boolean,
    deploying: boolean,
  ): Promise<void> {
    this.markPending(revision, spec);
    const previousConfigPath = this.registry.definition(spec.appId)?.configPath;
    let candidateConfigPath: string | undefined;
    try {
      if (!spec.scope?.backend || spec.scope.backend === 'in-process')
        throw new Error(
          `Deployment "${spec.id}" runs on an external-service backend and needs a scope naming it`,
        );
      const backend = this.serviceBackend(spec.backend)!;
      if (backend.name !== spec.scope.backend)
        throw new Error(
          `This Host offers no "${spec.scope.backend}" backend for deployment "${spec.id}"`,
        );
      this.specs.set(spec.appId, spec);
      deploymentLog('preparing', 'Preparing application configuration');
      const configPath = await this.prepareConfig(spec);
      candidateConfigPath = configPath;
      const definition: AppDefinition = {
        id: spec.appId,
        appName: spec.appId,
        deploymentId: spec.operationId,
        ...(spec.logging ? { logging: spec.logging } : {}),
        basePath: spec.basePath ?? `/${spec.appId}`,
        enabled: true,
        backend: spec.backend,
        isolation: spec.backend,
        configVersion: 'v1',
        tier: 'warm',
        desiredVersion: spec.artifact.version,
        ...(configPath ? { configPath } : {}),
        backendOptions: serviceOptions(spec),
        ...(spec.hostname ? { hostname: spec.hostname } : {}),
        ...(spec.env ? { env: { ...spec.env } } : {}),
        resourcePolicy: this.lifecyclePolicy(
          { resourcePolicy: undefined } as AppDefinition,
          spec,
        ),
      };
      const found = restoring ? await backend.inspect(definition) : null;
      if (deploying && backend.beforeDeploy) {
        deploymentLog('preparing', 'Running pre-deployment tasks');
        await backend.beforeDeploy(definition);
      }
      deploymentLog('starting', 'Activating application');
      const result = await this.registry.replaceDefinition(definition, {
        activate:
          found === 'running' ||
          (found !== 'absent' && (spec.activation ?? 'lazy') === 'eager') ||
          (found === 'absent' &&
            !(spec.dormantAfterMs && spec.dormantAfterMs > 0) &&
            (spec.activation ?? 'lazy') === 'eager'),
        reason: `deployment ${spec.id} revision ${revision}`,
      });
      if (found === 'absent' && !result.app && spec.dormantAfterMs)
        this.registry.markDormant(spec.appId);
      if (previousConfigPath && previousConfigPath !== configPath)
        await this.volumes
          .removeConfig(spec.appId, previousConfigPath)
          .catch(() => undefined);
      deploymentLog('switching', 'Application definition accepted', {
        activated: Boolean(result.app),
      });
      this.statuses.set(spec.id, {
        id: spec.id,
        appId: spec.appId,
        desiredState: spec.desiredState,
        observedState: result.app ? 'running' : 'stopped',
        revision,
        cacheHit: null,
        app: result.app,
        error: null,
      });
    } catch (error) {
      deploymentFailure(error);
      if (
        spec.config?.content !== undefined &&
        candidateConfigPath &&
        candidateConfigPath !== previousConfigPath
      )
        await this.volumes
          .removeConfig(spec.appId, candidateConfigPath)
          .catch(() => undefined);
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

function sameEnv(
  a: Readonly<Record<string, string>> | undefined,
  b: Readonly<Record<string, string>> | undefined,
): boolean {
  const left = Object.entries(a ?? {});
  if (left.length !== Object.keys(b ?? {}).length) return false;
  return left.every(([key, value]) => b?.[key] === value);
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
    if (spec.backend !== 'in-process' && spec.backend !== 'external-service') {
      throw new Error(
        `App backend "${String(spec.backend)}" is not supported by this host version`,
      );
    }
    if (
      spec.hostname !== undefined &&
      (typeof spec.hostname !== 'string' ||
        !/^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$/i.test(spec.hostname))
    ) {
      throw new Error(
        `Invalid host name "${String(spec.hostname)}" for deployment "${spec.id}"`,
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
    for (const field of ['idleStopMs', 'dormantAfterMs'] as const) {
      const value = spec[field];
      if (value !== undefined && (!Number.isSafeInteger(value) || value < 0)) {
        throw new Error(
          `Invalid ${field} "${String(value)}" for deployment "${spec.id}"`,
        );
      }
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
    if (spec.env !== undefined) {
      if (
        !spec.env ||
        typeof spec.env !== 'object' ||
        Array.isArray(spec.env) ||
        Object.entries(spec.env).some(
          ([key, value]) =>
            !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || typeof value !== 'string',
        )
      ) {
        // Names only: values may be secrets.
        throw new Error(`Invalid environment for deployment "${spec.id}"`);
      }
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

/**
 * What an external-service backend needs to run a spec, as `AppDefinition.backendOptions`: the scope whose settings and
 * credentials it uses, the App's settings on top of the scope's, the release (its version and images) and how it is
 * reached. No credentials: those stay with the scope.
 */
function serviceOptions(spec: HostDeploymentSpec): Record<string, unknown> {
  return {
    scope: spec.scope?.id ?? null,
    config: { ...spec.scope?.backendConfig, ...spec.backendConfig },
    deploymentId: spec.operationId ?? spec.id,
    release: {
      version: spec.artifact.version,
      checksum: spec.artifact.checksum.toLowerCase(),
    },
    images: spec.images ?? [],
    configFile: spec.config !== undefined,
    routing: spec.hostname ? 'subdomain' : 'path',
  };
}
