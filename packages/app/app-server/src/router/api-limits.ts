import type { Context, Hono, MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { createMiddleware } from 'hono/factory';

import {
  defineAppConfig,
  type AppConfigDefinition,
  type AppConfigFactory,
  type ConfigValidator,
} from '../config/define-app-config.js';
import { envString } from '@nocobase/config/providers/env';
import { ApiError, apiErrorHandler, appErrorDomain } from './api-error.js';

/** A duration: a number of milliseconds, or a string such as `500ms`, `30s`, `1m` or `1h`. */
export type ApiDuration = number | string;

/** A size: a number of bytes, or a string such as `512kb`, `10mb` or `1gb` (powers of 1024). */
export type ApiSize = number | string;

export interface ApiRateLimitConfig {
  /** How many requests one client may make per `window`. */
  readonly max: number;
  readonly window: ApiDuration;
}

/**
 * The `api` section: limits the application applies to every `/api` request, ahead of any route. Each one is off while
 * it is unset, and nothing is installed for it.
 */
export interface ApiConfig {
  /** The largest request body any `/api` route accepts. Routes still set their own, usually smaller, limit. */
  readonly bodyLimit?: ApiSize | null;
  /** How long a handler may take to produce its response. A streaming response that has started is not cut off. */
  readonly timeout?: ApiDuration | null;
  /** Requests per client per window, counted in this process. */
  readonly rateLimit?: ApiRateLimitConfig | null;
}

/** The `api` section with every value resolved to a number. */
export interface ResolvedApiLimits {
  readonly bodyLimitBytes?: number;
  readonly timeoutMs?: number;
  readonly rateLimit?: { readonly max: number; readonly windowMs: number };
}

const durationUnits: Readonly<Record<string, number>> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
};

const sizeUnits: Readonly<Record<string, number>> = {
  b: 1,
  kb: 1024,
  mb: 1024 ** 2,
  gb: 1024 ** 3,
};

/** Milliseconds for a duration such as `30s`; a bare number, or a string of digits, is milliseconds. */
export function parseApiDuration(value: unknown, name: string): number {
  return parseQuantity(
    value,
    name,
    durationUnits,
    'a positive duration such as "500ms", "30s", "1m" or "1h"',
  );
}

/** Bytes for a size such as `10mb`; a bare number, or a string of digits, is bytes. */
export function parseApiSize(value: unknown, name: string): number {
  return parseQuantity(
    value,
    name,
    sizeUnits,
    'a positive size such as "512kb", "10mb" or "1gb"',
  );
}

