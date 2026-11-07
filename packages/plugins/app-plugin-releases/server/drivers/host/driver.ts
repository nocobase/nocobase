/**
 * The `host` driver: environments deploy through App Hosts, over the Host management service
 * (`@nocobase/app-host/management`). An environment chooses its run mode, the activation backend its Apps run on
 * (`backend`: `in-process`, or `docker` when the application offers it), with that backend's settings
 * (`backendConfig`); its write-only credentials go to the backend. The driver picks the Host that offers the backend:
 *
 * - `in-process`: the App Host child this application starts and supervises, which runs Apps in its own process. It
 *   runs untrusted App code, so it is never sent an environment's credentials and never holds Docker access.
 * - `docker`: a second Host child that runs Apps in containers (`@nocobase/app-host-docker`) and no App code itself,
 *   so the Docker credentials never sit beside code under preview. Its listener is the Docker Apps' ingress.
 *
 * Each environment is one scope on its Host (`HostScope`): its own desired set with its own revision, so restoring one
 * environment never touches another's Apps, and an App belongs to one scope only. Deployments carry the control
 * plane's deployment ID, run at most once, and their outcome stays readable through `getOperation` after either side
 * restarted.
 */
import path from 'node:path';

import type {
  HostDeploymentSpec,
  HostDeploymentStatus,
  HostManagementService,
  HostOperation,
  HostScope,
  HostStatus,
} from '@nocobase/app-host/management';
import type { AppHostSupervisorInfo } from '@nocobase/app-host/supervisor';
import type { AppRuntimeLogging } from '@nocobase/app-server/logging';
import type { AppDriveDiskConfig } from '@nocobase/drive';
import {
  createDiagnosticLogger,
  type JournalPage,
  type JournalQuery,
  type Logger,
  type LoggingConfig,
} from '@nocobase/logging';
import { stringify as stringifyYaml } from 'yaml';

import { ACCESS_NAMESPACE } from '../../../shared/access.js';
import { writeTextAtomic } from '../../services/config-file.js';
export { UNRESTORED_APP_ERROR } from '../types.js';
import {
  expandPublicUrl,
  type AppDeploymentSpec,
  type AppObservedStatus,
  type DeploymentDriver,
  type DriverCapabilities,
  type DriverContext,
  type DriverEnvironment,
  type DriverSession,
  type HostOccupancy,
  type RegistryAuth,
  UNRESTORED_APP_ERROR,
} from '../types.js';

/** The backend of Apps that run in the Host process. */
export const IN_PROCESS_BACKEND = 'in-process';
export const DOCKER_BACKEND = 'docker';

/** What each backend this driver knows can do; another backend a Host offers is treated as the in-process one. */
export const HOST_BACKEND_CAPABILITIES: Readonly<
  Record<string, DriverCapabilities>
> = {
  [IN_PROCESS_BACKEND]: {
    onDemand: true,
    logs: true,
    urlModes: ['path'],
    images: false,
  },
  [DOCKER_BACKEND]: {
    onDemand: true,
    logs: true,
    urlModes: ['path', 'subdomain'],
    images: true,
  },
};

/** What the driver needs from `AppHostSupervisor`; tests pass a fake. */
export interface HostRuntimeController {
  getInfo(): Pick<AppHostSupervisorInfo, 'status' | 'targetUrl'>;
  onReady(listener: () => void): () => void;
  ensureStarted(): Promise<URL>;
  /** The child's management service; asked for per call, since a restarted child is reached through a new client. */
  getManagementClient(): Promise<HostManagementService>;
  /** Stops and starts the Host child; its `onReady` listeners then replay the desired sets. */
  restart?(
    reason?: string,
    options?: { shutdownTimeoutMs?: number },
  ): Promise<URL>;
}

/** A Host the driver deploys to, for the environments whose backend it runs. */
export interface HostEndpointOptions {
  readonly controller: HostRuntimeController;
  /** Prepares the Host before it first starts, such as writing its configuration file (`writeHostConfig`). */
  readonly prepare?: () => Promise<void>;
  /**
   * The public origin and path its listener is reached at (`https://apps.example.com`, or `/` behind this
   * application's own listener), with `{appId}` or as a base. An environment's URL pattern wins over it. Without
   * either, URLs point at the Host's local listener.
   */
  readonly publicUrl?: string;
  /**
   * Restart the Host once this many Apps were replaced, removed, stopped for idleness or made dormant since it
   * started: in-process Apps cannot unload their modules (ESM has no unload), so every runtime that goes away leaves
   * memory behind; a restart replays the desired sets into a fresh process, where on-demand Apps stay stopped until
   * requested. Startup and deployment work always defer rotation; HTTP requests drain after the maximum wait. Off when omitted.
   */
  readonly restartAfterChurn?: number;
  /** Heap rotation line, 0 disables; defaults to 0.55 when count rotation is enabled. */
  readonly restartHeapRatio?: number;
  /** After this wait, gate ingress and drain requests; startup/deployment work still defers. */
  readonly restartMaxWaitMs?: number;
  /** Request drain and, separately, supervisor shutdown allowance (30 seconds each by default). */
  readonly restartDrainMs?: number;
}

export interface HostDriverOptions {
  /** The Host for each backend environments may choose; `in-process` is required. */
  readonly hosts: Readonly<Record<string, HostEndpointOptions>>;
  /** The Apps' own logging, passed into every deployment. */
  readonly appLogging?: AppRuntimeLogging;
  /** How often the driver reads the Host's idle stops and dormancies for `restartAfterChurn` (60 s by default). */
  readonly churnCheckIntervalMs?: number;
  /** How the application configured each Host, shown read-only with an environment's settings, by backend. */
  readonly facts?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  /** The driver kind; `host` unless an application registers two. */
  readonly kind?: string;
  readonly logger?: Logger;
}

