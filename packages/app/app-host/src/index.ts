/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import type { Duplex } from 'node:stream';
import path from 'node:path';
import { createDriveManager, type AppDriveDiskConfig } from '@nocobase/drive';
import {
  createLogging,
  type Logger,
  type Logging,
  type LoggingConfig,
} from '@nocobase/logging';
import { AppRegistryError } from './errors.ts';
import {
  applyFetchResponse,
  isClientResponseClose,
  requestPath,
  toFetchRequest,
} from './http-adapter.ts';
import {
  DriveArtifactResolver,
  type ArtifactResolver,
} from './artifact-resolver.ts';
import { AppModuleLoader, DeploymentCatalog } from './deployment/index.ts';
import { loadAppHostConfig, type AppHostConfig } from './host-config.ts';
import { resolveAppHostMode, type AppHostMode } from './host-mode.ts';
import { AppRuntimeRegistry } from './app-registry.ts';
import type { AppActivationBackend, AppDefinition } from './app-types.ts';
import {
  FileOperationLog,
  HostManager,
  type HostManagementService,
  IpcHostManagementServer,
  type OperationLog,
} from './management/index.ts';
import { assertBackendSeparation } from './service-backend.ts';
import {
  activateForRequest,
  activateForUpgrade,
  DEFAULT_ACTIVATION_HOLD_MS,
  DEFAULT_ACTIVATION_WAIT_MS,
  type OnDemandActivationOptions,
} from './on-demand.ts';
import {
  getPathInsideApp,
  isAppAssetPath,
  serveAppAssets,
} from './static-client.ts';
import {
  acceptWebSocketUpgrade,
  isWebSocketUpgrade,
  rejectWebSocketUpgrade,
} from '@nocobase/app-websocket';

export * from './errors.ts';
export * from './events.ts';
export * from './http-adapter.ts';
export * from './host-mode.ts';
export * from './host-config.ts';
export * from './in-process-backend.ts';
export * from './deployment/index.ts';
export * from './artifact-resolver.ts';
export * from './app-registry.ts';
export * from './in-process-app-handle.ts';
export * from './static-client.ts';
export * from './app-types.ts';
export * from './management/index.ts';
export * from './on-demand.ts';
export * from './service-backend.ts';
export { runAppHostCli } from './run.ts';
export { deploymentLog } from './deployment-log.js';

/** What the Host offers the backends it is started with. */
export interface AppHostBackendServices {
  readonly logger: Logger;
  /** The Host configuration it was started with, when it was started from one (`startAppHostFromEnv`). */
  readonly config?: AppHostConfig;
}

export interface AppHostOptions {
  mode?: AppHostMode;
  port?: number;
  host?: string;
  appRevisionsDir?: string;
  appVolumesDir?: string;
  artifact?: AppDriveDiskConfig;
  artifactResolver?: ArtifactResolver;
  logging?: LoggingConfig;
  /**
   * The backends Apps run on; in-process only by default. A list replaces the default, so a Host for an
   * external-service backend runs no App code itself; a function receives what the Host offers backends.
   */
  backends?:
    | AppActivationBackend[]
    | ((services: AppHostBackendServices) => AppActivationBackend[]);
  /**
   * Every in-process App is trusted, so the Host may run them beside a backend holding platform credentials (a Docker
   * socket). Without it such a Host is refused: App code in its process could use those credentials.
   */
  trustedApps?: boolean;
  /** Where a managed Host records deployment outcomes (`getOperation`); in memory when omitted. */
  operations?: OperationLog;
  maxActiveApps?: number;
  idleTtlMs?: number;
  evictionIntervalMs?: number;
  /** How long a page request to a stopped App waits before it gets the starting page (1500 ms by default). */
  activationHoldMs?: number;
  /** How long other requests to a stopped App wait for it (60 s by default). */
  activationWaitMs?: number;
}

export interface AppHost {
  readonly mode: AppHostMode;
  readonly deploymentCatalog: DeploymentCatalog;
  readonly artifactResolver: ArtifactResolver;
  readonly management: HostManagementService;
  readonly logger: Logger;
  readonly logging: Logging;
  readonly registry: AppRuntimeRegistry;
  readonly server: Server;
  start(): Promise<void>;
  close(reason?: string): Promise<void>;
}

