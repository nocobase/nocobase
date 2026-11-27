import type { BlockList } from 'node:net';

import type { Context, MiddlewareHandler } from 'hono';
import { findTargetHandler } from 'hono/utils/handler';

import { parseAuditAddress } from './ip.js';
import {
  auditSnapshot,
  copyAuditRedactRules,
  readAuditBody,
  type AuditRedactRule,
} from './redact.js';
import type {
  AuditActor,
  AuditOutcomeEvent,
  AuditTarget,
  AuditTranslation,
} from './index.js';
import type { AuditCoordinator } from './service.js';
import { repositoryAuditOptions } from './repository.js';

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
  /** Marks a route that generates a data export. */
  readonly category?: 'export';
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
  /** Select the data the target resolver needs when body snapshots are disabled. Defaults to the response. */
  readonly resultFrom?: 'request' | 'response' | 'context';
  readonly redact?: readonly AuditRedactRule[];
  /** Set to false to omit both snapshots. A target resolver can still read bounded JSON. */
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
      ? declaration
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
    redact: redact && copyAuditRedactRules(redact),
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
  readonly proxies: BlockList;
  readonly ipAddressHeaders: readonly string[];
  readonly report: () => void;
}): MiddlewareHandler {
  const { host, service, autoDetect, report } = options;
  return async (context, next) => {
    const started = performance.now();
    let route: RouteAudit | false | undefined;
    try {
      route = routeAudit(context, host, autoDetect, report);
      if (route === undefined) {
        const forwarded = host.matchForwardedRoute(context);
        if (forwarded) route = routeAudit(forwarded, host, autoDetect, report);
      }
    } catch {
      report();
    }
    if (!route) return next();

    const occurredAt = new Date().toISOString();
    const declaration = route.options;
    const pendingPolicy = service.readCapturePolicy();
    const policy = pendingPolicy && (await pendingPolicy);
    if (
      declaration.category === 'export' &&
      (policy === false || policy?.recordExports === false)
    )
      return next();

    let before: AuditTargets | undefined;
    if (policy !== false && declaration.target) {
      try {
        const matched = route;
        before = targetsOf(
          withRouteParams(matched.context, () =>
            matched.options.target?.(matched.context),
          ),
        );
      } catch {
        report();
      }
    }

    const capture =
      policy !== false &&
      policy?.captureBody !== false &&
      declaration.captureBody !== false;
    const resolveTargets =
      policy === false ? undefined : declaration.resolveTargets;
    const resultFrom = resolveTargets
      ? (declaration.resultFrom ?? 'response')
      : undefined;
    const body =
      capture || resultFrom === 'request'
        ? readAuditBody(context.req.raw)
        : undefined;
    if (resolveTargets) host.enableExecutionResult(context);
    let actual: Context = context;
    if (policy !== false && route.context !== context)
      host.observeForwardedContext(context, (child) => {
        actual = child;
        if (resolveTargets) host.enableExecutionResult(child);
      });
    const action = route.action;
    const record = async (
      status: number,
      success: boolean,
      durationMs: number,
    ): Promise<void> => {
      const failedAuthentication =
        !success && declaration.authenticationAttempt;
      const outcome: AuditOutcomeEvent = {
        action,
        occurredAt,
        outcome: success
          ? 'success'
          : !failedAuthentication && (status === 401 || status === 403)
            ? 'denied'
            : 'failure',
        status,
      };
      if (policy === false) {
        await service.record(outcome);
        return;
      }
      const request = failedAuthentication ? undefined : await body;
      const response =
        success && (capture || resultFrom === 'response')
          ? await readAuditBody(context.res)
          : undefined;
      const captured =
        success && resolveTargets
          ? targetsOf(
              resolveTargets(
                {
                  status,
                  request,
                  response,
                  value: host.executionResultOf(actual),
                },
                actual,
              ),
            )
          : undefined;
      const targets = captured ?? before;
      const redact = policy?.redact.length
        ? [...(declaration.redact ?? []), ...policy.redact]
        : declaration.redact;
      const snapshot = (value: unknown) => auditSnapshot(value, redact);
      const safeTarget = ({ collection, key }: AuditTarget): AuditTarget => ({
        collection,
        key: failedAuthentication ? undefined : snapshot(key),
      });
      const operation = declaration.operationName;
      const operationName =
        (typeof operation === 'string'
          ? operation.trim()
          : operation?.defaultValue?.trim()) ||
        route.summary ||
        action;
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
        : actorOf(context, service);
      if (
        actor.type === 'anonymous' &&
        actual !== context &&
        !failedAuthentication
      )
        actor = actorOf(actual, service);
      await service.record({
        ...outcome,
        requestId: host.getRequestId(context),
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
        durationMs,
        request:
          capture && !failedAuthentication ? snapshot(request) : undefined,
        response: capture && success ? snapshot(response) : undefined,
      });
    };
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
          await record(status, success, durationMs);
        } catch {
          report();
        }
    }
  };
}
