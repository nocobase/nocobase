/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { PortalRegistryError } from './errors';
import { applyFetchResponse, requestPath, toFetchRequest } from './http-adapter';
import { DirectoryPortalCatalog } from './portal-catalog';
import { PortalRuntimeRegistry } from './portal-registry';
import { writePortalSystemLog } from './portal-system-log';

export interface PortalHostOptions {
  port?: number;
  host?: string;
  portalsDir?: string;
  maxActivePortals?: number;
  idleTtlMs?: number;
  evictionIntervalMs?: number;
}

export interface PortalHost {
  readonly portalCatalog: DirectoryPortalCatalog;
  readonly registry: PortalRuntimeRegistry;
  readonly server: Server;
  start(): Promise<void>;
  close(reason?: string): Promise<void>;
}

export function createPortalHost(options: PortalHostOptions = {}): PortalHost {
  const portalCatalog = new DirectoryPortalCatalog({
    portalsDir: options.portalsDir,
  });
  const registry = new PortalRuntimeRegistry({
    resolveFactory: (definition) => portalCatalog.resolveFactory(definition),
    maxActivePortals: options.maxActivePortals,
    idleTtlMs: options.idleTtlMs,
    evictionIntervalMs: options.evictionIntervalMs,
  });

  const server = createServer(async (req, res) => {
    try {
      const path = requestPath(req);
      const managementResponse = await managementApi(req, path, registry, portalCatalog);
      if (managementResponse) {
        await applyFetchResponse(res, managementResponse);
        return;
      }

      const portalId = resolvePortalId(path, registry);
      if (portalId) {
        const runtime = await registry.ensureActiveHandle(portalId);
        const request = toFetchRequest(req, runtime);
        const response = await runtime.dispatch(request, {
          method: req.method,
          path,
        });
        await applyFetchResponse(res, response);
        return;
      }

      await applyFetchResponse(res, notFoundResponse());
    } catch (error) {
      await handleError(error, res);
    }
  });

  return {
    portalCatalog,
    registry,
    server,
    async start() {
      const discoveredPortals = await portalCatalog.registerDiscovered(registry);
      attachPortalEventLogs(registry);

      await new Promise<void>((resolve) => {
        server.listen(options.port ?? 3000, options.host ?? '127.0.0.1', resolve);
      });

      const address = server.address();
      const bind = typeof address === 'object' && address ? `${address.address}:${address.port}` : String(address);
      console.log(`Portal host listening on http://${bind}`);
      console.log(`Portal directory: ${portalCatalog.portalsDir}`);
      console.log(
        `Discovered ${discoveredPortals.length} portal(s): ${
          discoveredPortals.map((portal) => portal.id).join(', ') || '(none)'
        }`,
      );
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

      await registry.destroyAll(reason);
    },
  };
}

export async function startPortalHostFromEnv(): Promise<PortalHost> {
  const host = createPortalHost({
    port: numberFromEnv('PORT') ?? numberFromEnv('PORTAL_HOST_PORT') ?? 3000,
    host: process.env.PORTAL_HOST_BIND ?? process.env.HOST ?? '127.0.0.1',
    portalsDir: process.env.PORTALS_DIR,
    maxActivePortals: numberFromEnv('MAX_ACTIVE_PORTALS'),
    idleTtlMs: numberFromEnv('PORTAL_IDLE_TTL_MS'),
    evictionIntervalMs: numberFromEnv('PORTAL_EVICTION_INTERVAL_MS'),
  });

  await host.start();
  return host;
}

function attachPortalEventLogs(registry: PortalRuntimeRegistry): void {
  registry.events.on('portal:createFailed', (event) => {
    const definition = registry.definition(event.portalId);
    writePortalSystemLog({
      level: 'error',
      msg: 'Embedded Portal failed to initialize',
      definition,
      error: event.error,
      fields: {
        event: 'portal:createFailed',
        version: event.version,
        state: event.state,
        basePath: event.basePath,
      },
    });
    console.error(`[portal] failed to create ${event.portalId}@v${event.version} at ${event.basePath}`, event.error);
  });

  registry.events.on('portal:created', (event) => {
    console.log(`[portal] created ${event.portalId}@v${event.version} at ${event.basePath}`);
  });

  registry.events.on('portal:draining', (event) => {
    console.log(`[portal] draining ${event.portalId}@v${event.version}; activeRequests=${event.activeRequests}`);
  });

  registry.events.on('portal:resourceDisposed', (event) => {
    console.log(`[portal] disposed ${event.portalId}@v${event.version}: ${event.resourceName}`);
  });

  registry.events.on('portal:destroyed', (event) => {
    console.log(`[portal] destroyed ${event.portalId}@v${event.version}`);
  });
}