export function createAppHost(options: AppHostOptions = {}): AppHost {
  const mode = resolveAppHostMode(options.mode);
  const logging = createLogging(
    options.logging ?? {
      level: 'info',
      base: { service: 'app-host' },
    },
  );
  const logger = logging.getLogger('host');
  const deploymentCatalog = new DeploymentCatalog({
    deploymentsDir: options.appRevisionsDir,
    volumesDir: options.appVolumesDir,
  });
  const moduleLoader = new AppModuleLoader();
  const artifact = options.artifact ?? {
    driver: 'fs',
    location: path.resolve(process.cwd(), 'storage', 'apps', 'artifacts'),
    visibility: 'private',
  };
  const drive = createDriveManager({
    default: 'artifact',
    disks: { artifact },
  });
  const artifactResolver =
    options.artifactResolver ??
    new DriveArtifactResolver(drive.use('artifact'), deploymentCatalog, {
      appRevisionsDir: deploymentCatalog.deploymentsDir,
      localArtifactDir:
        artifact.driver === 'fs' ? artifact.location : undefined,
      logger: logger.child({ component: 'artifact-resolver' }),
      expandedRevisionLimit: mode === 'managed' ? 3 : undefined,
    });
  const backendServices: AppHostBackendServices = {
    logger: logger.child({ component: 'app-backend' }),
  };
  const backends =
    typeof options.backends === 'function'
      ? options.backends(backendServices)
      : options.backends;
  // Without a list the Host runs in-process Apps only.
  if (backends) assertBackendSeparation(backends, options.trustedApps);
  const registry = new AppRuntimeRegistry({
    resolveFactory: (definition) => moduleLoader.resolveFactory(definition),
    backends,
    maxActiveApps: options.maxActiveApps,
    idleTtlMs: options.idleTtlMs,
    evictionIntervalMs: options.evictionIntervalMs,
    logger: logger.child({ component: 'app-runtime' }),
  });
  attachAppEventLogs(registry, logger);
  const onDemand: OnDemandActivationOptions = {
    holdMs: options.activationHoldMs ?? DEFAULT_ACTIVATION_HOLD_MS,
    waitMs: options.activationWaitMs ?? DEFAULT_ACTIVATION_WAIT_MS,
  };
  const manager = new HostManager({
    logger,
    mode,
    registry,
    deploymentCatalog,
    artifactResolver,
    operations: options.operations,
  });

  const handleRequest = async (
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> => {
    try {
      const path = requestPath(req);
      const managementResponse = await managementApi(
        req,
        path,
        mode,
        manager,
        registry,
        deploymentCatalog,
        artifactResolver,
      );
      if (managementResponse) {
        await applyFetchResponse(res, managementResponse);
        return;
      }

      const appId = resolveAppId(path, registry, req.headers.host);
      if (appId) {
        const definition = registry.definition(appId);

        if (!definition) {
          await applyFetchResponse(res, notFoundResponse());
          return;
        }

        // An App served elsewhere (an external service) gets every request as it arrived, assets included.
        if (servedElsewhere(registry, definition)) {
          const runtime = await activateForRequest(
            registry,
            appId,
            req,
            onDemand,
          );
          if (runtime instanceof Response)
            await applyFetchResponse(res, runtime);
          else await runtime.forward!(req, res);
          return;
        }

        const pathInside = getPathInsideApp(definition, path);

        if (isAppAssetPath(pathInside)) {
          // A dormant App's assets are gone with its expanded release: prepare it again first.
          registry.touch(appId);
          await registry.prepare(appId);
          const assetResponse = await serveAppAssets(
            definition,
            req,
            pathInside,
          );
          await applyFetchResponse(res, assetResponse ?? notFoundResponse());
          return;
        }

        const response = definition.server
          ? await dispatchAppServer(req, path, registry, appId, onDemand)
          : notFoundResponse();
        await applyFetchResponse(res, response);
        return;
      }

      await applyFetchResponse(res, notFoundResponse());
    } catch (error) {
      if (isClientResponseClose(error, res)) {
        return;
      }

      try {
        await handleError(error, res, logger);
      } catch (handleErrorError) {
        if (!isClientResponseClose(handleErrorError, res)) {
          logger.error(
            { err: handleErrorError },
            'Failed to handle request error',
          );
        }

        if (!res.destroyed) {
          res.destroy(
            handleErrorError instanceof Error
              ? handleErrorError
              : new Error(String(handleErrorError)),
          );
        }
      }
    }
  };

  const server = createServer((req, res) => {
    const requestPromise = handleRequest(req, res);
    requestPromise.catch((error: unknown) => {
      logger.error({ err: error }, 'Unhandled request error');
      if (!res.destroyed) {
        res.destroy(error instanceof Error ? error : new Error(String(error)));
      }
    });
  });

  server.on('upgrade', (req, socket, head) => {
    const upgradePromise = dispatchAppWebSocket(
      req,
      socket,
      head,
      registry,
      onDemand,
    );
    upgradePromise.catch((error: unknown) => {
      logger.error({ err: error }, 'WebSocket upgrade failed');
      rejectWebSocketUpgrade(
        socket,
        error instanceof AppRegistryError ? error.status : 500,
      );
    });
  });

  return {
    mode,
    deploymentCatalog,
    artifactResolver,
    logger,
    logging,
    management: manager,
    registry,
    server,
    async start() {
      const discoveredApps = await manager.initialize();
      await new Promise<void>((resolve) => {
        server.listen(
          options.port ?? 3000,
          options.host ?? '127.0.0.1',
          resolve,
        );
      });

      const address = server.address();
      const bind =
        typeof address === 'object' && address
          ? `${address.address}:${address.port}`
          : String(address);
      logger.info({ bind, mode }, 'App host started');
      if (mode === 'standalone') {
        logger.info(
          {
            deploymentsDir: deploymentCatalog.deploymentsDir,
            discoveredApps:
              discoveredApps?.registered.map((app) => app.id) ?? [],
          },
          'Standalone deployments discovered',
        );
      }
    },
    async close(reason = 'host shutdown') {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ERR_SERVER_NOT_RUNNING') {
          throw error;
        }
      });

      await manager.persistLifecycleState().catch((error: unknown) => {
        logger.warn({ err: error }, 'Failed to record app lifecycle state');
      });
      // An external service keeps running for the next Host to take over; in-process runtimes are destroyed.
      await registry.releaseAll(reason);
      await logging.close();
    },
  };
}

