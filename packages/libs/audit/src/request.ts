import type { BlockList } from 'node:net';

import type { Context, MiddlewareHandler } from 'hono';
import { findTargetHandler } from 'hono/utils/handler';

import { parseAuditAddress } from './ip.js';
import {
  auditSnapshot,
  copyAuditRedactRules,
  readAuditBody,
  type AuditRedactRules,
} from './redact.js';
import type { AuditActor, AuditTarget, AuditTranslation } from './index.js';
import type { AuditCoordinator } from './service.js';
import { repositoryAuditOptions } from './repository.js';

export interface AuditTargets {
  readonly source?: AuditTarget;
  readonly targets: readonly AuditTarget[];
}

export interface AuditExecutionResult {
  readonly status: number;
  /** A bounded JSON copy when capture is enabled and the request body is available. */
  readonly request: unknown;
  /** A bounded JSON copy when capture is enabled and the response body is available. */
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
  /** Runs after success. Body copies and the in-process result may be unavailable. Return only safe identifiers. */
  readonly resolveTargets?: (
    result: AuditExecutionResult,
    context: Context,
  ) => AuditTarget | AuditTargets | undefined;
  readonly redact?: AuditRedactRules;
  /** Body capture requires an explicit true and no explicit false across the app and route. */
  readonly captureBody?: boolean;
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

/** Router capabilities supplied by the host at composition time. */
export interface AuditRequestHost {
  declaredRouteOf(context: Context):
    | {
        readonly hide?:
          | boolean
          | ((input: { c?: Context; method: string; path: string }) => boolean);
        readonly operationId?:
          string | ((route: Context['req']['matchedRoutes'][number]) => string);
        readonly summary?: string;
        readonly tags?: readonly string[];
        readonly repository?: {
          readonly exposure: string;
          readonly collection: string;
          readonly action: string;
        };
      }
    | undefined;
  declaredRouteActionOf(context: Context): string | undefined;
  matchForwardedRoute(context: Context): Context | undefined;
  observeForwardedContext(
    context: Context,
    observe: (child: Context) => void,
  ): void;
  enableExecutionResult(context: Context): void;
  executionResultOf(context: Context): unknown;
  getClientAddress(context: Context): string | undefined;
  getRequestId(context: Context): string;
}

export function describeAudit(
  declaration: Declaration | Resolver,
): MiddlewareHandler {
  const resolve =
    typeof declaration === 'function'
      ? (context: Context) => {
          const resolved = declaration(context);
          return resolved === undefined ? undefined : copyDeclaration(resolved);
        }
      : staticResolver(declaration);
  const middleware: MiddlewareHandler = async (_context, next) => next();
  Object.defineProperty(middleware, auditDeclaration, { value: resolve });
  return middleware;
}

function staticResolver(declaration: Declaration): Resolver {
  const captured = copyDeclaration(declaration);
  return () => captured;
}

function copyDeclaration(declaration: Declaration): Declaration {
  if (declaration === false) return false;
  const { redact, operationName } = declaration;
  return Object.freeze({
    ...declaration,
    redact: redact === undefined ? undefined : copyAuditRedactRules(redact),
    operationName:
      typeof operationName === 'object'
        ? Object.freeze({ ...operationName })
        : operationName,
  });
}

function routeAudit(
  context: Context,
  host: AuditRequestHost,
  autoDetect: boolean,
  report: () => void,
): RouteAudit | false | undefined {
  const routes = context.req.matchedRoutes;
  const route = routes.find(
    (item, index) => index >= context.req.routeIndex && item.method !== 'ALL',
  );
  if (!route) return undefined;
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
      if (resolved) declaration = { ...resolved, ...declaration };
    } catch {
      report();
      return false;
    } finally {
      context.req.routeIndex = previous;
    }
  }
  const spec = host.declaredRouteOf(context);
  if (spec?.repository) {
    const { exposure, collection, action } = spec.repository;
    const repository = repositoryAuditOptions(exposure, collection, action);
    if (repository === false) return false;
    declaration = { ...repository, ...declaration };
  }
  if (!declaration && (!autoDetect || !writes.has(context.req.method)))
    return undefined;
  if (!declaration && (spec?.hide || !spec?.operationId)) return undefined;
  const operationId =
    typeof spec?.operationId === 'string'
      ? spec.operationId
      : spec?.operationId?.(route);
  return {
    action:
      declaration?.action ??
      host.declaredRouteActionOf(context) ??
      operationId ??
      `${context.req.method} ${route.path}`,
    resource: declaration?.resource ?? spec?.tags?.[0] ?? route.path,
    summary: spec?.summary?.trim(),
    options: declaration ?? {},
    context,
  };
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

