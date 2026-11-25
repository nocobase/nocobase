import type { BlockList } from 'node:net';

import { Context, type MiddlewareHandler } from 'hono';
import { findTargetHandler } from 'hono/utils/handler';

import { getClientAddress } from '../router/api-limits.js';
import { getRequestId } from '../router/api-error.js';
import {
  isForwardedTo,
  type ApiForwardedRouter,
} from '../router/openapi/document.js';
import {
  declaredRouteActionOf,
  declaredRouteOf,
} from '../router/openapi/declared.js';
import {
  apiExecutionResultOf,
  enableApiExecutionResult,
} from '../router/execution-result.js';
import { parseAuditAddress } from './ip.js';
import {
  auditSnapshot,
  readAuditBody,
  type AuditRedactRule,
} from './redact.js';
import type { AuditActor, AuditTarget, AuditTranslation } from './index.js';
import type { AuditCoordinator } from './service.js';

export interface AuditTargets {
  readonly source?: AuditTarget;
  readonly targets: readonly AuditTarget[];
}

export interface AuditExecutionResult {
  readonly status: number;
  /** Bounded JSON copies used only by the resolver and the snapshot policy. */
  readonly request: unknown;
  readonly response: unknown;
  /** An in-process result from a framework route, if provided. */
  readonly value: unknown;
}

export interface AuditRouteOptions {
  readonly action?: string;
  readonly resource?: string;
  readonly operationName?:
    string | (AuditTranslation & { readonly defaultValue?: string });
  /** Runs before guards. Only use route information available before processing. */
  readonly target?: (
    context: Context,
  ) => AuditTarget | AuditTargets | undefined;
  /** Runs after the handler succeeds. Only return identifiers safe for the log. */
  readonly resolveTargets?: (
    result: AuditExecutionResult,
    context: Context,
  ) => AuditTarget | AuditTargets | undefined;
  readonly redact?: readonly AuditRedactRule[];
  /** Set to false to omit both snapshots. A target resolver can still read bounded JSON. */
  readonly captureBody?: boolean;
  /** Project the request body before recording it. */
  readonly requestSnapshot?: (request: unknown) => unknown;
  /** Classify credential validation errors as failures and omit identity and snapshots on failure. */
  readonly authenticationAttempt?: boolean;
}

type Declaration = AuditRouteOptions | false;
type Resolver = (context: Context) => Declaration | undefined;
const auditDeclaration = Symbol('describeAudit');
type DescribedHandler = MiddlewareHandler & {
  readonly [auditDeclaration]: Resolver;
};
const writes = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

interface RouteAudit {
  readonly action: string;
  readonly resource: string;
  readonly summary?: string;
  readonly options: AuditRouteOptions;
  readonly context: Context;
}

interface Forwarding {
  context?: Context;
}

interface AuditEnv {
  Variables: { auditForwarding: Forwarding };
}

export function describeAudit(
  declaration: Declaration | Resolver,
): MiddlewareHandler {
  const resolve: Resolver =
    typeof declaration === 'function' ? declaration : () => captured;
  const captured =
    typeof declaration === 'function'
      ? undefined
      : copyDeclaration(declaration);
  const middleware: MiddlewareHandler = async (_context, next) => next();
  Object.defineProperty(middleware, auditDeclaration, { value: resolve });
  return middleware;
}

/** Let a dispatcher pass its child context to the request collector. */
export function forwardedAuditContext(
  context: Context,
): ((child: Context) => void) | undefined {
  const state = (context as Context<AuditEnv>).get('auditForwarding');
  if (!state) return undefined;
  return (child) => {
    state.context = child;
    enableApiExecutionResult(child);
  };
}

function copyDeclaration(declaration: Declaration): Declaration {
  if (declaration === false) return false;
  const { redact, operationName } = declaration;
  return Object.freeze({
    ...declaration,
    redact:
      redact &&
      Object.freeze(
        redact.map((rule) => {
          if (
            !rule ||
            Object.keys(rule).length !== 1 ||
            !(
              (typeof rule.field === 'string' && rule.field.trim()) ||
              (typeof rule.path === 'string' && rule.path.trim())
            )
          )
            throw new TypeError(
              'An audit redaction rule requires exactly one field or path.',
            );
          return Object.freeze({ ...rule });
        }),
      ),
    operationName:
      typeof operationName === 'object'
        ? Object.freeze({ ...operationName })
        : operationName,
  });
}

