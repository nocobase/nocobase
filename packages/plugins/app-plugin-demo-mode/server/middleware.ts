import type { MiddlewareHandler } from 'hono';

import type { DemoRequestState, DemoWriteGuard, DemoSqlRule } from './guard.js';
import { respondDemoReadOnly } from './read-only-response.js';

export { DEMO_SERVER_TIMING_METRIC } from './read-only-response.js';

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
  /** Guards every connection's current knex client; a reconnect since the last request leaves a new one unguarded. */
  readonly attachConnections: () => Promise<void>;
  readonly logger?: Pick<DemoModeLogger, 'info'>;
  readonly runWithPolicy?: (run: () => Promise<void>) => Promise<void>;
  readonly allowed?: () => Promise<readonly DemoSqlRule[]>;
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
  const { guard, attachConnections, logger } = options;
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
    logger?.info(details, 'Demo mode refused a write');
    if (context.res.status < 400) return;
    respondDemoReadOnly(context);
  };
}
