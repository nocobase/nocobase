import { AsyncLocalStorage } from 'node:async_hooks';
import type { BlockList } from 'node:net';

import type { DatabaseConnection } from '@nocobase/db';
import { Context, type MiddlewareHandler } from 'hono';
import { findTargetHandler } from 'hono/utils/handler';

import { getClientAddress } from '../router/api-limits.js';
import { getRequestId } from '../router/api-error.js';
import {
  isForwardedTo,
  type ApiForwardedRouter,
} from '../router/openapi/document.js';
import { declaredRouteOf } from '../router/openapi/declared.js';
import { parseAuditAddress } from './ip.js';
import { auditSnapshot, readAuditBody } from './redact.js';
import type {
  AuditActor,
  AuditEvent,
  AuditService,
  AuditTarget,
} from './index.js';

export interface AuditRouteOptions {
  readonly action?: string;
  readonly resource?: string;
  readonly target?: (context: Context) => AuditTarget | undefined;
  /** Dotted field paths, relative to the request, response or metadata root. */
  readonly redact?: readonly string[];
  /** Sensitive field names at any depth, for example encrypted Collection fields. */
  readonly redactFields?: readonly string[];
  /** Set to false to omit both snapshots, or to transaction to capture caller-supplied summaries only. */
  readonly captureBody?: boolean | 'transaction';
  /** Classify credential validation failures as failures even when the HTTP status is 401 or 403. */
  readonly authenticationAttempt?: boolean;
}

type RouteDeclaration = AuditRouteOptions | false;
type ResolveRoute = (context: Context) => RouteDeclaration | undefined;

interface RouteAudit {
  readonly action: string;
  readonly resource: string;
  readonly options: AuditRouteOptions;
  readonly request?: Promise<unknown>;
}

interface AuditRequest {
  readonly service: AuditService;
  readonly report: () => void;
  readonly requestId: string;
  readonly started: number;
  readonly occurredAt: string;
  readonly userAgent?: string;
  readonly ip?: string;
  actor: AuditActor;
  apiKeySession?: { userId: string; apiKeyId: string };
  roles: string[];
  source?: AuditTarget;
  targets: AuditTarget[];
  metadata?: Record<string, unknown>;
  route?: RouteAudit;
  transactionAttempted?: boolean;
  transactionPending?: boolean;
  committed?: boolean;
  finished?: boolean;
}

const current = new AsyncLocalStorage<AuditRequest>();
const declarations = new WeakMap<object, ResolveRoute>();
const writeMethods = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

export function auditEnabled(action?: string): boolean {
  const request = current.getStore();
  return Boolean(
    request?.route &&
    !request.finished &&
    (action === undefined || request.route.action === action),
  );
}

/** Declare audit behavior before the handler. The request middleware can see it even if a guard refuses access. */
export function auditRoute(
  declaration: RouteDeclaration | ResolveRoute,
): MiddlewareHandler;
export function auditRoute<T extends MiddlewareHandler>(
  declaration: RouteDeclaration | ResolveRoute,
  middleware: T,
): T;
export function auditRoute(
  declaration: RouteDeclaration | ResolveRoute,
  middleware: MiddlewareHandler = async (_context, next) => next(),
): MiddlewareHandler {
  declarations.set(
    middleware,
    typeof declaration === 'function' ? declaration : () => declaration,
  );
  return middleware;
}