function routeAudit(
  context: Context,
  autoDetect: boolean,
  report: () => void,
): RouteAudit | false | undefined {
  const routes = context.req.matchedRoutes;
  const route = routes.find(
    (item, index) => index >= context.req.routeIndex && item.method !== 'ALL',
  );
  if (!route) return undefined;
  const spec = declaredRouteOf(context);
  const cliAction = declaredRouteActionOf(context);
  let declaration: AuditRouteOptions | undefined;
  for (const [index, candidate] of routes.entries()) {
    if (candidate.method !== route.method || candidate.path !== route.path)
      continue;
    const resolve = (
      findTargetHandler(candidate.handler) as Partial<DescribedHandler>
    )[auditDeclaration];
    if (!resolve) continue;
    const previous = context.req.routeIndex;
    try {
      context.req.routeIndex = index;
      const resolved = resolve(context);
      if (resolved === false) return false;
      if (resolved) {
        const copied = copyDeclaration(resolved);
        if (copied) declaration = { ...copied, ...declaration };
      }
    } catch {
      report();
      return false;
    } finally {
      context.req.routeIndex = previous;
    }
  }
  if (
    !declaration &&
    (!autoDetect ||
      !writes.has(context.req.method) ||
      spec?.hide ||
      !spec?.operationId)
  )
    return undefined;
  const operationId =
    typeof spec?.operationId === 'string'
      ? spec.operationId
      : spec?.operationId?.(route);
  return {
    action:
      declaration?.action ??
      cliAction ??
      operationId ??
      `${context.req.method} ${route.path}`,
    resource: declaration?.resource ?? spec?.tags?.[0] ?? route.path,
    summary: spec?.hide ? undefined : spec?.summary?.trim(),
    options: declaration ?? {},
    context,
  };
}

function forwardedRoute(
  context: Context,
  routers: readonly ApiForwardedRouter[],
): Context | undefined {
  const entry = routers.find((registration) =>
    isForwardedTo(registration, context.req.path),
  );
  if (!entry) return undefined;
  const path = context.req.path.slice(entry.prefix.length) || '/';
  return new Context(context.req.raw, {
    path,
    matchResult: entry.router.router.match(context.req.method, path),
    env: context.env as unknown,
  });
}

/** Read a scalar record key from a bounded execution result. */
export function auditRecordKey(
  value: unknown,
  ...path: readonly string[]
): string | number | undefined {
  for (const segment of path) {
    if (!value || typeof value !== 'object' || !Object.hasOwn(value, segment))
      return undefined;
    value = Reflect.get(value, segment);
  }
  return typeof value === 'string' || typeof value === 'number'
    ? value
    : undefined;
}

function targetsOf(
  value: AuditTarget | AuditTargets | undefined,
): AuditTargets | undefined {
  if (!value) return undefined;
  return 'collection' in value ? { targets: [value] } : value;
}

function withRouteParams<T>(context: Context, resolve: () => T): T {
  const previous = context.req.routeIndex;
  const route = context.req.matchedRoutes.findIndex(
    (item, index) => index >= previous && item.method !== 'ALL',
  );
  if (route < 0) return resolve();
  try {
    context.req.routeIndex = route;
    return resolve();
  } finally {
    context.req.routeIndex = previous;
  }
}

function clientIp(context: Context, proxies: BlockList): string | undefined {
  const peer = getClientAddress(context);
  if (!peer) return undefined;
  const parsed = parseAuditAddress(peer);
  if (!parsed || !proxies.check(parsed.address, parsed.family)) return peer;
  const forwarded = context.req.header('x-forwarded-for')?.split(',') ?? [];
  let current = parsed;
  for (const value of forwarded.reverse()) {
    const upstream = parseAuditAddress(value.trim());
    if (!upstream || upstream.port) break;
    current = upstream;
    if (!proxies.check(upstream.address, upstream.family)) break;
  }
  return current.address;
}

interface SessionContext {
  Variables: {
    auth?: {
      readonly user: { readonly id: string };
      readonly credential?: { readonly type: string; readonly id: string };
    } | null;
    authHttpIdentity?: { readonly userId: string };
    authz?: {
      readonly resolvedGrantSources?: () => readonly {
        readonly plugin: string;
        readonly id: string;
      }[];
    };
  };
}

function actorOf(context: Context, service: AuditCoordinator): AuditActor {
  const sessionContext = context as Context<SessionContext>;
  const auth = sessionContext.get('auth');
  if (auth?.credential?.type === 'run')
    return {
      type: 'agentRun',
      userId: auth.user.id,
      runId: auth.credential.id,
    };
  const resolved = service.resolveActor(context);
  if (resolved) return resolved;
  const userId =
    auth?.user.id ?? sessionContext.get('authHttpIdentity')?.userId;
  return userId ? { type: 'user', userId } : { type: 'anonymous' };
}

