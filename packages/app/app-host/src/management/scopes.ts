/**
 * Scopes on a managed Host: what the management service adds for a control plane with several environments. A scope
 * is one environment. Its sets carry their own revision and replace only its own Apps (an App belongs to one scope),
 * it names the backend its Apps run on with that backend's settings and credentials, and its deployments run at most
 * once per operation ID with their outcome kept in the operation log, which outlives this process.
 *
 * Calls without a scope never reach this class: they behave as they did before scopes existed.
 */
import { randomUUID } from 'node:crypto';
import { realpath } from 'node:fs/promises';
import path from 'node:path';

import { normalizeRuntimeLogging } from '@nocobase/app-server/logging';
import {
  pruneJournals,
  readJournal,
  type JournalPage,
  type JournalQuery,
} from '@nocobase/logging';

import type { AppRuntimeRegistry } from '../app-registry.ts';
import type { DeploymentLogListener } from '../deployment-log.js';
import { fullErrorMessage } from '../errors.ts';
import { isServiceBackend, type ServiceBackend } from '../service-backend.ts';
import type { ManagedReconciler } from './managed-reconciler.ts';
import {
  MemoryOperationLog,
  assertOperationId,
  assertScopeId,
  type OperationLog,
} from './operation-log.ts';
import {
  IN_PROCESS_BACKEND,
  type ApplyDeploymentSetResult,
  type HostBackendDescription,
  type HostDeploymentSet,
  type HostDeploymentSpec,
  type HostDescription,
  type HostOperation,
  type HostScope,
  type HostScopeCheck,
  type HostStatus,
  type HostStatusQuery,
} from './types.ts';

/** The scope an operation of an unscoped deployment is recorded under. */
export const UNSCOPED = '_';

const APP_ID = /^[a-zA-Z0-9_-]+$/;

/** An error with a stable code, which the IPC channel carries to the caller. */
export class HostManagementError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'APP_OWNED_BY_OTHER_SCOPE'
      | 'BACKEND_UNAVAILABLE'
      | 'INVALID_SCOPE'
      | 'HOST_DRAINING',
  ) {
    super(message);
    this.name = 'HostManagementError';
  }
}

interface ScopeState {
  scope: HostScope;
  key: string;
  /** The revision of the last set applied, 0 before any. */
  revision: number;
  lastSet: string | null;
}

export interface ManagedScopesOptions {
  readonly reconciler: ManagedReconciler;
  readonly registry: AppRuntimeRegistry;
  /** Where Apps keep their data; in-process runtime logs are read from `<appId>/storage/logs`. */
  readonly appVolumesDir: string;
  readonly operations?: OperationLog;
  readonly hostId?: string;
  readonly now?: () => number;
}

export class ManagedScopes {
  private readonly scopes = new Map<string, ScopeState>();
  /** Which scope each App belongs to. */
  private readonly owners = new Map<string, string>();
  private readonly inflight = new Map<string, Promise<HostStatus>>();
  private readonly operations: OperationLog;
  private readonly hostId: string;
  private readonly now: () => number;
  private draining = false;

  constructor(private readonly options: ManagedScopesOptions) {
    this.operations = options.operations ?? new MemoryOperationLog();
    this.hostId = options.hostId ?? randomUUID();
    this.now = options.now ?? Date.now;
  }

  describe(mode: HostDescription['mode']): HostDescription {
    const backends: HostBackendDescription[] = [];
    for (const backend of this.options.registry.listBackends()) {
      if (backend.kind === 'in-process')
        backends.push({
          name: IN_PROCESS_BACKEND,
          kind: 'in-process',
          capabilities: {
            onDemand: true,
            rollout: 'stop-first',
            images: false,
            backup: false,
            logs: true,
            urlModes: ['path'],
          },
          configSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
        });
      else if (isServiceBackend(backend))
        backends.push({
          name: backend.name,
          kind: backend.kind,
          capabilities: { ...backend.capabilities },
          configSchema: backend.configSchema,
          ...(backend.secretSchema
            ? { secretSchema: backend.secretSchema }
            : {}),
        });
    }
    return { mode, hostId: this.hostId, backends };
  }