async function dispatchAppServer(
  req: IncomingMessage,
  path: string,
  registry: AppRuntimeRegistry,
  appId: string,
  onDemand: OnDemandActivationOptions,
): Promise<Response> {
  const runtime = await activateForRequest(registry, appId, req, onDemand);
  if (runtime instanceof Response) return runtime;
  const request = toFetchRequest(req, {
    basePath: runtime.basePath,
    signal: runtime.signal,
  });
  return runtime.dispatch(request, {
    method: req.method,
    path,
  });
}

async function dispatchAppWebSocket(
  req: IncomingMessage,
  socket: Duplex,
  head: Buffer,
  registry: AppRuntimeRegistry,
  onDemand: OnDemandActivationOptions,
): Promise<void> {
  if (!isWebSocketUpgrade(req)) {
    rejectWebSocketUpgrade(socket, 400);
    return;
  }

  const path = requestPath(req);
  const appId = resolveAppId(path, registry, req.headers.host);
  if (!appId) {
    rejectWebSocketUpgrade(socket, 404);
    return;
  }

  const definition = registry.definition(appId);
  if (definition && servedElsewhere(registry, definition)) {
    const runtime = await activateForUpgrade(registry, appId, onDemand);
    if (!runtime?.forwardUpgrade) {
      rejectWebSocketUpgrade(socket, 503, new Headers({ 'retry-after': '2' }));
      return;
    }
    await runtime.forwardUpgrade(req, socket, head);
    return;
  }
  if (!definition?.server) {
    rejectWebSocketUpgrade(socket, 404);
    return;
  }

  const pathInside = getPathInsideApp(definition, path);
  if (isAppAssetPath(pathInside)) {
    rejectWebSocketUpgrade(socket, 404);
    return;
  }

  const runtime = await activateForUpgrade(registry, appId, onDemand);
  if (!runtime) {
    rejectWebSocketUpgrade(socket, 503, new Headers({ 'retry-after': '2' }));
    return;
  }
  const request = toFetchRequest(req, {
    basePath: runtime.basePath,
    signal: runtime.signal,
  });
  const result = await runtime.acceptWebSocket(request, {
    method: req.method,
    path,
  });

  if (result instanceof Response) {
    rejectWebSocketUpgrade(socket, result.status, result.headers);
    return;
  }

  if (!result) {
    rejectWebSocketUpgrade(socket, 404);
    return;
  }

  acceptWebSocketUpgrade(req, socket, {
    request,
    events: result,
    head,
    signal: runtime.signal,
  });
}