export function auditMiddleware(options: {
  readonly service: AuditCoordinator;
  readonly autoDetect: boolean;
  readonly proxies: BlockList;
  readonly forwarded: () => readonly ApiForwardedRouter[];
  readonly translate: (text: AuditTranslation, fallback: string) => string;
  readonly report: () => void;
}): MiddlewareHandler {
  return async (context, next) => {
    const started = performance.now();
    const occurredAt = new Date().toISOString();
    let route: RouteAudit | false | undefined;
    let before: AuditTargets | undefined;
    try {
      route = routeAudit(context, options.autoDetect, options.report);
      if (route === undefined) {
        const forwarded = forwardedRoute(context, options.forwarded());
        if (forwarded)
          route = routeAudit(forwarded, options.autoDetect, options.report);
      }
      if (route) {
        const matched = route;
        before = targetsOf(
          withRouteParams(matched.context, () =>
            matched.options.target?.(matched.context),
          ),
        );
      }
    } catch {
      options.report();
    }
    if (!route) return next();

    const declaration = route.options;
    const capture = declaration.captureBody !== false;
    const body =
      capture || declaration.resolveTargets
        ? readAuditBody(context.req.raw)
        : undefined;
    if (declaration.resolveTargets) enableApiExecutionResult(context);
    const forwarding: Forwarding = {};
    if (route.context !== context)
      (context as Context<AuditEnv>).set('auditForwarding', forwarding);
    let thrown = false;
    try {
      await next();
    } catch (error) {
      thrown = true;
      throw error;
    } finally {
      const status = thrown ? 500 : context.res.status;
      const durationMs = Math.round(performance.now() - started);
      const success = status >= 200 && status < 400;
      const replay =
        success && context.res.headers.get('Idempotency-Replayed') === 'true';
      if (!replay)
        try {
          const failedAuthentication =
            !success && declaration.authenticationAttempt;
          const actual = forwarding.context ?? context;
          const request = failedAuthentication ? undefined : await body;
          const response =
            success && (capture || declaration.resolveTargets)
              ? await readAuditBody(context.res)
              : undefined;
          const captured =
            success && declaration.resolveTargets
              ? targetsOf(
                  declaration.resolveTargets(
                    {
                      status,
                      request,
                      response,
                      value: apiExecutionResultOf(actual),
                    },
                    actual,
                  ),
                )
              : undefined;
          const targets = captured ?? before;
          const snapshot = (value: unknown) =>
            auditSnapshot(value, declaration.redact);
          const safeTarget = ({
            collection,
            key,
          }: AuditTarget): AuditTarget => ({
            collection,
            key: failedAuthentication ? undefined : snapshot(key),
          });
          const operation = declaration.operationName;
          const fallback =
            (typeof operation === 'string'
              ? operation.trim()
              : operation?.defaultValue?.trim()) ||
            route.summary ||
            route.action;
          const operationNameI18n =
            operation && typeof operation === 'object'
              ? { ns: operation.ns, key: operation.key }
              : undefined;
          const roles =
            (context as Context<SessionContext>)
              .get('authz')
              ?.resolvedGrantSources?.() ?? [];
          let actor = failedAuthentication
            ? ({ type: 'anonymous' } as const)
            : actorOf(context, options.service);
          if (
            actor.type === 'anonymous' &&
            actual !== context &&
            !failedAuthentication
          )
            actor = actorOf(actual, options.service);
          await options.service.record({
            requestId: getRequestId(context),
            action: route.action,
            operationName: operationNameI18n
              ? options.translate(operationNameI18n, fallback)
              : fallback,
            operationNameI18n,
            resource: route.resource,
            actor,
            roles: failedAuthentication
              ? []
              : [
                  ...new Set(
                    roles
                      .filter(({ plugin }) => plugin === 'permission-sets')
                      .map(({ id }) => id),
                  ),
                ].slice(0, 256),
            source: targets?.source && safeTarget(targets.source),
            targets: targets?.targets.slice(0, 64).map(safeTarget) ?? [],
            ip: clientIp(context, options.proxies),
            userAgent: context.req.header('user-agent')?.slice(0, 512),
            outcome: success
              ? 'success'
              : !failedAuthentication && (status === 401 || status === 403)
                ? 'denied'
                : 'failure',
            status,
            durationMs,
            occurredAt,
            request:
              capture && !failedAuthentication
                ? snapshot(
                    declaration.requestSnapshot
                      ? declaration.requestSnapshot(request)
                      : request,
                  )
                : undefined,
            response: capture && success ? snapshot(response) : undefined,
          });
        } catch {
          options.report();
        }
    }
  };
}
