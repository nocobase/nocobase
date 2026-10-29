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

// Free text, opaque cursors and authentication parameters never enter request logs.
const safeQueryParameters = new Set([
  'limit',
  'offset',
  'page',
  'pageSize',
  'mode',
  'view',
  'status',
  'statusKey',
  'subjectKind',
  'subjectId',
  'agentId',
  'runnerId',
  'projectId',
  'issueId',
  'appId',
  'environmentId',
  'sort',
  'direction',
  'purpose',
  'includeArchived',
]);

function safeQuery(context: Context): Record<string, string> {
  const query: Record<string, string> = {};
  const values = context.req.query();
  for (const key of safeQueryParameters) {
    const value = values[key];
    if (value !== undefined) query[key] = value.slice(0, 100);
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
