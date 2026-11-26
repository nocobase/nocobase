import { Context } from 'hono';

import { isForwardedTo, type ApiForwardedRouter } from './openapi/document.js';

type ForwardedContextObserver = (child: Context) => void;

interface ForwardedContextEnv {
  Variables: { forwardedApiContextObserver: ForwardedContextObserver };
}

/** Match a registered dispatcher target for route inspection without executing its handlers. */
export function matchForwardedApiRoute(
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

/** Observe the actual child context of a dispatched request. */
export function observeForwardedApiContext(
  context: Context,
  observe: ForwardedContextObserver,
): void {
  const scoped = context as Context<ForwardedContextEnv>;
  const existing = scoped.get('forwardedApiContextObserver');
  scoped.set(
    'forwardedApiContextObserver',
    existing
      ? (child) => {
          existing(child);
          observe(child);
        }
      : observe,
  );
}

/** A dispatcher passes this callback to its child router without sharing the parent request context. */
export function getForwardedApiContextObserver(
  context: Context,
): ForwardedContextObserver | undefined {
  return (context as Context<ForwardedContextEnv>).get(
    'forwardedApiContextObserver',
  );
}