/** The Host driver, plus what an application's listener needs to forward the in-process Host's traffic. */
export interface HostDeploymentDriver extends DeploymentDriver {
  /** Where to forward requests outside this application's mount, or null while the in-process Host is not ready. */
  proxyTarget(): URL | null;
  /** Apps replaced, removed, stopped for idleness or made dormant since the in-process Host last started. */
  churn(): number;
  /** Restarts the in-process Host and replays its environments' desired sets, reclaiming unloaded Apps' memory. */
  restartHost(reason?: string): Promise<void>;
}

/** An environment's Host settings. */
export interface HostEnvironmentSettings {
  readonly backend: string;
  readonly backendConfig: Readonly<Record<string, unknown>>;
}

const SETTINGS_KEYS = new Set(['backend', 'backendConfig']);

export function hostEnvironmentSettings(
  config: Readonly<Record<string, unknown>>,
): HostEnvironmentSettings {
  for (const key of Object.keys(config))
    if (!SETTINGS_KEYS.has(key))
      throw new Error(
        `The Host driver takes a backend and its settings, not "${key}".`,
      );
  const { backend } = config;
  const backendConfig = config.backendConfig ?? {};
  if (typeof backend !== 'string' || !backend)
    throw new Error(
      'The environment names no run mode (backend: in-process or docker).',
    );
  if (
    typeof backendConfig !== 'object' ||
    backendConfig === null ||
    Array.isArray(backendConfig)
  )
    throw new Error('The backend settings must be an object.');
  return {
    backend,
    backendConfig: backendConfig as Record<string, unknown>,
  };
}

/** A scope the driver serves: an open environment. */
interface OpenScope {
  readonly environmentId: string;
  readonly backend: string;
  readonly host: HostEndpointOptions;
  /** The scope as the Host takes it; the registry's pull credentials join the secret once a deployment names them. */
  scope: HostScope;
  readonly publicUrl: string | null;
  readonly desired: () => Promise<readonly AppDeploymentSpec[]>;
  restoring: Promise<void> | null;
  restoreFailed: boolean;
  /** Why its last restore failed, while `restoreFailed`. */
  restoreError: string | null;
  /** The Apps of its last desired set, so Apps a failed restore left off the Host can still be reported. */
  desiredAppIds: Set<string>;
  deploymentBatchBusy?: DriverContext['deploymentBatchBusy'];
}