export interface StartAppHostOptions {
  /**
   * The backends this Host runs Apps on, instead of in-process (see `AppHostOptions.backends`): an executable for a
   * Host with an external-service backend passes its own.
   */
  backends?: (services: AppHostBackendServices) => AppActivationBackend[];
}

export async function startAppHostFromEnv(
  options: StartAppHostOptions = {},
): Promise<AppHost> {
  const config = await loadAppHostConfig();
  // A managed Host records deployment outcomes where they outlive it (`getOperation`), next to its revisions.
  const operations =
    config.mode === 'managed' && config.controlDir
      ? new FileOperationLog(config.controlDir)
      : undefined;
  const host = createAppHost({
    mode: config.mode,
    port: config.server.port,
    host: config.server.host,
    appRevisionsDir: config.appRevisionsDir,
    appVolumesDir: config.appVolumesDir,
    artifact: config.artifact,
    maxActiveApps: config.maxActiveApps,
    idleTtlMs: config.idleTtlMs,
    evictionIntervalMs: config.evictionIntervalMs,
    activationHoldMs: config.activationHoldMs,
    activationWaitMs: config.activationWaitMs,
    logging: config.logging,
    trustedApps: config.trustedApps,
    operations,
    ...(options.backends
      ? {
          backends: (services: AppHostBackendServices) =>
            options.backends!({ ...services, config }),
        }
      : {}),
  });

  if (host.mode === 'managed') {
    const session = process.env.APP_HOST_SESSION;
    if (!session) {
      throw new Error('Managed app host requires APP_HOST_SESSION');
    }
    // Waits (bounded) for a previous Host that is still finishing a deployment, and records what it left running.
    void operations?.open().catch((error: unknown) => {
      host.logger.error({ err: error }, 'Failed to open the operation log');
    });
    const ipcServer = new IpcHostManagementServer(host.management, session);
    ipcServer.attach();
    const manager = host.management as HostManager;
    const closeHost = host.close.bind(host);
    let closing: Promise<void> | null = null;
    // Closing frees the port at once, lets deployments under way finish and record their outcome (so a control plane
    // that restarts can read it with `getOperation`), then stops the Apps.
    host.close = (reason?: string): Promise<void> => {
      closing ??= (async () => {
        host.server.close();
        host.server.closeIdleConnections?.();
        await manager.drain(CONTROL_DRAIN_MS);
        ipcServer.close();
        await closeHost(reason);
      })();
      return closing;
    };
    // The supervisor relays this child's output through pipes. Once it is gone (killed, say), writing to them fails
    // with EPIPE, which must not end a Host that is still finishing a deployment and recording its outcome.
    for (const stream of [process.stdout, process.stderr])
      stream.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code !== 'EPIPE' && error.code !== 'ERR_STREAM_DESTROYED')
          throw error;
      });
    process.once('disconnect', () => {
      host
        .close('hub IPC disconnected')
        .then(() => process.exit(0))
        .catch((error: unknown) => {
          host.logger.error(
            { err: error },
            'Failed to close disconnected host',
          );
          process.exit(1);
        });
    });
  }

  await host.start();
  return host;
}

/** How long a closing managed Host waits for deployments under way; below the supervisor's 30 s shutdown timeout. */
const CONTROL_DRAIN_MS = 25_000;

function attachAppEventLogs(
  registry: AppRuntimeRegistry,
  logger: Logger,
): void {
  registry.events.on('app:createFailed', (event) => {
    logger.error(
      { ...event, err: event.error, event: 'app:createFailed' },
      'Embedded app failed to initialize',
    );
  });

  registry.events.on('app:created', (event) => {
    logger.debug({ ...event, event: 'app:created' }, 'App runtime created');
  });

  registry.events.on('app:draining', (event) => {
    logger.info({ ...event, event: 'app:draining' }, 'App runtime draining');
  });

  registry.events.on('app:resourceDisposed', (event) => {
    logger.debug(
      { ...event, event: 'app:resourceDisposed' },
      'App runtime resource disposed',
    );
  });

  registry.events.on('app:destroyed', (event) => {
    logger.info({ ...event, event: 'app:destroyed' }, 'App runtime destroyed');
  });
}

