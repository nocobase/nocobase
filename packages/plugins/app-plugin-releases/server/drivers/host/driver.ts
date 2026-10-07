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
import {
  expandPublicUrl,
  type AppDeploymentSpec,
  type AppObservedStatus,
  type DeploymentDriver,
  type DriverCapabilities,
  type DriverContext,
  type DriverEnvironment,
  type DriverSession,
  type RegistryAuth,
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
  restart?(reason?: string): Promise<URL>;
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
   * requested. The restart waits while an on-demand App is running. Off when omitted.
   */
  readonly restartAfterChurn?: number;
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
  /** The on-demand Apps: a Host restart waits while one of them runs. */
  readonly onDemand: Set<string>;
  restoring: Promise<void> | null;
}

export function createHostDriver(
  options: HostDriverOptions,
): HostDeploymentDriver {
  const diagnostic = createDiagnosticLogger(options.logger);
  const inProcess = options.hosts[IN_PROCESS_BACKEND];
  if (!inProcess) throw new Error('The Host driver needs the in-process Host.');
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
  let churnTimer: NodeJS.Timeout | null = null;

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

  const track = (scope: OpenScope, spec: AppDeploymentSpec): void => {
    if (spec.activation === 'onDemand') scope.onDemand.add(spec.appId);
    else scope.onDemand.delete(spec.appId);
  };

  /** Sends one environment's complete desired set as a new revision of its scope. */
  const sendSet = async (scope: OpenScope): Promise<void> => {
    const management = await managementOf(scope.host);
    const specs = await scope.desired();
    for (const spec of specs) track(scope, spec);
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
    const current = sendSet(scope)
      .catch((error: unknown) =>
        diagnostic.error(
          `Failed to restore the Apps of environment ${scope.environmentId}`,
          error,
        ),
      )
      .finally(() => {
        if (scope.restoring === current) scope.restoring = null;
      });
    scope.restoring = current;
    return current;
  };

  const restoreHost = async (host: HostEndpointOptions): Promise<void> => {
    for (const scope of scopes.values())
      if (scope.host === host) await scheduleRestore(scope);
  };

  const watchReady = (host: HostEndpointOptions): void => {
    if (watched.has(host)) return;
    watched.add(host);
    host.controller.onReady(() => {
      void restoreHost(host);
    });
  };

  // --- Recycling the in-process Host (`restartAfterChurn`) ---------------------------------------------------------

  /** Each of the Host's open scopes with its status. */
  const statusesOf = async (
    host: HostEndpointOptions,
  ): Promise<readonly (readonly [OpenScope, HostStatus])[]> => {
    const management = await managementOf(host);
    return await Promise.all(
      [...scopes.values()]
        .filter((scope) => scope.host === host)
        .map(
          async (scope) =>
            [
              scope,
              await management.getStatus({ scope: scope.environmentId }),
            ] as const,
        ),
    );
  };

  const restartHost = async (reason: string): Promise<void> => {
    const { controller } = inProcess;
    if (!controller.restart)
      throw new Error('This Host runtime cannot be restarted by the driver.');
    restartScheduled ??= (async () => {
      try {
        await controller.restart!(reason);
        churn = 0;
        runtimeChurn = 0;
        await restoreHost(inProcess);
      } finally {
        restartScheduled = null;
      }
    })();
    await restartScheduled;
  };

  /** Whether an on-demand App runs or starts, which a restart would cut off. */
  const onDemandBusy = (
    statuses: readonly (readonly [OpenScope, HostStatus])[],
  ): boolean =>
    statuses.some(([scope, status]) =>
      status.deployments.some((deployment) => {
        const state = observed(deployment).state;
        return (
          scope.onDemand.has(deployment.appId) &&
          (state === 'running' || state === 'starting')
        );
      }),
    );

  /**
   * Restarts the in-process Host when the churn reached `restartAfterChurn`, nothing is in flight and no on-demand App
   * is in use; otherwise a later check tries again.
   */
  const maybeRestart = async (): Promise<void> => {
    const limit = inProcess.restartAfterChurn;
    const { controller } = inProcess;
    if (!limit || !controller.restart || restartScheduled) return;
    if (controller.getInfo().status !== 'ready') return;
    const statuses = await statusesOf(inProcess).catch(() => null);
    const counters = statuses?.find(([, status]) => status.counters)?.[1]
      .counters;
    if (counters)
      runtimeChurn = (counters.idleStops ?? 0) + (counters.dormancies ?? 0);
    const total = churn + runtimeChurn;
    if (total < limit || inFlight > 0) return;
    if (statuses && onDemandBusy(statuses)) return;
    await restartHost(
      `${total} applications replaced, removed, stopped or made dormant`,
    );
  };

  const checkChurn = (): void => {
    void maybeRestart().catch((error: unknown) =>
      diagnostic.error('Failed to restart the App Host', error),
    );
  };

  const countChurn = (scope: OpenScope): void => {
    if (scope.host !== inProcess) return;
    churn += 1;
    checkChurn();
  };

  const watchChurn = (): void => {
    if (churnTimer || !inProcess.restartAfterChurn) return;
    churnTimer = setInterval(
      checkChurn,
      options.churnCheckIntervalMs ?? 60_000,
    );
    churnTimer.unref?.();
  };

  const tracked = async <T>(
    scope: OpenScope,
    work: () => Promise<T>,
  ): Promise<T> => {
    if (scope.host !== inProcess) return await work();
    if (restartScheduled) await restartScheduled.catch(() => undefined);
    inFlight += 1;
    try {
      return await work();
    } finally {
      inFlight -= 1;
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
        onDemand: new Set(),
        restoring: null,
      };
      scopes.set(environment.id, scope);
      watchReady(host);
      const management = () => managementOf(host);
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

      return {
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
        async apply(spec, onEvent) {
          track(scope, spec);
          let replacing = false;
          try {
            const status = await tracked(scope, async () => {
              const service = await management();
              const before = await service
                .getStatus({ scope: environment.id, appIds: [spec.appId] })
                .catch(() => null);
              replacing = Boolean(
                before?.deployments.some(
                  (deployment) => deployment.app?.state === 'active',
                ),
              );
              // A deployment always starts the App once, so it proves the release runs.
              return await service.applyDeployment(
                {
                  ...toHostSpec(scope, spec, 'running', 'eager'),
                  scope: scope.scope,
                },
                onEvent ? (entry) => onEvent(entry) : undefined,
              );
            });
            if (replacing) countChurn(scope);
            const deployed = status.deployments.find(
              (deployment) => deployment.appId === spec.appId,
            );
            if (!deployed)
              return failed(spec, 'The Host did not report the deployment.');
            return outcomeOf(deployed, spec.deploymentId);
          } catch (error) {
            return failed(
              spec,
              error instanceof Error ? error.message : String(error),
            );
          }
        },
        async start(spec) {
          track(scope, spec);
          await (
            await management()
          ).startDeployment({
            ...toHostSpec(scope, spec, 'running'),
            scope: scope.scope,
          });
          return await statusOf(spec.appId);
        },
        async stop(appId) {
          await (await management()).stopDeployment(appId);
          return await statusOf(appId);
        },
        async restart(appId) {
          await (await management()).restartApp(appId);
          return await statusOf(appId);
        },
        async remove(appId, { purgeData }) {
          await tracked(scope, async () =>
            (await management()).removeDeployment(appId, { purgeData }),
          );
          scope.onDemand.delete(appId);
          countChurn(scope);
        },
        async status(appIds) {
          if (scope.restoring)
            await Promise.race([scope.restoring, delay(5_000)]);
          const status = await (
            await management()
          ).getStatus({
            scope: environment.id,
            ...(appIds ? { appIds: [...appIds] } : {}),
          });
          const result = new Map<string, AppObservedStatus>();
          for (const deployment of status.deployments)
            result.set(deployment.appId, observed(deployment));
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
          await host.controller.ensureStarted();
          await scheduleRestore(scope);
        },
        async reloadConfig(appId, content) {
          await (await management()).publishAppConfig(appId, content);
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
      error: item.error ?? status.error ?? 'The deployment failed.',
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
    state: 'failed',
    version: result.status?.version ?? null,
    deploymentId: result.operationId,
    startedAt: null,
    error:
      result.error ??
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms).unref?.();
  });
}

/** What a Host child's configuration file holds; see `writeHostConfig`. */
export interface HostConfigFile {
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