export function createHostDriver(
  options: HostDriverOptions,
): HostDeploymentDriver {
  const diagnostic = createDiagnosticLogger(options.logger);
  const inProcess = options.hosts[IN_PROCESS_BACKEND];
  if (!inProcess) throw new Error('The Host driver needs the in-process Host.');
  for (const [name, value] of Object.entries({
    restartMaxWaitMs: inProcess.restartMaxWaitMs,
    restartDrainMs: inProcess.restartDrainMs,
  })) {
    if (
      value !== undefined &&
      (!Number.isInteger(value) || value < 0 || value > 2_147_483_647)
    )
      throw new Error(
        `Invalid ${name}: expected a non-negative timer interval`,
      );
  }
  const scopes = new Map<string, OpenScope>();
  /** The latest revision sent per scope; the Host refuses an older one. */
  const revisions = new Map<string, number>();
  const watched = new Set<HostEndpointOptions>();
  const prepared = new Map<HostEndpointOptions, Promise<void>>();
  /** Apps this driver replaced or removed on the in-process Host since it started. */
  let churn = 0;
  /** Idle stops and dormancies the in-process Host reported since it started. */
  let runtimeChurn = 0;
  let inFlight = 0;
  let restartScheduled: Promise<void> | null = null;
  let rotationPreparing: Promise<boolean> | null = null;
  let readyRestoring: Promise<void> | null = null;
  let churnTimer: NodeJS.Timeout | null = null;
  let restartDeadline: NodeJS.Timeout | null = null;
  let checkingChurn = false;
  let recheckChurn = false;
  let retryCheckAt = 0;
  const capacityWaiting = new Set<string>();
  const batchBusy = (): boolean =>
    [...scopes.values()].some(
      (scope) =>
        scope.host === inProcess &&
        scope.deploymentBatchBusy?.(capacityWaiting),
    );
  let hostGeneration = 0;
  let rotationSince: number | null = null;
  let capacityRotation = false;
  const rotationWaiters = new Set<(ok: boolean) => void>();
  const heapRatio =
    inProcess.restartHeapRatio ?? (inProcess.restartAfterChurn ? 0.55 : 0);
  if (!Number.isFinite(heapRatio) || heapRatio < 0 || heapRatio >= 1)
    throw new Error('Invalid Host restart heap ratio');

  const hostOf = (backend: string): HostEndpointOptions => {
    const host = options.hosts[backend];
    if (!host)
      throw new Error(
        `This application offers no "${backend}" run mode for its environments.`,
      );
    return host;
  };

  const prepare = (host: HostEndpointOptions): Promise<void> => {
    let done = prepared.get(host);
    if (!done) {
      done = (host.prepare?.() ?? Promise.resolve()).catch((error: unknown) => {
        prepared.delete(host);
        throw error;
      });
      prepared.set(host, done);
    }
    return done;
  };

  /** The Host's management service, started (and prepared) when needed. */
  const managementOf = async (
    host: HostEndpointOptions,
  ): Promise<HostManagementService> => {
    await prepare(host);
    return await host.controller.getManagementClient();
  };

  const scopeOf = (
    environment: DriverEnvironment,
    settings: HostEnvironmentSettings,
  ): HostScope => ({
    id: environment.id,
    backend: settings.backend,
    ...(Object.keys(settings.backendConfig).length
      ? { backendConfig: { ...settings.backendConfig } }
      : {}),
    // Credentials go only to a backend that takes them: nothing secret reaches the Host that runs App code.
    ...(settings.backend !== IN_PROCESS_BACKEND &&
    environment.secret &&
    Object.keys(environment.secret).length
      ? { secret: { ...environment.secret } }
      : {}),
  });

  /** Adds the registry's pull credentials a deployment names to the scope's secret, once. */
  const withRegistryAuth = (
    scope: OpenScope,
    auth: RegistryAuth | undefined,
  ): void => {
    if (!auth || scope.backend === IN_PROCESS_BACKEND) return;
    const current = scope.scope.secret?.registryAuth;
    if (JSON.stringify(current) === JSON.stringify(auth)) return;
    scope.scope = {
      ...scope.scope,
      secret: { ...scope.scope.secret, registryAuth: { ...auth } },
    };
  };

  const toHostSpec = (
    scope: OpenScope,
    spec: AppDeploymentSpec,
    desiredState: 'running' | 'stopped' = spec.desiredState,
    activation?: 'eager' | 'lazy',
  ): HostDeploymentSpec => {
    withRegistryAuth(scope, spec.registryAuth);
    const hostname =
      scope.backend !== IN_PROCESS_BACKEND
        ? subdomainOf(scope.publicUrl, spec.appId)
        : null;
    return {
      // The Host's deployment identity is stable per App; the control plane's deployment IDs are history.
      id: spec.appId,
      appId: spec.appId,
      operationId: spec.deploymentId,
      ...(options.appLogging ? { logging: options.appLogging } : {}),
      // An image release has no archive: the artifact then only names the release (the hex of its image digest).
      artifact: {
        key: spec.artifact?.key ?? '',
        appId: spec.appId,
        version: spec.release.version,
        checksum: spec.release.checksum,
      },
      desiredState,
      backend:
        scope.backend === IN_PROCESS_BACKEND
          ? 'in-process'
          : 'external-service',
      activation:
        activation ?? (spec.activation === 'onDemand' ? 'lazy' : 'eager'),
      idleStopMs: spec.idleStopMinutes ? spec.idleStopMinutes * 60_000 : 0,
      dormantAfterMs: spec.dormantAfterHours
        ? Math.round(spec.dormantAfterHours * 3_600_000)
        : 0,
      basePath: `/${spec.appId}`,
      ...(spec.config.mode === 'file'
        ? {
            config: {
              provider: 'file' as const,
              revision: spec.config.revision,
              content: spec.config.content,
            },
          }
        : {}),
      ...(spec.images?.length ? { images: [...spec.images] } : {}),
      ...(hostname ? { hostname } : {}),
      ...(spec.env && Object.keys(spec.env).length > 0
        ? { env: { ...spec.env } }
        : {}),
    };
  };

  /** Sends one environment's complete desired set as a new revision of its scope. */
  const sendSet = async (scope: OpenScope): Promise<void> => {
    const management = await managementOf(scope.host);
    const specs = await scope.desired();
    scope.desiredAppIds = new Set(specs.map((spec) => spec.appId));
    const deployments = specs.map((spec) => toHostSpec(scope, spec));
    const send = async (revision: number) => {
      revisions.set(scope.environmentId, revision);
      return await management.restoreDeploymentSet({
        scope: scope.scope,
        revision,
        deployments,
      });
    };
    const first = await send((revisions.get(scope.environmentId) ?? 0) + 1);
    // The Host kept a newer revision (this process restarted, the Host did not): continue after it.
    if (!first.accepted && first.revision !== undefined)
      await send(first.revision + 1);
  };

  const scheduleRestore = (scope: OpenScope): Promise<void> => {
    if (scope.restoring) return scope.restoring;
    const current = sendSet(scope)
      .then(() => {
        scope.restoreFailed = false;
        scope.restoreError = null;
      })
      .catch((error: unknown) => {
        scope.restoreFailed = true;
        scope.restoreError =
          error instanceof Error ? error.message : String(error);
        if (scopes.get(scope.environmentId) === scope) watchChurn(true);
        diagnostic.error(
          `Failed to restore the Apps of environment ${scope.environmentId}`,
          error,
        );
        throw error;
      })
      .finally(() => {
        if (scope.restoring === current) scope.restoring = null;
      });
    scope.restoring = current;
    return current;
  };

  const restoreHost = async (host: HostEndpointOptions): Promise<void> => {
    const failures: unknown[] = [];
    for (const scope of scopes.values())
      if (scope.host === host)
        await scheduleRestore(scope).catch((error: unknown) => {
          failures.push(error);
        });
    // A broken environment must not prevent the remaining environments from being restored.
    if (failures.length) throw failures[0];
  };

  const watchReady = (host: HostEndpointOptions): void => {
    if (watched.has(host)) return;
    watched.add(host);
    host.controller.onReady(() => {
      if (host === inProcess && !restartScheduled) {
        hostGeneration += 1;
        churn = 0;
        runtimeChurn = 0;
        if (restartDeadline) clearTimeout(restartDeadline);
        restartDeadline = null;
        rotationSince = null;
        capacityRotation = false;
      }
      if (!restartScheduled) {
        const restoring = restoreHost(host);
        if (host === inProcess) readyRestoring = restoring;
        void restoring
          .catch(() => undefined)
          .finally(() => {
            if (readyRestoring === restoring) readyRestoring = null;
          });
      }
    });
  };

  // --- Recycling the in-process Host (`restartAfterChurn`) ---------------------------------------------------------

  const finishRotation = (ok: boolean): void => {
    for (const resolve of rotationWaiters) resolve(ok);
    rotationWaiters.clear();
  };

  const restartHost = async (reason: string): Promise<void> => {
    const { controller } = inProcess;
    if (!controller.restart)
      throw new Error('This Host runtime cannot be restarted by the driver.');
    restartScheduled ??= (async () => {
      try {
        hostGeneration += 1;
        if (restartDeadline) clearTimeout(restartDeadline);
        restartDeadline = null;
        await controller.restart!(reason, {
          shutdownTimeoutMs: inProcess.restartDrainMs ?? 30_000,
        });
        churn = 0;
        runtimeChurn = 0;
        rotationSince = null;
        capacityRotation = false;
        await restoreHost(inProcess);
        finishRotation(true);
      } catch (error) {
        // If restart failed before the child exited, serving traffic can resume. New revisions remain paused.
        const service = await managementOf(inProcess).catch(() => null);
        await service
          ?.prepareRotation?.({ resume: true })
          .catch(() => undefined);
        finishRotation(false);
        throw error;
      } finally {
        restartScheduled = null;
      }
    })();
    await restartScheduled;
  };

  const maybeRestart = async (): Promise<void> => {
    const { controller } = inProcess;
    if (restartScheduled || rotationPreparing) return;
    if (controller.getInfo().status !== 'ready' || Date.now() < retryCheckAt)
      return;
    if (
      (!inProcess.restartAfterChurn && !heapRatio && !capacityRotation) ||
      !controller.restart
    )
      return;
    if (batchBusy() && rotationSince === null && !capacityRotation) return;
    const generation = hostGeneration;
    const service = await managementOf(inProcess);
    // The unfiltered status includes resident, staging and unscoped Apps sharing the process.
    const status = await service.getStatus();
    if (restartScheduled || generation !== hostGeneration) return;
    const counters = status.counters;
    runtimeChurn =
      (counters?.idleStops ?? 0) +
      (counters?.dormancies ?? 0) +
      (counters?.capacityStops ?? 0) +
      (counters?.startupTimeouts ?? 0);
    const total = churn + runtimeChurn;
    const memory = counters?.memory;
    const threshold =
      total > 0 &&
      (capacityRotation ||
        (inProcess.restartAfterChurn && total >= inProcess.restartAfterChurn) ||
        (heapRatio > 0 &&
          memory &&
          memory.heapUsed >= memory.heapLimit * heapRatio));
    if (!threshold && rotationSince === null) return;
    rotationSince ??= Date.now();
    const wait = inProcess.restartMaxWaitMs ?? 5 * 60_000;
    const expired = Date.now() - rotationSince >= wait;
    if (!expired && !restartDeadline) {
      restartDeadline = setTimeout(
        () => {
          restartDeadline = null;
          checkChurn();
        },
        Math.max(1, wait - (Date.now() - rotationSince)),
      );
      restartDeadline.unref?.();
    }
    if (expired) await service.prepareRotation?.({ pauseOnly: true });
    if (
      inFlight > 0 ||
      batchBusy() ||
      [...scopes.values()].some(
        (scope) => scope.host === inProcess && scope.restoring !== null,
      ) ||
      (counters?.operationsInFlight ?? 0) > 0
    )
      return;
    const busy = status.deployments.some(
      (deployment) =>
        deployment.lifecycle?.state === 'starting' ||
        (!expired && (deployment.app?.activeRequests ?? 0) > 0) ||
        (!expired && (deployment.app?.activeConnections ?? 0) > 0),
    );
    if (busy) return;
    // Before the deadline reserve only an idle child. At the deadline gate ingress first, then give existing
    // responses a bounded drain. The old proxy target remains available to return 503 + Retry-After while draining.
    if (!service.prepareRotation) return;
    const preparing = service.prepareRotation({
      ignoreConnections: expired,
      ...(expired
        ? { drainTimeoutMs: inProcess.restartDrainMs ?? 30_000 }
        : {}),
    });
    rotationPreparing = preparing;
    let reserved: boolean;
    try {
      reserved = await preparing;
    } catch (error) {
      await service.prepareRotation({ resume: true }).catch(() => undefined);
      throw error;
    } finally {
      if (rotationPreparing === preparing) rotationPreparing = null;
    }
    if (!reserved) return;
    // New tracked work waits for the handoff. New control-plane dispatches have not entered the Host yet;
    // the batch was settled before the handoff began. Existing operations remain protected by the child recheck.
    if (inFlight > 0 || generation !== hostGeneration) {
      await service.prepareRotation({ resume: true });
      return;
    }
    await restartHost(
      `${total} applications deployed, replaced, removed, stopped or made dormant; recycling Host memory`,
    );
  };

  const checkChurn = (): void => {
    if (checkingChurn) {
      recheckChurn = true;
      return;
    }
    checkingChurn = true;
    void maybeRestart()
      .catch((error: unknown) => {
        retryCheckAt = Date.now() + (options.churnCheckIntervalMs ?? 60_000);
        diagnostic.error('Failed to recycle the App Host', error);
      })
      .finally(() => {
        checkingChurn = false;
        // Retry failed restores after evaluating rotation, never as a foreground management prerequisite. A pending
        // restore remains protected work, including the interval spent reading its desired set before Host submission.
        if (
          !inFlight &&
          !batchBusy() &&
          !rotationPreparing &&
          !restartScheduled &&
          inProcess.controller.getInfo().status === 'ready' &&
          Date.now() >= retryCheckAt
        )
          for (const scope of scopes.values())
            if (scope.restoreFailed && !scope.restoring)
              void scheduleRestore(scope).catch(() => undefined);
        if (recheckChurn) {
          recheckChurn = false;
          queueMicrotask(checkChurn);
        }
      });
  };

  const countChurn = (scope: OpenScope): void => {
    if (scope.host !== inProcess) return;
    churn += 1;
  };

  const watchChurn = (forRecovery: boolean = false): void => {
    if (
      churnTimer ||
      (!forRecovery && !inProcess.restartAfterChurn && !heapRatio)
    )
      return;
    churnTimer = setInterval(
      checkChurn,
      options.churnCheckIntervalMs ?? 60_000,
    );
    churnTimer.unref?.();
  };

  /** Several failed admissions share one rotation, never hold inFlight while waiting for it. */
  const recycleForCapacity = async (signal: AbortSignal): Promise<boolean> => {
    if (!inProcess.controller.restart || signal.aborted) return false;
    const status = await (await managementOf(inProcess)).getStatus();
    const counters = status.counters;
    runtimeChurn =
      (counters?.idleStops ?? 0) +
      (counters?.dormancies ?? 0) +
      (counters?.capacityStops ?? 0) +
      (counters?.startupTimeouts ?? 0);
    if (churn + runtimeChurn <= 0) return false;
    capacityRotation = true;
    return new Promise<boolean>((resolve) => {
      const done = (ok: boolean): void => {
        clearTimeout(timer);
        rotationWaiters.delete(done);
        signal.removeEventListener('abort', cancelled);
        resolve(ok);
      };
      const cancelled = (): void => done(false);
      signal.addEventListener('abort', cancelled, { once: true });
      const timer = setTimeout(
        () => done(false),
        (inProcess.restartMaxWaitMs ?? 300_000) +
          2 * (inProcess.restartDrainMs ?? 30_000) +
          (options.churnCheckIntervalMs ?? 60_000),
      );
      rotationWaiters.add(done);
      if (signal.aborted) cancelled();
      else checkChurn();
    });
  };

  const tracked = async <T>(
    scope: OpenScope,
    work: () => Promise<T>,
  ): Promise<T> => {
    if (scope.host !== inProcess) return await work();
    if (rotationPreparing) await rotationPreparing.catch(() => false);
    if (restartScheduled) await restartScheduled.catch(() => undefined);
    if (readyRestoring) await readyRestoring.catch(() => undefined);
    // A pending replay may still hold an older desired set. Let it finish before submitting any mutation.
    // Failure leaves management usable; only the background poll initiates another recovery attempt.
    if (scope.restoring) await scope.restoring.catch(() => undefined);
    inFlight += 1;
    try {
      return await work();
    } finally {
      inFlight -= 1;
      if (inFlight === 0) queueMicrotask(checkChurn);
    }
  };

  const capabilitiesOf = (backend: string): DriverCapabilities =>
    HOST_BACKEND_CAPABILITIES[backend] ??
    HOST_BACKEND_CAPABILITIES[IN_PROCESS_BACKEND];
  const backends = Object.keys(options.hosts);
  return {
    kind: options.kind ?? 'host',
    title: { key: 'drivers.host', ns: ACCESS_NAMESPACE },
    configSchema: {
      type: 'object',
      required: ['backend'],
      properties: {
        backend: { type: 'string', enum: backends },
        backendConfig: { type: 'object' },
      },
      additionalProperties: false,
    },
    capabilities: unionCapabilities(backends.map(capabilitiesOf)),
    capabilitiesOf: (config) =>
      capabilitiesOf(typeof config.backend === 'string' ? config.backend : ''),
    variants: {
      key: 'backend',
      capabilities: Object.fromEntries(
        backends.map((backend) => [backend, capabilitiesOf(backend)]),
      ),
    },
    ...(options.facts ? { facts: options.facts } : {}),
    async validate(config, secret) {
      const settings = hostEnvironmentSettings(config);
      const host = hostOf(settings.backend);
      if (settings.backend === IN_PROCESS_BACKEND) {
        if (Object.keys(settings.backendConfig).length)
          throw new Error('In-process Apps take no backend settings.');
        if (secret && Object.keys(secret).length)
          throw new Error('In-process Apps take no credentials.');
        return;
      }
      // The Host's backend checks its own settings; one that cannot work is refused before it is saved.
      const result = await (
        await managementOf(host)
      ).checkScope({
        id: 'validation',
        backend: settings.backend,
        backendConfig: { ...settings.backendConfig },
        ...(secret ? { secret: { ...secret } } : {}),
      });
      if (!result.ok && result.details?.invalidSettings)
        throw new Error(result.message ?? 'Invalid settings.');
    },
    churn: () => churn + runtimeChurn,
    restartHost: (reason = 'restart requested') => restartHost(reason),
    proxyTarget() {
      // Only the initial replay after the child becomes ready gates ingress. Failed environments and their
      // background retries must not take healthy applications on this shared Host offline.
      if (restartScheduled || readyRestoring) return null;
      const info = inProcess.controller.getInfo();
      return info.status === 'ready' && info.targetUrl
        ? new URL(info.targetUrl)
        : null;
    },
    async open(
      environment: DriverEnvironment,
      context: DriverContext,
    ): Promise<DriverSession> {
      const settings = hostEnvironmentSettings(environment.config);
      const host = hostOf(settings.backend);
      await prepare(host);
      if (host === inProcess) watchChurn();
      const scope: OpenScope = {
        environmentId: environment.id,
        backend: settings.backend,
        host,
        scope: scopeOf(environment, settings),
        publicUrl: environment.publicUrl,
        desired: () => context.desired(),
        restoring: null,
        restoreFailed: false,
        restoreError: null,
        desiredAppIds: new Set(),
        deploymentBatchBusy: (excluding) =>
          context.deploymentBatchBusy?.(excluding) ?? false,
      };
      scopes.set(environment.id, scope);
      watchReady(host);
      // Recovery is retried by the background poll. A broken desired set must not block management or repair.
      const management = (): Promise<HostManagementService> =>
        managementOf(host);
      const statusOf = async (appId: string): Promise<AppObservedStatus> => {
        const status = await (
          await management()
        ).getStatus({ scope: environment.id, appIds: [appId] });
        const found = status.deployments.find(
          (deployment) => deployment.appId === appId,
        );
        return found
          ? observed(found)
          : {
              state: 'unknown',
              version: null,
              deploymentId: null,
              startedAt: null,
              error: null,
            };
      };

      const pendingDeployments = new Map<
        string,
        {
          appId: string;
          submitted: boolean;
          cancelled: boolean;
          abortController: AbortController;
        }
      >();
      return {
        deploymentSettled: checkChurn,
        async check() {
          try {
            const url = (await host.controller.ensureStarted()).toString();
            const result = await (await management()).checkScope(scope.scope);
            return {
              ok: result.ok,
              ...(result.message ? { message: result.message } : {}),
              details: { ...result.details, url },
            };
          } catch (error) {
            return {
              ok: false,
              message: error instanceof Error ? error.message : String(error),
            };
          }
        },
        async cancel(deploymentId, appId, queuedOnly) {
          const pending = pendingDeployments.get(deploymentId);
          if (pending && pending.appId === appId && !pending.submitted) {
            pending.cancelled = true;
            pending.abortController.abort();
            return 'cancelled';
          }
          return (await management()).cancelDeployment(deploymentId, appId, {
            scope: scope.scope,
            queuedOnly,
          });
        },
        async progress(deploymentId, appId) {
          if (
            pendingDeployments.get(deploymentId)?.appId === appId &&
            capacityWaiting.has(deploymentId)
          )
            return { state: 'queued', queueAhead: 0, cancellable: true };
          return (await management()).deploymentProgress(deploymentId, appId, {
            scope: scope.scope,
          });
        },
        async apply(spec, onEvent) {
          const pending = {
            appId: spec.appId,
            submitted: false,
            cancelled: false,
            abortController: new AbortController(),
          };
          pendingDeployments.set(spec.deploymentId, pending);
          let sequence = 0;
          const forward = (
            entry: Parameters<NonNullable<typeof onEvent>>[0],
          ): void => {
            onEvent?.({ ...entry, sequence: ++sequence });
          };
          try {
            const submit = (retryCapacity: boolean): Promise<HostStatus> =>
              tracked(scope, async () => {
                const service = await management();
                if (pending.cancelled)
                  throw Object.assign(new Error('Deployment cancelled.'), {
                    code: 'DEPLOYMENT_CANCELLED',
                  });
                pending.submitted = true;
                const status = await service.applyDeployment(
                  {
                    ...toHostSpec(scope, spec, 'running', 'eager'),
                    scope: scope.scope,
                    ...(retryCapacity ? { retryCapacity: true } : {}),
                  },
                  onEvent ? forward : undefined,
                );
                if (
                  status.deployments.some(
                    (deployment) =>
                      deployment.appId === spec.appId &&
                      deployment.observedState !== 'failed',
                  )
                )
                  countChurn(scope);
                return status;
              });
            let status = await submit(false);
            const capacity =
              status.deployments.find(
                (deployment) => deployment.appId === spec.appId,
              )?.errorCode === 'APP_CAPACITY_EXCEEDED';
            if (capacity && scope.host === inProcess) {
              pending.submitted = false;
              capacityWaiting.add(spec.deploymentId);
              forward({
                phase: 'queued',
                msg: 'Waiting for Host memory recycling',
                queueAhead: 0,
                cancellable: true,
              });
              try {
                if (await recycleForCapacity(pending.abortController.signal)) {
                  capacityWaiting.delete(spec.deploymentId);
                  status = await submit(true);
                }
              } finally {
                capacityWaiting.delete(spec.deploymentId);
              }
              if (pending.cancelled)
                throw Object.assign(new Error('Deployment cancelled.'), {
                  code: 'DEPLOYMENT_CANCELLED',
                });
            }
            const deployed = status.deployments.find(
              (deployment) => deployment.appId === spec.appId,
            );
            if (!deployed)
              return failed(spec, 'The Host did not report the deployment.');
            scope.desiredAppIds.add(spec.appId);
            return outcomeOf(deployed, spec.deploymentId);
          } catch (error) {
            if ((error as { code?: string }).code === 'DEPLOYMENT_CANCELLED')
              return {
                ...failed(spec, 'Deployment cancelled.'),
                state: 'cancelled',
              };
            return failed(
              spec,
              error instanceof Error ? error.message : String(error),
            );
          } finally {
            pendingDeployments.delete(spec.deploymentId);
          }
        },
        async start(spec) {
          await tracked(scope, async () =>
            (await management()).startDeployment({
              ...toHostSpec(scope, spec, 'running'),
              scope: scope.scope,
            }),
          );
          return await statusOf(spec.appId);
        },
        async stop(appId) {
          await tracked(scope, async () =>
            (await management()).stopDeployment(appId),
          );
          return await statusOf(appId);
        },
        async restart(appId) {
          await tracked(scope, async () =>
            (await management()).restartApp(appId),
          );
          return await statusOf(appId);
        },
        async remove(appId, { purgeData }) {
          await tracked(scope, async () => {
            await (await management()).removeDeployment(appId, { purgeData });
            scope.desiredAppIds.delete(appId);
            countChurn(scope);
          });
        },
        async status(appIds) {
          const status = await (
            await management()
          ).getStatus({
            scope: environment.id,
            ...(appIds ? { appIds: [...appIds] } : {}),
          });
          const result = new Map<string, AppObservedStatus>();
          for (const deployment of status.deployments)
            result.set(deployment.appId, observed(deployment));
          // A failed restore left these Apps off the Host until a background retry succeeds.
          if (scope.restoreFailed && !scope.restoring && appIds)
            for (const appId of appIds)
              if (!result.has(appId))
                result.set(appId, {
                  state: 'failed',
                  version: null,
                  deploymentId: null,
                  startedAt: null,
                  error: UNRESTORED_APP_ERROR,
                  unrestored: true,
                });
          if ((scope.restoring || !status.scope) && appIds)
            for (const appId of appIds)
              if (!result.has(appId))
                result.set(appId, {
                  state: 'pending',
                  version: null,
                  deploymentId: null,
                  startedAt: null,
                  error: null,
                });
          return result;
        },
        async restore() {
          await tracked(scope, async () => {
            await host.controller.ensureStarted();
            await scheduleRestore(scope);
          });
        },
        async reloadConfig(appId, content) {
          await tracked(scope, async () =>
            (await management()).publishAppConfig(appId, content),
          );
        },
        async occupancy(): Promise<HostOccupancy | null> {
          if (host !== inProcess) return null;
          // The unfiltered status: every scope sharing the process, and Apps deployed without one.
          const status = await (await management()).getStatus();
          const failedScopes = [...scopes.values()].filter(
            (other) =>
              other.host === inProcess &&
              other.restoreFailed &&
              !other.restoring,
          );
          const present = new Set(
            status.deployments.map(
              (deployment) =>
                `${deployment.scopeId ?? ''}\u0000${deployment.appId}`,
            ),
          );
          // A failed restore leaves an environment's Apps off the Host until a background retry succeeds: they are
          // still deployed, and failed, as `status()` reports them. Apps still on the Host keep their own state.
          const missing = failedScopes.flatMap((other) =>
            [...other.desiredAppIds]
              .filter(
                (appId) => !present.has(`${other.environmentId}\u0000${appId}`),
              )
              .map((appId) => ({
                state: 'failed' as const,
                version: null,
                deploymentId: null,
                startedAt: null,
                error: UNRESTORED_APP_ERROR,
                unrestored: true as const,
                appId,
                environmentId: other.environmentId,
              })),
          );
          return {
            id: IN_PROCESS_BACKEND,
            memory: status.counters?.memory ?? null,
            recycling:
              restartScheduled ||
              readyRestoring ||
              inProcess.controller.getInfo().status !== 'ready'
                ? 'restarting'
                : rotationSince !== null || status.counters?.rotationPending
                  ? 'pending'
                  : null,
            apps: [
              ...status.deployments.map((deployment) => ({
                ...observed(deployment),
                appId: deployment.appId,
                environmentId: deployment.scopeId ?? null,
              })),
              ...missing,
            ],
            failedEnvironments: failedScopes.map((other) => ({
              environmentId: other.environmentId,
              error: other.restoreError,
            })),
          };
        },
        async logs(appId: string, query: JournalQuery): Promise<JournalPage> {
          return await (await management()).readAppLogs(appId, query);
        },
        async operation({ deploymentId, appId }) {
          const result = await (
            await management()
          ).getOperation(deploymentId, { scope: scope.scope });
          if (!result || result.appId !== appId) return null;
          return operationOutcome(result);
        },
        url(appId) {
          if (environment.publicUrl)
            return expandPublicUrl(environment.publicUrl, appId);
          if (host.publicUrl) return publicUrlOf(host.publicUrl, appId);
          const base = host.controller.getInfo().targetUrl;
          if (!base) return null;
          return `${base.replace(/\/+$/, '')}/${encodeURIComponent(appId)}/`;
        },
        close() {
          if (scopes.get(environment.id) === scope)
            scopes.delete(environment.id);
          return Promise.resolve();
        },
      };
    },
  };
}

