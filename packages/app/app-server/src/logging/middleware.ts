import type { Context, Hono, MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { Logger } from '@nocobase/logging';

import type { AppPluginApplication } from '../plugins/index.js';
import {
  defineHttpMiddleware,
  getRequestId,
  type AppHttpMiddleware,
} from '../router/index.js';
import { loggingToken } from './token.js';

const defaultRequestHeaders = [
  'x-role',
  'x-hostname',
  'x-timezone',
  'x-locale',
  'x-authenticator',
  'x-data-source',
  'x-request-source',
  'referer',
  'user-agent',
] as const;

const oneOf = (...values: string[]) => {
  const allowed = new Set(values);
  return (value: string) => allowed.has(value);
};
const integer = (minimum: number, maximum: number) => (value: string) =>
  /^(?:0|[1-9]\d*)$/u.test(value) &&
  Number(value) >= minimum &&
  Number(value) <= maximum;
// Log only a diagnostic subset of route contracts. Custom kinds, slugs, free
// text and opaque identifiers are omitted even when a route accepts them.
const identifier = (value: string) =>
  /^[1-9]\d{0,19}$/u.test(value) ||
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
    value,
  );
const safeQueryParameters: Readonly<
  Record<string, (value: string) => boolean>
> = {
  limit: integer(1, 1000),
  offset: integer(0, 1_000_000_000),
  page: integer(1, 1_000_000_000),
  pageSize: integer(1, 1000),
  mode: oneOf('split', 'table'),
  view: oneOf('table', 'board', 'list'),
  status: oneOf(
    'queued',
    'dispatched',
    'running',
    'completed',
    'failed',
    'cancelled',
  ),
  statusKey: oneOf(
    'backlog',
    'in_progress',
    'blocked',
    'in_review',
    'done',
    'cancelled',
  ),
  subjectKind: oneOf('issue', 'conversation'),
  subjectId: identifier,
  agentId: identifier,
  runnerId: identifier,
  projectId: identifier,
  issueId: identifier,
  appId: identifier,
  environmentId: identifier,
  sort: oneOf('updated', 'created', 'number', 'priority'),
  direction: oneOf('asc', 'desc'),
  purpose: oneOf('preview', 'production'),
  includeArchived: oneOf('true', 'false'),
};

function safeQuery(context: Context): Record<string, string> {
  const query: Record<string, string> = {};
  const values = context.req.query();
  for (const [key, accepts] of Object.entries(safeQueryParameters)) {
    const value = values[key];
    // Check length before validating; never turn a rejected value into a valid
    // prefix by truncating it.
    if (value !== undefined && value.length <= 100 && accepts(value))
      query[key] = value;
  }
  return query;
}

/** A transport hint for traffic analysis, never an authentication decision. */
function callerOf(context: Context): string {
  if (context.req.header('x-nocobase-runner-key')) return 'runner';
  if (context.req.header('x-nocobase-run-token')) return 'agentRun';
  if (context.req.header('x-nocobase-client') === 'cli') return 'cli';
  if (context.req.header('x-api-key')) return 'apiKey';
  if (context.req.header('cookie')) return 'browser';
  return 'anonymous';
}

export interface RequestLoggerOptions {
  logger: Logger;
  app?: string;
  skip?: (context: Context) => boolean;
  requestHeaders?: readonly string[];
}

export function requestLogger(
  options: RequestLoggerOptions,
): MiddlewareHandler {
  return createMiddleware(async (context, next): Promise<void> => {
    if (options.skip?.(context)) {
      await next();
      return;
    }

    const logger = options.logger.child({ requestId: getRequestId(context) });
    const startedAt = Date.now();
    const app = options.app;
    const method = context.req.method;
    const path = context.req.path;

    logger.debug(
      {
        ...(app ? { app } : {}),
        req: {
          method,
          path,
          query: safeQuery(context),
          caller: callerOf(context),
          headers: selectHeaders(
            context,
            options.requestHeaders ?? defaultRequestHeaders,
          ),
        },
      },
      `${method} ${path} started`,
    );

    try {
      await next();
    } catch (error) {
      logger.error(
        completionBindings(
          context,
          app,
          method,
          path,
          startedAt,
          statusFromError(error),
          error,
          options.requestHeaders,
        ),
        `${method} ${path} failed`,
      );
      throw error;
    }

    const status = context.res.status;
    const bindings = completionBindings(
      context,
      app,
      method,
      path,
      startedAt,
      status,
      context.error,
      options.requestHeaders,
    );

    if (status >= 500) {
      logger.error(bindings, `${method} ${path} ${status} failed`);
      return;
    }
    if (status >= 400) {
      logger.warn(bindings, `${method} ${path} ${status} completed`);
      return;
    }
    logger.info(bindings, `${method} ${path} ${status} completed`);
  });
}

export const requestLoggingMiddleware: AppHttpMiddleware<AppPluginApplication> =
  defineHttpMiddleware({
    name: '@nocobase/app-server/logging/request',
    register(router: Hono, app: AppPluginApplication): void {
      const logging = app.container.resolve(loggingToken);
      router.use(
        '*',
        requestLogger({
          logger: logging.getLogger('request'),
          skip: (context) => {
            const path = context.req.path;
            return (
              (path !== '/api' && !path.startsWith('/api/')) ||
              path === '/api/healthz'
            );
          },
        }),
      );
    },
  });

function completionBindings(
  context: Context,
  app: string | undefined,
  method: string,
  path: string,
  startedAt: number,
  status: number,
  error?: unknown,
  requestHeaders: readonly string[] = defaultRequestHeaders,
): Record<string, unknown> {
  return {
    ...(app ? { app } : {}),
    req: {
      method,
      path,
      route: context.req.routePath,
      params: context.req.param(),
      query: safeQuery(context),
      caller: callerOf(context),
      ...(status >= 400
        ? {
            headers: selectHeaders(context, requestHeaders),
          }
        : {}),
    },
    res: {
      status,
      contentLength: responseContentLength(context),
    },
    durationMs: Date.now() - startedAt,
    ...(error === undefined ? {} : { err: serializeError(error) }),
  };
}

function statusFromError(error: unknown): number {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status <= 599
  ) {
    return error.status;
  }
  return 500;
}

function serializeError(error: unknown): unknown {
  if (!(error instanceof Error)) return error;
  return {
    type: error.name,
    message: error.message,
    stack: error.stack,
  };
}

function selectHeaders(
  context: Context,
  names: readonly string[],
): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const name of names) {
    const value = context.req.header(name);
    if (value !== undefined) headers[name.toLowerCase()] = value;
  }
  return headers;
}

function responseContentLength(context: Context): number | undefined {
  const value = context.res.headers.get('content-length');
  if (!value) return undefined;
  const length = Number(value);
  return Number.isFinite(length) ? length : undefined;
}