async function managementApi(
  req: IncomingMessage,
  path: string,
  mode: AppHostMode,
  manager: HostManager,
  registry: AppRuntimeRegistry,
  deploymentCatalog: DeploymentCatalog,
  artifactResolver: ArtifactResolver,
): Promise<Response | null> {
  const method = req.method ?? 'GET';

  if (
    mode === 'managed' &&
    path !== '/__live' &&
    path !== '/__ready' &&
    path !== '/__health'
  ) {
    return null;
  }

  if (method === 'GET' && path === '/__live') {
    return jsonResponse({ status: 'ok' });
  }

  if (method === 'GET' && path === '/__ready') {
    const status = await manager.getStatus();
    return jsonResponse(
      { status: status.ready ? 'ready' : 'not-ready' },
      status.ready ? {} : { status: 503 },
    );
  }

  if (mode === 'managed' && method === 'GET' && path === '/__health') {
    const status = await manager.getStatus();
    return jsonResponse(
      { status: status.ready ? 'ready' : 'not-ready' },
      status.ready ? {} : { status: 503 },
    );
  }

  if (method === 'GET' && path === '/') {
    return jsonResponse({
      message: 'Node HTTP app host',
      mode,
      packages: {
        appHost: '@nocobase/app-host',
        appRevisionsDir: deploymentCatalog.deploymentsDir,
        appVolumesDir: deploymentCatalog.volumesDir,
      },
      examples: [
        'add storage/apps/revisions/acme/dist/server/embedded.js, then call POST /__apps/rescan',
        'put hashed static files under storage/apps/revisions/acme/dist/client/assets for /acme/assets/*',
        'curl -X POST http://localhost:3000/__apps/rescan',
        'curl -X POST http://localhost:3000/__apps/acme/activate',
        'curl -X POST http://localhost:3000/__apps/acme/deploy',
        'curl -X POST http://localhost:3000/__apps/evict-idle',
        'curl http://localhost:3000/__apps/acme',
        'curl -X POST http://localhost:3000/__apps/acme/reload',
        'curl http://localhost:3000/acme/healthz',
        'curl -X DELETE http://localhost:3000/__apps/acme',
      ],
    });
  }

  if (method === 'GET' && path === '/__health') {
    return jsonResponse({
      ...registry.health(),
      mode,
      management: await manager.getStatus(),
    });
  }

  if (method === 'GET' && path === '/__apps') {
    return jsonResponse({
      active: registry.list(),
      definitions: registry.listDefinitions(),
    });
  }

  if (path === '/__apps/rescan') {
    if (method !== 'POST') {
      return methodNotAllowed('POST');
    }

    const sync = await manager.rescan();
    return jsonResponse({
      ...sync,
      active: registry.list(),
      definitions: registry.listDefinitions(),
    });
  }

  if (path === '/__apps/evict-idle') {
    if (method !== 'POST') {
      return methodNotAllowed('POST');
    }

    const evicted = await registry.evictIdle();
    return jsonResponse({ evicted });
  }

  const actionMatch = path.match(
    /^\/__apps\/([^/]+)\/(activate|deploy|evict|reload)$/,
  );
  if (actionMatch) {
    if (method !== 'POST') {
      return methodNotAllowed('POST');
    }

    const id = decodeURIComponent(actionMatch[1]);
    const action = actionMatch[2];

    if (action === 'activate') {
      return jsonResponse({
        app: await registry.ensureActive(id),
      });
    }

    if (action === 'deploy') {
      const input = await readJsonBody(req);
      const reference = input.artifact;
      if (!isArtifactReference(reference) || reference.appId !== id) {
        return jsonResponse(
          {
            error: 'Deploy requires an artifact reference matching the app ID',
          },
          { status: 400 },
        );
      }
      const artifact = await artifactResolver.resolve(reference);
      try {
        const current = registry.definition(id);
        const replacement = await registry.replaceDefinition(
          {
            ...artifact.definition,
            basePath: current?.basePath ?? artifact.definition.basePath,
            dataDir: current?.dataDir ?? artifact.definition.dataDir,
            configPath: current?.configPath ?? artifact.definition.configPath,
          },
          {
            activate: true,
            reason: 'deploy API',
            destroyTimeoutMs: numberFromValue(input.destroyTimeoutMs),
          },
        );
        await artifact.commit();
        return jsonResponse({ deployment: replacement });
      } catch (error) {
        await artifact.rollback();
        throw error;
      }
    }

    if (action === 'evict') {
      return jsonResponse({
        evicted: await registry.evict(id, { reason: 'evict API' }),
      });
    }

    return jsonResponse({
      app: await registry.reload(id, { reason: 'reload API' }),
    });
  }

  const match = path.match(/^\/__apps\/([^/]+)$/);
  if (!match) {
    return null;
  }

  const id = decodeURIComponent(match[1]);

  if (method === 'GET') {
    return jsonResponse(registry.status(id));
  }

  if (method === 'POST') {
    return jsonResponse(
      {
        error:
          'App creation through API is disabled. Add storage/apps/revisions/<app>/dist/server/embedded.js and call POST /__apps/rescan.',
      },
      {
        status: 405,
        headers: {
          allow: 'GET, DELETE',
        },
      },
    );
  }

  if (method === 'DELETE') {
    const evicted = await registry.evict(id, { reason: 'delete API' });
    return jsonResponse({ evicted }, { status: evicted ? 200 : 404 });
  }

  return methodNotAllowed('GET, DELETE');
}