/** A Host's App status as the plugin reports it. */
function observed(item: HostDeploymentStatus): AppObservedStatus {
  const active = item.app?.state === 'active';
  const lifecycle = item.lifecycle?.state;
  return {
    state: active
      ? 'running'
      : item.observedState !== 'failed' &&
          (lifecycle === 'starting' || lifecycle === 'dormant')
        ? lifecycle
        : item.observedState,
    version: item.version ?? item.app?.desiredVersion ?? null,
    deploymentId: item.operationId ?? null,
    startedAt: item.app?.createdAt ?? null,
    error: active
      ? (item.app?.lastError ?? null)
      : (item.error ??
        item.app?.lastError ??
        item.lifecycle?.lastFailure?.error ??
        null),
    lastAccessedAt: item.lifecycle?.lastAccessedAt ?? null,
    ...(item.lifecycle?.holds?.length ? { holds: item.lifecycle.holds } : {}),
    ...(item.lifecycle?.waiting && !active
      ? { waiting: item.lifecycle.waiting }
      : {}),
  };
}

/** How a deployment ended, as the plugin records it: `running` succeeded, anything else failed. */
function outcomeOf(
  item: HostDeploymentStatus,
  deploymentId: string,
): AppObservedStatus {
  const status = observed(item);
  // A start-first replacement that failed leaves the previous runtime active, so the deployment's own error comes first.
  if (item.observedState === 'failed')
    return {
      ...status,
      state: 'failed',
      deploymentId,
      error: item.errorCode
        ? `[${item.errorCode}] ${item.error ?? status.error ?? 'The deployment failed.'}`
        : (item.error ?? status.error ?? 'The deployment failed.'),
      ...(item.errorCode ? { errorCode: item.errorCode } : {}),
    };
  return { ...status, state: 'running', deploymentId, error: null };
}