function parseQuantity(
  value: unknown,
  name: string,
  units: Readonly<Record<string, number>>,
  expected: string,
): number {
  let amount: number | undefined;
  if (typeof value === 'number') {
    amount = value;
  } else if (typeof value === 'string') {
    const match = /^(\d+(?:\.\d+)?)\s*([a-z]*)$/i.exec(value.trim());
    const multiplier = match
      ? match[2]
        ? units[match[2].toLowerCase()]
        : 1
      : undefined;
    if (match && multiplier !== undefined)
      amount = Number(match[1]) * multiplier;
  }
  if (amount === undefined || !Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${name} must be ${expected}.`);
  }
  return Math.ceil(amount);
}

const apiConfigFields: ReadonlySet<string> = new Set([
  'bodyLimit',
  'timeout',
  'rateLimit',
]);
const rateLimitFields: ReadonlySet<string> = new Set(['max', 'window']);

/** Resolves the `api` section, throwing on the first malformed value. An unset or `null` value stays off. */
export function resolveApiLimits(
  config: ApiConfig | undefined,
): ResolvedApiLimits {
  if (config === undefined || config === null) return {};
  if (!isRecord(config)) throw new Error('api must be a mapping.');
  const { bodyLimit: size, timeout, rateLimit } = config;
  return {
    ...(isSet(size)
      ? { bodyLimitBytes: parseApiSize(size, 'api.bodyLimit') }
      : {}),
    ...(isSet(timeout)
      ? { timeoutMs: parseApiDuration(timeout, 'api.timeout') }
      : {}),
    ...(isSet(rateLimit) ? { rateLimit: resolveRateLimit(rateLimit) } : {}),
  };
}

function resolveRateLimit(value: unknown): {
  readonly max: number;
  readonly windowMs: number;
} {
  if (!isRecord(value))
    throw new Error('api.rateLimit must be a mapping with max and window.');
  const { max, window } = value;
  if (typeof max !== 'number' || !Number.isInteger(max) || max <= 0) {
    throw new Error('api.rateLimit.max must be a positive integer.');
  }
  if (!isSet(window)) throw new Error('api.rateLimit.window is required.');
  return { max, windowMs: parseApiDuration(window, 'api.rateLimit.window') };
}

/** The rules the `api` section is held to, run at start, on reload and by `config check`. */
export const validateApiConfig: ConfigValidator<ApiConfig> = (api, context) => {
  if (!isRecord(api)) {
    context.error('', 'must be a mapping.');
    return;
  }
  for (const key of Object.keys(api)) {
    if (!apiConfigFields.has(key))
      context.warning(
        key,
        'is not an api setting, so nothing reads it. Expected bodyLimit, timeout or rateLimit.',
      );
  }
  const check = (path: string, parse: () => unknown): void => {
    try {
      parse();
    } catch (error) {
      context.error(
        path,
        (error instanceof Error ? error.message : String(error)).replace(
          `api.${path} `,
          '',
        ),
      );
    }
  };
  if (isSet(api.bodyLimit))
    check('bodyLimit', () => parseApiSize(api.bodyLimit, 'api.bodyLimit'));
  if (isSet(api.timeout))
    check('timeout', () => parseApiDuration(api.timeout, 'api.timeout'));
  const rateLimit: unknown = api.rateLimit;
  if (!isSet(rateLimit)) return;
  if (!isRecord(rateLimit)) {
    context.error('rateLimit', 'must be a mapping with max and window.');
    return;
  }
  for (const key of Object.keys(rateLimit)) {
    if (!rateLimitFields.has(key))
      context.warning(
        `rateLimit.${key}`,
        'is not a rateLimit setting, so nothing reads it. Expected max and window.',
      );
  }
  const { max, window } = rateLimit;
  if (typeof max !== 'number' || !Number.isInteger(max) || max <= 0)
    context.error('rateLimit.max', 'must be a positive integer.');
  if (!isSet(window)) context.error('rateLimit.window', 'is required.');
  else
    check('rateLimit.window', () =>
      parseApiDuration(window, 'api.rateLimit.window'),
    );
};

/** The environment variables that set `api` fields. */
const API_ENVIRONMENT = {
  API_BODY_LIMIT: envString('bodyLimit', {
    description:
      'The largest request body any /api route accepts, such as 10mb; off when unset.',
    required: false,
  }),
  API_TIMEOUT: envString('timeout', {
    description:
      'How long an /api request may take before it is answered 503 REQUEST_TIMEOUT, such as 30s; off when unset.',
    required: false,
  }),
};

/**
 * Declares the `api` section with the framework's validation and environment variables, in place of
 * `defineAppConfig`. Every limit defaults to off. A `validate` given here runs after the framework's own.
 */
export function defineApiConfig(
  definition: Partial<AppConfigDefinition<ApiConfig>> = {},
): AppConfigFactory<ApiConfig> {
  const extra =
    definition.validate === undefined
      ? []
      : Array.isArray(definition.validate)
        ? (definition.validate as readonly ConfigValidator<ApiConfig>[])
        : [definition.validate as ConfigValidator<ApiConfig>];
  return defineAppConfig<ApiConfig>({
    defaults: definition.defaults ?? {},
    validate: [validateApiConfig, ...extra],
    ...(definition.public ? { public: definition.public } : {}),
    env: { ...API_ENVIRONMENT, ...definition.env },
  });
}

/** The path no limit counts: load balancers and probes poll it, and must not be throttled or timed out. */
const exemptPaths: ReadonlySet<string> = new Set(['/api/healthz']);

export interface InstallApiLimitsOptions {
  /** The clock the rate limiter reads, for tests. */
  readonly now?: () => number;
}

/**
 * Installs the configured limits on the `/api` router, in the order a request meets them: the rate limit, before any
 * work is done for a client already over it; then the deadline, which also covers reading the body; then the body
 * ceiling. Nothing is installed for a limit that is not configured. Call it after the request id middleware, so every
 * refusal carries the request's id, and before any route.
 */
export function installApiLimits(
  api: Hono,
  config: ApiConfig | undefined,
  options: InstallApiLimitsOptions = {},
): void {
  const limits = resolveApiLimits(config);
  if (limits.rateLimit)
    api.use('*', apiRateLimitMiddleware(limits.rateLimit, options));
  if (limits.timeoutMs !== undefined)
    api.use('*', apiTimeoutMiddleware(limits.timeoutMs));
  if (limits.bodyLimitBytes !== undefined)
    api.use('*', apiBodyLimitMiddleware(limits.bodyLimitBytes));
}

/** Refuses a body over `maxBytes` with `413 BODY_TOO_LARGE`, whether it declares its length or streams it. */
export function apiBodyLimitMiddleware(maxBytes: number): MiddlewareHandler {
  return bodyLimit({
    maxSize: maxBytes,
    onError: (context) =>
      apiErrorHandler(
        new ApiError({
          status: 'INVALID_ARGUMENT',
          reason: 'BODY_TOO_LARGE',
          domain: appErrorDomain,
          message: `The request body exceeds the application's limit of ${maxBytes} bytes.`,
          httpStatus: 413,
        }),
        context,
      ),
  });
}

