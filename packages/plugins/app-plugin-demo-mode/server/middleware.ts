import {
  getRequestLocale,
  TRANSLATOR_CONTEXT_KEY,
  type Translator,
} from '@nocobase/i18n/server';
import type { Context, MiddlewareHandler } from 'hono';

import type { DemoModeSettings } from './config.js';
import {
  DEMO_MODE_ERROR_DOMAIN,
  DEMO_READ_ONLY_MESSAGE,
  DEMO_READ_ONLY_REASON,
} from './errors.js';
import type { DemoRequestState, DemoWriteGuard } from './guard.js';
import { DEMO_MODE_NAMESPACE } from './namespace.js';

/**
 * The `Server-Timing` metric a response carries when the request had a write refused. Browsers expose it to page
 * scripts through `PerformanceResourceTiming.serverTiming`, so the client plugin notices every refusal without
 * wrapping `fetch` or depending on how an application reads its errors.
 */
export const DEMO_SERVER_TIMING_METRIC = 'demo-read-only';

/**
 * Routes that end or change sessions other than the caller's own, such as Better Auth's `revoke-other-sessions` and the
 * users plugin's `users/:userId/revokeSessions`. Their only writes go to the always-allowed `session` table, so without
 * this a visitor of a demo whose account everyone shares could sign everyone else out. Matched by the last path segment
 * so other plugins' routes of the same name are covered too.
 */
const SESSION_MANAGEMENT_PATH =
  /\/(?:revoke-?(?:other-?)?sessions?|update-?session)$/iu;

export interface DemoModeLogger {
  info(details: object, message: string): void;
  warn(details: object, message: string): void;
}

export interface DemoModeMiddlewareOptions {
  readonly guard: DemoWriteGuard;
  readonly settings: DemoModeSettings;
  /** Guards every connection's current knex client; a reconnect since the last request leaves a new one unguarded. */
  readonly attachConnections: () => Promise<void>;
  readonly logger?: DemoModeLogger;
  readonly runWithPolicy?: (run: () => Promise<void>) => Promise<void>;
  readonly allowed?: () => Promise<
    readonly { table: string; statement: string }[]
  >;
}

/**
 * Runs each request inside the write guard and, when the guard refused a write and the route failed, answers with the
 * demo error instead of whatever the route made of the failure, marked with the `Server-Timing` metric. A route that
 * swallows the failure and still succeeds keeps its answer unmarked: pages commonly make such best-effort writes while
 * reading, and telling the visitor a change was refused when they changed nothing would only confuse them.
 */
export function createDemoModeMiddleware(
  options: DemoModeMiddlewareOptions,
): MiddlewareHandler {
  const { guard, settings, attachConnections, logger } = options;
  return async (context, next) => {
    await attachConnections();
    let state!: DemoRequestState;
    const invoke = async () => {
      state = {
        method: context.req.method,
        path: context.req.path,
        blocked: [],
        allowed: await options.allowed?.(),
        strict: SESSION_MANAGEMENT_PATH.test(context.req.path),
      };
      await guard.run(state, () => next());
    };
    if (options.runWithPolicy) await options.runWithPolicy(invoke);
    else await invoke();
    if (state.blocked.length === 0) return;

    const details = {
      method: state.method,
      path: state.path,
      status: context.res.status,
      writes: state.blocked,
    };
    if (settings.mode === 'observe') {
      logger?.warn(details, 'Demo mode would refuse this request’s writes');
      return;
    }
    logger?.info(details, 'Demo mode refused a write');
    if (context.res.status < 400) return;
    await replaceWithDemoError(context);
    try {
      context.res.headers.append('Server-Timing', DEMO_SERVER_TIMING_METRIC);
    } catch {
      // A response whose headers are immutable cannot carry the metric; the error body still says what happened.
    }
  };
}

async function replaceWithDemoError(context: Context): Promise<void> {
  const translator = context.get(TRANSLATOR_CONTEXT_KEY) as
    Translator | undefined;
  const locale = getRequestLocale(context);
  const requestId = context.get('requestId') as string | undefined;
  const body = {
    error: {
      code: 400,
      status: 'FAILED_PRECONDITION',
      reason: DEMO_READ_ONLY_REASON,
      domain: DEMO_MODE_ERROR_DOMAIN,
      message: DEMO_READ_ONLY_MESSAGE,
      ...(translator && locale
        ? {
            localizedMessage: {
              locale,
              message: translator('errors.readOnly', {
                ns: DEMO_MODE_NAMESPACE,
                defaultValue: DEMO_READ_ONLY_MESSAGE,
              }),
            },
          }
        : {}),
      ...(requestId ? { requestId } : {}),
    },
  };
  const headers = new Headers(context.res.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.set('content-type', 'application/json; charset=UTF-8');
  // Cleared first so Hono does not merge the failed response's headers, such as its length, into the new one.
  context.res = undefined;
  context.res = new Response(JSON.stringify(body), { status: 400, headers });
}