function operationOutcome(result: HostOperation): AppObservedStatus {
  if (result.state === 'succeeded')
    return {
      state: 'running',
      version: result.status?.version ?? null,
      deploymentId: result.operationId,
      startedAt: result.status?.app?.createdAt ?? null,
      error: null,
      lastAccessedAt: result.status?.lifecycle?.lastAccessedAt ?? null,
    };
  return {
    state: result.state === 'cancelled' ? 'cancelled' : 'failed',
    ...(result.status?.errorCode ? { errorCode: result.status.errorCode } : {}),
    version: result.status?.version ?? null,
    deploymentId: result.operationId,
    startedAt: null,
    error:
      (result.state === 'interrupted'
        ? 'Deployment was interrupted by a restart. Deploy the release again.'
        : result.error) ??
      (result.state === 'running'
        ? `The deployment of ${result.appId} has not finished on the Host.`
        : 'The deployment failed.'),
  };
}

function failed(spec: AppDeploymentSpec, error: string): AppObservedStatus {
  return {
    state: 'failed',
    version: spec.release.version,
    deploymentId: spec.deploymentId,
    startedAt: null,
    error,
  };
}

/** A Host's default public URL for an App: a pattern with `{appId}`, or a base the App's path is added to. */
function publicUrlOf(base: string, appId: string): string {
  if (base.includes('{appId}')) return expandPublicUrl(base, appId);
  return `${base.replace(/\/+$/, '')}/${encodeURIComponent(appId)}/`;
}