/**
 * Answers `503 REQUEST_TIMEOUT` when the handler has not returned its response within `timeoutMs`.
 *
 * The deadline covers the time until the response object exists, not the time spent sending it, so a streaming
 * response that has started runs to its end. The handler itself cannot be cancelled and keeps running after the
 * deadline; what it eventually returns or throws is discarded.
 */
export function apiTimeoutMiddleware(timeoutMs: number): MiddlewareHandler {
  return createMiddleware(async (context, next): Promise<void> => {
    if (exemptPaths.has(context.req.path)) {
      await next();
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(
          new ApiError({
            status: 'UNAVAILABLE',
            reason: 'REQUEST_TIMEOUT',
            domain: appErrorDomain,
            message: `The request was not handled within ${timeoutMs} ms.`,
          }),
        );
      }, timeoutMs);
    });
    const handled = next();
    try {
      await Promise.race([handled, deadline]);
    } finally {
      clearTimeout(timer);
      // A handler that loses the race may still fail later; its outcome has nowhere to go, and must not surface as an
      // unhandled rejection that stops the process.
      handled.catch(() => undefined);
    }
  });
}

interface RateLimitWindow {
  count: number;
  readonly resetAt: number;
}

/** The most clients counted at once; past it the oldest window is dropped, so memory stays bounded under a flood. */
const maxTrackedClients = 100_000;

/**
 * Counts requests per client in fixed windows and answers `429 RATE_LIMITED`, with `Retry-After` in seconds, once a
 * client exceeds `max` in its current window.
 *
 * The client is the address of the connection, read from the Node.js server bindings. The signed-in user is not known
 * at this point: authentication runs inside the routes that need it. A request whose address is unknown, such as one an
 * in-process Hub forwards, is not counted. Counters live in this process, so each instance of a multi-instance
 * deployment counts on its own.
 */
export function apiRateLimitMiddleware(
  limit: { readonly max: number; readonly windowMs: number },
  options: InstallApiLimitsOptions = {},
): MiddlewareHandler {
  const now = options.now ?? Date.now;
  // Every window has the same length and a client's entry is re-inserted when its window restarts, so insertion
  // order is expiry order: expired entries are always at the front.
  const windows = new Map<string, RateLimitWindow>();
  return createMiddleware(async (context, next): Promise<Response | void> => {
    if (exemptPaths.has(context.req.path)) return next();
    const client = clientAddress(context);
    if (client === undefined) return next();
    const time = now();
    for (const [key, window] of windows) {
      if (window.resetAt > time) break;
      windows.delete(key);
    }
    let window = windows.get(client);
    if (!window) {
      if (windows.size >= maxTrackedClients) {
        const oldest = windows.keys().next();
        if (!oldest.done) windows.delete(oldest.value);
      }
      window = { count: 0, resetAt: time + limit.windowMs };
      windows.set(client, window);
    }
    window.count += 1;
    if (window.count <= limit.max) return next();
    const retryAfter = Math.max(1, Math.ceil((window.resetAt - time) / 1000));
    const response = apiErrorHandler(
      new ApiError({
        status: 'RESOURCE_EXHAUSTED',
        reason: 'RATE_LIMITED',
        domain: appErrorDomain,
        message: `Too many requests: at most ${limit.max} per ${limit.windowMs} ms. Retry after ${retryAfter} s.`,
        metadata: { retryAfterSeconds: retryAfter },
      }),
      context,
    );
    response.headers.set('Retry-After', String(retryAfter));
    return response;
  });
}

interface NodeIncomingBindings {
  readonly incoming?: {
    readonly socket?: { readonly remoteAddress?: unknown };
  };
}

/** The remote address of the connection, as `@hono/node-server` exposes it, or `undefined` outside a Node server. */
function clientAddress(context: Context): string | undefined {
  const env = context.env as
    | (NodeIncomingBindings & { readonly server?: NodeIncomingBindings })
    | undefined;
  const address = (env?.incoming ?? env?.server?.incoming)?.socket
    ?.remoteAddress;
  return typeof address === 'string' && address ? address : undefined;
}

function isSet(value: unknown): boolean {
  return value !== undefined && value !== null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