function clientIp(
  context: Context,
  peer: string | undefined,
  proxies: BlockList,
  ipAddressHeaders: readonly string[],
): string | undefined {
  if (!peer) return undefined;
  const parsed = parseAuditAddress(peer);
  if (!parsed || !proxies.check(parsed.address, parsed.family)) return peer;
  for (const name of ipAddressHeaders) {
    const forwarded = context.req.header(name)?.split(',');
    if (!forwarded) continue;
    for (const value of forwarded.reverse()) {
      const upstream = parseAuditAddress(value.trim());
      if (!upstream || upstream.port) break;
      if (!proxies.check(upstream.address, upstream.family))
        return upstream.address;
    }
  }
  return peer;
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
  readonly host: AuditRequestHost;
  readonly service: AuditCoordinator;
  readonly autoDetect: boolean;
  readonly captureBody?: boolean;
  readonly redact?: AuditRedactRules;
  readonly proxies: BlockList;
  readonly ipAddressHeaders: readonly string[];
  readonly report: (message?: string) => void;
}): MiddlewareHandler {
  const { host, autoDetect, captureBody, report } = options;
  const globalRedact = options.redact && copyAuditRedactRules(options.redact);
  return async (context, next) => {
    const started = performance.now();
    let route: RouteAudit | false | undefined;
    let before: AuditTargets | undefined;
    try {
      route = routeAudit(context, host, autoDetect, report);
      if (route === undefined) {
        const forwarded = host.matchForwardedRoute(context);
        if (forwarded) route = routeAudit(forwarded, host, autoDetect, report);
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

    const occurredAt = new Date().toISOString();
    const declaration = route.options;
    const capture =
      captureBody !== false &&
      declaration.captureBody !== false &&
      (captureBody === true || declaration.captureBody === true);
    const body = capture ? readAuditBody(context.req.raw) : undefined;
    const { resolveTargets } = declaration;
    if (resolveTargets) host.enableExecutionResult(context);
    let actual: Context = context;
    if (route.context !== context)
      host.observeForwardedContext(context, (child) => {
        actual = child;
        if (resolveTargets) host.enableExecutionResult(child);
      });
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
          const request = failedAuthentication ? undefined : await body;
          const response =
            capture && success ? await readAuditBody(context.res) : undefined;
          let targets = before;
          if (success && resolveTargets) {
            try {
              targets =
                targetsOf(
                  resolveTargets(
                    {
                      status,
                      request,
                      response,
                      value: host.executionResultOf(actual),
                    },
                    actual,
                  ),
                ) ?? before;
            } catch {
              report('Could not resolve audit targets.');
            }
          }
          const redact =
            declaration.redact && globalRedact
              ? {
                  fields: [
                    ...(globalRedact.fields ?? []),
                    ...(declaration.redact.fields ?? []),
                  ],
                  paths: [
                    ...(globalRedact.paths ?? []),
                    ...(declaration.redact.paths ?? []),
                  ],
                }
              : (declaration.redact ?? globalRedact);
          const snapshot = (value: unknown) => auditSnapshot(value, redact);
          const safeTarget = ({
            collection,
            key,
          }: AuditTarget): AuditTarget => ({
            collection,
            key: failedAuthentication ? undefined : snapshot(key),
          });
          const operation = declaration.operationName;
          const operationName =
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
            requestId: host.getRequestId(context),
            action: route.action,
            operationName,
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
            ip: clientIp(
              context,
              host.getClientAddress(context),
              options.proxies,
              options.ipAddressHeaders,
            ),
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
              capture && !failedAuthentication ? snapshot(request) : undefined,
            response: capture && success ? snapshot(response) : undefined,
          });
        } catch {
          options.report();
        }
    }
  };
}