function prepareRoute(context: Context, request: AuditRequest): void {
  const routes = context.req.matchedRoutes;
  const index = routes.findIndex(
    (route, index) => index >= context.req.routeIndex && route.method !== 'ALL',
  );
  if (index < 0) return;
  const { method, path } = routes[index];
  const spec = declaredRouteOf(context);
  let declaration: AuditRouteOptions | undefined;
  for (const [position, route] of routes.entries()) {
    if (route.method !== method || route.path !== path) continue;
    const resolve = declarations.get(findTargetHandler(route.handler));
    if (!resolve) continue;
    const previous = context.req.routeIndex;
    try {
      context.req.routeIndex = position;
      const resolved = resolve(context);
      if (resolved === false) return;
      if (resolved) declaration = { ...resolved, ...declaration };
      if (resolved && resolved.target) {
        const target = resolved.target(context);
        if (target) request.targets = [target];
      }
    } catch {
      request.report();
    } finally {
      context.req.routeIndex = previous;
    }
  }
  if (
    declaration === undefined &&
    (spec?.hide || !spec?.operationId || !writeMethods.has(context.req.method))
  )
    return;

  const options = declaration ?? {};
  const cli: unknown = spec && Reflect.get(spec, 'x-cli');
  const action: unknown =
    cli && typeof cli === 'object' ? Reflect.get(cli, 'action') : undefined;
  request.route = {
    action:
      options.action ??
      (typeof action === 'string' ? action : undefined) ??
      (typeof spec?.operationId === 'string'
        ? spec.operationId
        : spec?.operationId?.(routes[index])) ??
      `${context.req.method} ${path}`,
    resource: options.resource ?? spec?.tags?.[0] ?? path,
    options,
    request:
      options.captureBody === undefined || options.captureBody === true
        ? readAuditBody(context.req.raw)
        : undefined,
  };
}

/** Put first on routers whose dispatcher creates a separate Hono context. */
export function auditRouteContext(): MiddlewareHandler {
  return async (context, next) => {
    const request = current.getStore();
    if (request && !request.route) {
      try {
        prepareRoute(context, request);
      } catch {
        request.report();
      }
    }
    await next();
  };
}

export function setAuditActor(actor: AuditActor): void {
  const request = current.getStore();
  if (request) request.actor = actor;
}

/** Mark the session produced by a successful API key validation. No key plaintext enters audit state. */
export function markAuditApiKeySession(userId: string, apiKeyId: string): void {
  const request = current.getStore();
  if (request) request.apiKeySession = { userId, apiKeyId };
}

/** Attribute the final session selected by authentication. */
export function setAuditSessionActor(userId: string, sessionId: string): void {
  const request = current.getStore();
  if (!request) return;
  const key = request.apiKeySession;
  request.actor =
    key?.userId === userId && key.apiKeyId === sessionId
      ? { type: 'apiKey', userId, apiKeyId: sessionId }
      : { type: 'user', userId };
}

export function setAuditRoles(roles: readonly string[], userId?: string): void {
  const request = current.getStore();
  if (
    !request ||
    (userId !== undefined &&
      (!('userId' in request.actor) || request.actor.userId !== userId))
  )
    return;
  request.roles = [...new Set(roles)];
}

export function setAuditTarget(
  target: AuditTarget | readonly AuditTarget[],
  source?: AuditTarget,
): void {
  const request = current.getStore();
  if (request) {
    request.targets = 'collection' in target ? [target] : [...target];
    request.source = source;
  }
}

export function addAuditMetadata(
  metadata: Readonly<Record<string, unknown>>,
): void {
  const request = current.getStore();
  if (request?.route) request.metadata = { ...request.metadata, ...metadata };
}

async function eventOf(
  request: AuditRequest,
  route: RouteAudit,
  status: number,
  body: {
    readonly request?: unknown;
    readonly response?: unknown;
    readonly redactFields?: readonly string[];
  } = {},
): Promise<AuditEvent> {
  const fields = new Set([
    ...(route.options.redactFields ?? []),
    ...(body.redactFields ?? []),
  ]);
  const paths = new Set(route.options.redact);
  const snapshot = (value: unknown) => auditSnapshot(value, fields, paths);
  const target = ({ collection, key }: AuditTarget): AuditTarget => ({
    collection,
    ...(key === undefined ? {} : { key: snapshot(key) }),
  });
  const success = status >= 200 && status < 400;
  return {
    requestId: request.requestId,
    action: route.action,
    resource: route.resource,
    actor:
      !success && route.options.authenticationAttempt
        ? { type: 'anonymous' }
        : request.actor,
    roles: !success && route.options.authenticationAttempt ? [] : request.roles,
    targets: request.targets.map((item) =>
      !success && route.options.authenticationAttempt
        ? { collection: item.collection }
        : target(item),
    ),
    source: request.source && target(request.source),
    ip: request.ip,
    userAgent: request.userAgent,
    outcome: success
      ? 'success'
      : !route.options.authenticationAttempt &&
          (status === 401 || status === 403)
        ? 'denied'
        : 'failure',
    status,
    durationMs: Math.round(performance.now() - request.started),
    occurredAt: request.occurredAt,
    request:
      route.options.captureBody === false
        ? undefined
        : snapshot(body.request ?? (await route.request)),
    response:
      success && route.options.captureBody !== false
        ? snapshot(body.response)
        : undefined,
    metadata: snapshot(request.metadata),
  };
}