async function managementApi(
  req: IncomingMessage,
  path: string,
  registry: PortalRuntimeRegistry,
  portalCatalog: DirectoryPortalCatalog,
): Promise<Response | null> {
  const method = req.method ?? 'GET';

  if (method === 'GET' && path === '/') {
    return jsonResponse({
      message: 'Node HTTP host with directory-discovered Hono portals',
      packages: {
        portalHost: '@nocobase/server/portal-host',
        portalsDir: portalCatalog.portalsDir,
      },
      examples: [
        'add storage/portals/main/acme/server/portal.ts and call POST /__portals/rescan',
        'curl -X POST http://localhost:3000/__portals/rescan',
        'curl -X POST http://localhost:3000/__portals/main:acme/activate',
        'curl -X POST http://localhost:3000/__portals/main:acme/deploy',
        'curl -X POST http://localhost:3000/__portals/evict-idle',
        'curl http://localhost:3000/__portals/main:acme',
        'curl -X POST http://localhost:3000/__portals/main:acme/reload',
        'curl http://localhost:3000/portals/acme/healthz',
        'curl http://localhost:3000/apps/customer-a/portals/acme/healthz',
        'curl -X DELETE http://localhost:3000/__portals/main:acme',
      ],
    });
  }

  if (method === 'GET' && path === '/__health') {
    return jsonResponse(registry.health());
  }

  if (method === 'GET' && path === '/__portals') {
    return jsonResponse({
      active: registry.list(),
      definitions: registry.listDefinitions(),
    });
  }

  if (path === '/__portals/rescan') {
    if (method !== 'POST') {
      return methodNotAllowed('POST');
    }

    const sync = await portalCatalog.syncDiscovered(registry);
    return jsonResponse({
      ...sync,
      active: registry.list(),
      definitions: registry.listDefinitions(),
    });
  }

  if (path === '/__portals/evict-idle') {
    if (method !== 'POST') {
      return methodNotAllowed('POST');
    }

    const evicted = await registry.evictIdle();
    return jsonResponse({ evicted });
  }

  const actionMatch = path.match(/^\/__portals\/([^/]+)\/(activate|deploy|evict|reload)$/);
  if (actionMatch) {
    if (method !== 'POST') {
      return methodNotAllowed('POST');
    }

    const id = decodeURIComponent(actionMatch[1]);
    const action = actionMatch[2];

    if (action === 'activate') {
      return jsonResponse({
        portal: await registry.ensureActive(id),
      });
    }

    if (action === 'deploy') {
      const input = await readJsonBody(req);
      return jsonResponse({
        deployment: await registry.deploy(id, {
          version: typeof input.version === 'string' ? input.version : undefined,
          strategy: input.strategy === 'restart' || input.strategy === 'blue-green' ? input.strategy : undefined,
          destroyTimeoutMs: numberFromValue(input.destroyTimeoutMs),
          waitForReady: typeof input.waitForReady === 'boolean' ? input.waitForReady : undefined,
          reason: 'deploy API',
        }),
      });
    }

    if (action === 'evict') {
      return jsonResponse({
        evicted: await registry.evict(id, { reason: 'evict API' }),
      });
    }

    return jsonResponse({
      portal: await registry.reload(id, { reason: 'reload API' }),
    });
  }

  const match = path.match(/^\/__portals\/([^/]+)$/);
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
          'Portal creation through API is disabled. Add a package under storage/portals/<appName>/<portal> and call POST /__portals/rescan.',
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

function resolvePortalId(path: string, registry: PortalRuntimeRegistry): string | null {
  const match = parsePortalPath(path);
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

function parsePortalPath(path: string): { candidates: string[] } | null {
  const appMatch = path.match(/^\/apps\/([^/]+)\/portals\/([^/]+)(?:\/|$)/);
  if (appMatch) {
    return {
      candidates: [`${decodeURIComponent(appMatch[1])}:${decodeURIComponent(appMatch[2])}`],
    };
  }

  const match = path.match(/^\/portals\/([^/]+)(?:\/|$)/);
  if (!match) {
    return null;
  }

  const portalName = decodeURIComponent(match[1]);
  return {
    candidates: [`main:${portalName}`, portalName],
  };
}

function notFoundResponse(): Response {
  return jsonResponse(
    {
      error: 'Not found',
      routes: [
        'GET /',
        'GET /__health',
        'GET /__portals',
        'POST /__portals/rescan',
        'POST /__portals/evict-idle',
        'GET /__portals/:id',
        'POST /__portals/:id/activate',
        'POST /__portals/:id/deploy',
        'POST /__portals/:id/evict',
        'POST /__portals/:id/reload',
        'DELETE /__portals/:id',
        'GET /portals/:id',
        'GET /apps/:appName/portals/:id',
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

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  const text = Buffer.concat(chunks).toString('utf8').trim();
  if (!text) {
    return {};
  }

  const value = JSON.parse(text) as unknown;
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

async function handleError(error: unknown, res: ServerResponse): Promise<void> {
  if (!(error instanceof PortalRegistryError) || error.status >= 500) {
    console.error(error);
  }

  if (res.headersSent) {
    res.destroy(error instanceof Error ? error : new Error(String(error)));
    return;
  }

  const response = jsonResponse(
    {
      error: error instanceof Error ? error.message : String(error),
      code: error instanceof PortalRegistryError ? error.code : 'INTERNAL_SERVER_ERROR',
    },
    {
      status: error instanceof PortalRegistryError ? error.status : 500,
    },
  );

  await applyFetchResponse(res, response);
}

function numberFromValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function numberFromEnv(name: string): number | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

if (require.main === module) {
  let portalHost: PortalHost | null = null;

  const shutdown = async () => {
    console.log('\nShutting down Portal host...');
    if (portalHost) {
      await portalHost.close('host shutdown');
    }
    process.exit(0);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  startPortalHostFromEnv()
    .then((host) => {
      portalHost = host;
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