  async check(scope: HostScope): Promise<HostScopeCheck> {
    try {
      const backend = this.backendOf(scope);
      try {
        validateScope(scope, backend);
      } catch (error) {
        // Settings that cannot work, as opposed to a platform that does not answer.
        return {
          ok: false,
          message: errorMessage(error),
          details: { invalidSettings: true },
        };
      }
      if (!backend) {
        const status = this.options.reconciler.getStatus();
        return {
          ok: true,
          details: { apps: status.deployments.length, ready: status.ready },
        };
      }
      // Unsaved settings are tried under a scope of their own, so a running scope keeps its connection.
      const probe = `__check-${randomUUID()}`;
      await backend.bindScope({
        scopeId: probe,
        config: scope.backendConfig ?? {},
        secret: scope.secret ?? null,
      });
      try {
        return await backend.check(probe);
      } finally {
        await backend.releaseScope?.(probe);
      }
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  }

  async applySet(
    set: HostDeploymentSet,
    restoring: boolean,
  ): Promise<ApplyDeploymentSetResult> {
    this.assertAccepting();
    const scope = set.scope!;
    const state = await this.bind(scope);
    if (!Number.isSafeInteger(set.revision) || set.revision < 1)
      throw new Error(
        'Deployment set revision must be a positive safe integer',
      );
    if (!Array.isArray(set.deployments))
      throw new Error('Deployment set deployments must be an array');
    const specs = set.deployments.map((spec) => ({ ...spec, scope }));
    this.assertOwnership(
      scope.id,
      specs.map((spec) => spec.appId),
    );
    const payload = JSON.stringify(set);
    if (
      set.revision < state.revision ||
      (set.revision === state.revision && payload === state.lastSet)
    )
      return {
        accepted: false,
        revision: state.revision,
        status: this.status({ scope: scope.id }),
      };
    if (set.revision === state.revision)
      throw new Error(
        `Deployment set revision ${set.revision} of scope "${scope.id}" cannot be changed`,
      );
    const wanted = new Set(specs.map((spec) => spec.appId));
    const remove = [...this.owners]
      .filter(([appId, owner]) => owner === scope.id && !wanted.has(appId))
      .map(([appId]) => appId);
    for (const spec of specs) this.assertBackend(spec);
    await this.options.reconciler.reconcileScope({
      deployments: specs,
      remove,
      restoring,
    });
    for (const appId of remove) this.owners.delete(appId);
    for (const spec of specs) this.owners.set(spec.appId, scope.id);
    state.revision = set.revision;
    state.lastSet = payload;
    return {
      accepted: true,
      revision: state.revision,
      status: this.status({ scope: scope.id }),
    };
  }

  /**
   * Deploys one App of a scope at most once per operation ID: a repeat answers the recorded outcome, a concurrent one
   * waits for the first.
   */
  async applyDeployment(
    spec: HostDeploymentSpec,
    listener: DeploymentLogListener | undefined,
  ): Promise<HostStatus> {
    this.assertAccepting();
    const scope = spec.scope!;
    const state = await this.bind(scope);
    const scoped = { ...spec, scope };
    this.assertOwnership(scope.id, [spec.appId]);
    this.assertBackend(scoped);
    if (!spec.operationId) return await this.run(state, scoped, listener);
    assertOperationId(spec.operationId);
    const key = `${scope.id}\u0000${spec.operationId}`;
    const running = this.inflight.get(key);
    if (running) return await running;
    const recorded = await this.operations.get(scope.id, spec.operationId);
    if (recorded && recorded.state !== 'running')
      return this.status({ scope: scope.id });
    const work = this.record(scope.id, scoped, () =>
      this.run(state, scoped, listener),
    );
    this.inflight.set(key, work);
    try {
      return await work;
    } finally {
      this.inflight.delete(key);
    }
  }

  /** Records an unscoped deployment's outcome too, so `getOperation` answers it; it is not deduplicated. */
  async recordUnscoped(
    spec: HostDeploymentSpec,
    work: () => Promise<HostStatus>,
  ): Promise<HostStatus> {
    if (!spec.operationId) return await work();
    assertOperationId(spec.operationId);
    return await this.record(UNSCOPED, spec, work);
  }

  async startDeployment(
    spec: HostDeploymentSpec,
    start: (spec: HostDeploymentSpec) => Promise<HostStatus>,
  ): Promise<HostStatus> {
    this.assertAccepting();
    const scope = spec.scope!;
    await this.bind(scope);
    this.assertOwnership(scope.id, [spec.appId]);
    const scoped = { ...spec, scope };
    this.assertBackend(scoped);
    const status = await start(scoped);
    this.owners.set(spec.appId, scope.id);
    return status;
  }

  getOperation(
    operationId: string,
    scope: HostScope | undefined,
  ): Promise<HostOperation | null> {
    assertOperationId(operationId);
    const scopeId = scope?.id ?? UNSCOPED;
    assertScopeId(scopeId);
    return this.operations.get(scopeId, operationId);
  }

  /** The Host's status, narrowed to one scope's Apps or to some Apps. */
  status(query: HostStatusQuery = {}): HostStatus {
    const status = this.options.reconciler.getStatus();
    const state = query.scope ? this.scopes.get(query.scope) : undefined;
    const deployments = status.deployments.filter(
      (deployment) =>
        (!query.scope || this.owners.get(deployment.appId) === query.scope) &&
        (!query.appIds || query.appIds.includes(deployment.appId)),
    );
    return {
      ...status,
      deployments,
      ...(state
        ? { scope: { id: state.scope.id, revision: state.revision } }
        : {}),
    };
  }

  /** An App's runtime log: its log files for an in-process App, what its backend keeps for an external one. */
  async logs(appId: string, query: JournalQuery): Promise<JournalPage> {
    if (!APP_ID.test(appId)) throw new Error('Invalid app ID');
    const definition = this.options.registry.definition(appId);
    if (definition && definition.backend !== 'in-process') {
      const backend = this.options.registry.backendOf(definition);
      if (!backend || !isServiceBackend(backend))
        throw new HostManagementError(
          `App backend "${definition.backend}" is not available on this host`,
          'BACKEND_UNAVAILABLE',
        );
      return await backend.logs(definition, query);
    }
    const directory = await this.logsDirectory(appId);
    const policy = normalizeRuntimeLogging(
      this.options.reconciler.specOf(appId)?.logging,
    ).file;
    await pruneJournals(directory, {
      retentionDays: policy?.retentionDays ?? 7,
      maxSizeMB: policy?.maxTotalSizeMB ?? 500,
    });
    return await readJournal(directory, query);
  }

  /** Forgets a removed App's scope. */
  forget(appId: string): void {
    this.owners.delete(appId);
  }

  /** Refuses an App of another scope. */
  assertOwnership(scopeId: string, appIds: readonly string[]): void {
    for (const appId of appIds) {
      const owner = this.owners.get(appId);
      if (owner && owner !== scopeId)
        throw new HostManagementError(
          `App "${appId}" belongs to scope "${owner}" on this Host`,
          'APP_OWNED_BY_OTHER_SCOPE',
        );
    }
  }

  /**
   * Stops taking changes and waits (bounded) for the deployments under way, so that they record their outcome before
   * the process exits. Reads keep working.
   */
  async drain(timeoutMs: number): Promise<void> {
    this.draining = true;
    const running = [...this.inflight.values()];
    if (!running.length) return;
    await Promise.race([
      Promise.allSettled(running),
      new Promise((resolve) => {
        setTimeout(resolve, timeoutMs).unref?.();
      }),
    ]);
  }

  assertAccepting(): void {
    if (this.draining)
      throw new HostManagementError(
        'The Host is shutting down and takes no more changes',
        'HOST_DRAINING',
      );
  }

  async close(): Promise<void> {
    this.draining = true;
    const closing: Promise<void>[] = [];
    for (const backend of this.options.registry.listBackends())
      if (isServiceBackend(backend) && backend.close)
        closing.push(backend.close());
    await Promise.allSettled(closing);
  }

  // ---------------------------------------------------------------------------------------------------------------

  private async run(
    state: ScopeState,
    spec: HostDeploymentSpec,
    listener: DeploymentLogListener | undefined,
  ): Promise<HostStatus> {
    // The App is the scope's from now on, also when this first deployment fails: its status says so.
    this.owners.set(spec.appId, state.scope.id);
    await this.options.reconciler.applyDeployment(spec, listener);
    return this.status({ scope: state.scope.id });
  }

  /** Runs a deployment with its outcome recorded before and after. */
  private async record(
    scopeId: string,
    spec: HostDeploymentSpec,
    work: () => Promise<HostStatus>,
  ): Promise<HostStatus> {
    const base = {
      operationId: spec.operationId!,
      scopeId,
      appId: spec.appId,
      startedAt: new Date(this.now()).toISOString(),
    } as const;
    await this.operations.put({
      ...base,
      state: 'running',
      status: null,
      error: null,
      finishedAt: null,
    });
    try {
      const status = await work();
      const deployed =
        status.deployments.find(
          (deployment) => deployment.appId === spec.appId,
        ) ?? null;
      const ok = deployed !== null && deployed.observedState !== 'failed';
      await this.operations.put({
        ...base,
        state: ok ? 'succeeded' : 'failed',
        status: deployed,
        error: ok
          ? null
          : (deployed?.error ?? 'The Host did not report the deployment.'),
        finishedAt: new Date(this.now()).toISOString(),
      });
      return status;
    } catch (error) {
      await this.operations.put({
        ...base,
        state: 'failed',
        status: null,
        error: fullErrorMessage(error),
        finishedAt: new Date(this.now()).toISOString(),
      });
      throw error;
    }
  }

  /** The scope's state, (re)bound when the Host does not know it or its backend settings changed. */
  private async bind(scope: HostScope): Promise<ScopeState> {
    validateScopeShape(scope);
    const backend = this.backendOf(scope);
    validateScope(scope, backend);
    const key = JSON.stringify([
      scope.backend ?? IN_PROCESS_BACKEND,
      scope.backendConfig ?? {},
      scope.secret ?? null,
    ]);
    const current = this.scopes.get(scope.id);
    if (current && current.key === key) return current;
    if (
      current &&
      (current.scope.backend ?? IN_PROCESS_BACKEND) !==
        (scope.backend ?? IN_PROCESS_BACKEND) &&
      [...this.owners.values()].includes(scope.id)
    )
      throw new HostManagementError(
        `Scope "${scope.id}" runs its Apps on the "${current.scope.backend ?? IN_PROCESS_BACKEND}" backend; remove them before changing it`,
        'INVALID_SCOPE',
      );
    if (backend)
      await backend.bindScope({
        scopeId: scope.id,
        config: scope.backendConfig ?? {},
        secret: scope.secret ?? null,
      });
    const state: ScopeState = current
      ? { ...current, scope, key }
      : { scope, key, revision: 0, lastSet: null };
    this.scopes.set(scope.id, state);
    return state;
  }

  /** The external-service backend a scope names, or null for in-process. */
  private backendOf(scope: HostScope): ServiceBackend | null {
    const name = scope.backend ?? IN_PROCESS_BACKEND;
    if (name === IN_PROCESS_BACKEND) {
      if (
        !this.options.registry
          .listBackends()
          .some((backend) => backend.kind === 'in-process')
      )
        throw new HostManagementError(
          'This Host runs no in-process Apps',
          'BACKEND_UNAVAILABLE',
        );
      return null;
    }
    const backend = this.options.registry
      .listBackends()
      .find(
        (candidate) => isServiceBackend(candidate) && candidate.name === name,
      );
    if (!backend || !isServiceBackend(backend))
      throw new HostManagementError(
        `This Host offers no "${name}" backend`,
        'BACKEND_UNAVAILABLE',
      );
    return backend;
  }

  /** A spec's backend kind has to be the one its scope names. */
  private assertBackend(spec: HostDeploymentSpec): void {
    const external =
      (spec.scope?.backend ?? IN_PROCESS_BACKEND) !== IN_PROCESS_BACKEND;
    if (external !== (spec.backend === 'external-service'))
      throw new HostManagementError(
        `Deployment "${spec.id}" runs on "${spec.backend}", but its scope "${spec.scope?.id}" runs on "${spec.scope?.backend ?? IN_PROCESS_BACKEND}"`,
        'INVALID_SCOPE',
      );
  }

  private async logsDirectory(appId: string): Promise<string> {
    const base = this.options.appVolumesDir;
    const directory = path.join(base, appId, 'storage', 'logs');
    try {
      if (
        (await realpath(directory)) !==
        path.join(await realpath(base), appId, 'storage', 'logs')
      )
        throw new Error('Invalid log directory.');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    return directory;
  }
}

function validateScopeShape(scope: HostScope): void {
  if (!scope || typeof scope !== 'object')
    throw new HostManagementError('Scope must be an object', 'INVALID_SCOPE');
  assertScopeId(scope.id);
  if (scope.id === UNSCOPED || scope.id.startsWith('__'))
    throw new HostManagementError(
      `Scope ID "${scope.id}" is reserved`,
      'INVALID_SCOPE',
    );
  if (
    scope.backendConfig !== undefined &&
    (typeof scope.backendConfig !== 'object' ||
      scope.backendConfig === null ||
      Array.isArray(scope.backendConfig))
  )
    throw new HostManagementError(
      `Scope "${scope.id}" backend settings must be an object`,
      'INVALID_SCOPE',
    );
}

/** In-process takes no settings and no credentials; an external-service backend checks its own. */
function validateScope(scope: HostScope, backend: ServiceBackend | null): void {
  if (!backend) {
    if (Object.keys(scope.backendConfig ?? {}).length)
      throw new HostManagementError(
        'In-process Apps take no backend settings.',
        'INVALID_SCOPE',
      );
    if (scope.secret && Object.keys(scope.secret).length)
      throw new HostManagementError(
        'In-process Apps take no credentials.',
        'INVALID_SCOPE',
      );
    return;
  }
  try {
    backend.validate(scope.backendConfig ?? {}, scope.secret ?? null);
  } catch (error) {
    throw new HostManagementError(errorMessage(error), 'INVALID_SCOPE');
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