function isArtifactReference(
  value: unknown,
): value is import('./artifact-resolver.ts').ArtifactReference {
  if (!value || typeof value !== 'object') return false;
  const reference = value as Record<string, unknown>;
  return (
    typeof reference.key === 'string' &&
    typeof reference.appId === 'string' &&
    typeof reference.version === 'string' &&
    typeof reference.checksum === 'string'
  );
}

/** Whether the App's runtime serves HTTP itself elsewhere and the Host forwards its requests. */
function servedElsewhere(
  registry: AppRuntimeRegistry,
  definition: AppDefinition,
): boolean {
  return registry.backendOf(definition)?.loadsAppCode === false;
}

function resolveAppId(
  path: string,
  registry: AppRuntimeRegistry,
  hostHeader?: string,
): string | null {
  // An App with its own host name answers every path there.
  const hostname = hostHeader?.replace(/:\d+$/, '').toLowerCase();
  if (hostname) {
    const byHost = registry
      .listDefinitions()
      .find((definition) => definition.hostname?.toLowerCase() === hostname);
    if (byHost) return byHost.id;
  }
  const matchingDefinition = registry
    .listDefinitions()
    .sort((a, b) => b.basePath.length - a.basePath.length)
    .find(
      (definition) =>
        path === definition.basePath ||
        path.startsWith(`${definition.basePath}/`),
    );
  if (matchingDefinition) {
    return matchingDefinition.id;
  }

  const match = parseAppPath(path);
  if (!match) {
    return null;
  }

  for (const id of match.candidates) {
    if (registry.has(id)) {
      return id;
    }
  }

  return match.candidates[0] ?? null;
}

function parseAppPath(path: string): { candidates: string[] } | null {
  const match = path.match(/^\/([^/]+)(?:\/|$)/);
  if (!match) {
    return null;
  }

  const appName = decodeURIComponent(match[1]);
  return {
    candidates: [appName],
  };
}

function notFoundResponse(): Response {
  return jsonResponse(
    {
      error: 'Not found',
      routes: [
        'GET /',
        'GET /__health',
        'GET /__apps',
        'POST /__apps/rescan',
        'POST /__apps/evict-idle',
        'GET /__apps/:id',
        'POST /__apps/:id/activate',
        'POST /__apps/:id/deploy',
        'POST /__apps/:id/evict',
        'POST /__apps/:id/reload',
        'DELETE /__apps/:id',
        'GET /:app',
      ],
    },
    { status: 404 },
  );
}

function methodNotAllowed(allow: string): Response {
  return jsonResponse(
    {
      error: 'Method not allowed',
    },
    {
      status: 405,
      headers: {
        allow,
      },
    },
  );
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

async function readJsonBody(
  req: IncomingMessage,
): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];

  for await (const streamedChunk of req) {
    const chunk: unknown = streamedChunk;
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
    } else if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
    } else {
      throw new TypeError('Request body contained an unsupported chunk type');
    }
  }

  if (chunks.length === 0) {
    return {};
  }

  const text = Buffer.concat(chunks).toString('utf8').trim();
  if (!text) {
    return {};
  }

  const value = JSON.parse(text) as unknown;
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function handleError(
  error: unknown,
  res: ServerResponse,
  logger: Logger,
): Promise<void> {
  if (!(error instanceof AppRegistryError) || error.status >= 500) {
    logger.error({ err: error }, 'Request failed');
  }

  if (res.headersSent) {
    res.destroy(error instanceof Error ? error : new Error(String(error)));
    return;
  }

  const response = jsonResponse(
    {
      error: error instanceof Error ? error.message : String(error),
      code:
        error instanceof AppRegistryError
          ? error.code
          : 'INTERNAL_SERVER_ERROR',
    },
    {
      status: error instanceof AppRegistryError ? error.status : 500,
    },
  );

  await applyFetchResponse(res, response);
}

function numberFromValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}