/** The App's own host name, when the environment's URL pattern puts `{appId}` in the host: subdomain routing. */
function subdomainOf(pattern: string | null, appId: string): string | null {
  if (!pattern || !/^https?:\/\//.test(pattern)) return null;
  try {
    const url = new URL(pattern.replaceAll('{appId}', 'app-id-placeholder'));
    if (!url.hostname.includes('app-id-placeholder')) return null;
    return url.hostname.replace('app-id-placeholder', appId.toLowerCase());
  } catch {
    return null;
  }
}

function unionCapabilities(
  list: readonly DriverCapabilities[],
): DriverCapabilities {
  return {
    onDemand: list.some((item) => item.onDemand === true),
    logs: list.some((item) => item.logs),
    urlModes: [...new Set(list.flatMap((item) => item.urlModes))],
    images: list.some((item) => item.images === true),
  };
}

/** What a Host child's configuration file holds; see `writeHostConfig`. */
export interface HostConfigFile {
  readonly memoryBudget?: import('@nocobase/app-host/registry').AppMemoryBudget;
  readonly maxActiveApps?: number;
  readonly artifact: AppDriveDiskConfig;
  readonly appVolumesDir: string;
  readonly appRevisionsDir?: string;
  /** Where the Host records deployment outcomes. */
  readonly controlDir?: string;
  readonly logging?: LoggingConfig;
  /** How often the Host stops idle Apps and makes Apps dormant, in seconds (60 by default). */
  readonly sweepIntervalSeconds?: number;
  readonly activationHoldMs?: number;
  readonly activationWaitMs?: number;
  /** Host-wide settings of the Host's backends (`host.backends.<name>`). */
  readonly backends?: Readonly<Record<string, Record<string, unknown>>>;
}

/** Writes a managed Host child's configuration file (`AppHostSupervisor` `configPath`) before it starts. */
export async function writeHostConfig(
  configPath: string,
  config: HostConfigFile,
): Promise<void> {
  await writeTextAtomic(
    configPath,
    stringifyYaml({
      host: {
        mode: 'managed',
        ...(config.memoryBudget ? { memoryBudget: config.memoryBudget } : {}),
        ...(config.maxActiveApps !== undefined
          ? { maxActiveApps: config.maxActiveApps }
          : {}),
        ...(config.logging ? { logging: config.logging } : {}),
        server: { host: '127.0.0.1', port: 3000 },
        artifact:
          config.artifact.driver === 'fs'
            ? {
                ...config.artifact,
                location: path.resolve(config.artifact.location),
              }
            : config.artifact,
        ...(config.appRevisionsDir
          ? { appRevisionsDir: config.appRevisionsDir }
          : {}),
        appVolumesDir: config.appVolumesDir,
        ...(config.controlDir ? { controlDir: config.controlDir } : {}),
        // Each App carries its own idle policy; one without stays up.
        idleTtlMs: 0,
        evictionIntervalMs: (config.sweepIntervalSeconds ?? 60) * 1000,
        ...(config.activationHoldMs !== undefined
          ? { activationHoldMs: config.activationHoldMs }
          : {}),
        ...(config.activationWaitMs !== undefined
          ? { activationWaitMs: config.activationWaitMs }
          : {}),
        ...(config.backends ? { backends: config.backends } : {}),
      },
    }),
  );
}