/** Stage the successful HTTP event on the business transaction. Call after the last write, before returning. */
export async function recordAuditInTransaction(
  connection: DatabaseConnection,
  options: {
    readonly status?: number;
    readonly request?: unknown;
    readonly response?: unknown;
    readonly redactFields?: readonly string[];
  } = {},
): Promise<void> {
  const request = current.getStore();
  const status = options.status ?? 200;
  if (
    !request?.route ||
    request.finished ||
    request.transactionPending ||
    request.committed ||
    status < 200 ||
    status >= 400
  )
    return;
  request.transactionAttempted = true;
  request.transactionPending = true;
  connection.afterRollback(() => {
    request.transactionPending = false;
  });
  await request.service.record(
    await eventOf(request, request.route, status, options),
    { connection },
  );
  connection.afterCommit(() => {
    request.committed = true;
  });
}

function clientIp(context: Context, proxies: BlockList): string | undefined {
  const peer = getClientAddress(context);
  if (!peer) return undefined;
  const parsed = parseAuditAddress(peer);
  if (!parsed || !proxies.check(parsed.address, parsed.family)) return peer;
  const forwarded = context.req.header('x-forwarded-for')?.split(',') ?? [];
  let currentAddress = parsed;
  for (const value of forwarded.reverse()) {
    const upstream = parseAuditAddress(value.trim());
    if (!upstream || upstream.port) break;
    currentAddress = upstream;
    if (!proxies.check(upstream.address, upstream.family)) break;
  }
  return currentAddress.address;
}

export function auditMiddleware(options: {
  readonly service: AuditService;
  readonly proxies: BlockList;
  readonly forwarded: () => readonly ApiForwardedRouter[];
  readonly report: () => void;
}): MiddlewareHandler {
  return (context, next) => {
    const request: AuditRequest = {
      service: options.service,
      report: options.report,
      requestId: getRequestId(context),
      started: performance.now(),
      occurredAt: new Date().toISOString(),
      ip: clientIp(context, options.proxies),
      userAgent: context.req.header('user-agent')?.slice(0, 512),
      actor: { type: 'anonymous' },
      roles: [],
      targets: [],
    };
    return current.run(request, async () => {
      let thrown = false;
      try {
        try {
          prepareRoute(context, request);
          if (!request.route) {
            const forwarding = options
              .forwarded()
              .find((entry) => isForwardedTo(entry, context.req.path));
            if (forwarding) {
              const path =
                context.req.path.slice(forwarding.prefix.length) || '/';
              const matchResult = forwarding.router.router.match(
                context.req.method,
                path,
              );
              prepareRoute(
                new Context(context.req.raw, {
                  path,
                  matchResult,
                  env: context.env as unknown,
                }),
                request,
              );
            }
          }
        } catch {
          options.report();
        }
        await next();
      } catch (error) {
        thrown = true;
        throw error;
      } finally {
        request.finished = true;
        const status = thrown ? 500 : context.res.status;
        const success = status >= 200 && status < 400;
        if (
          request.route &&
          !request.committed &&
          !(success && request.transactionAttempted) &&
          !(
            success &&
            context.res.headers.get('Idempotency-Replayed') === 'true'
          )
        ) {
          try {
            const body =
              success &&
              (request.route.options.captureBody === undefined ||
                request.route.options.captureBody === true)
                ? await readAuditBody(context.res)
                : undefined;
            await options.service.record(
              await eventOf(request, request.route, status, { response: body }),
            );
          } catch {
            options.report();
          }
        }
      }
    });
  };
}
