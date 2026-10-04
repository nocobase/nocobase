import type { Hono } from 'hono';
import { inspectRoutes } from 'hono/dev';

/** One API contribution's router, labelled with whatever registered it. */
export interface OwnedApiRouter {
  readonly owner: string;
  readonly router: Hono;
}

interface RegisteredEndpoint {
  readonly owner: string;
  readonly method: string;
  readonly path: string;
}

/**
 * Reduces a Hono path to its pattern: a parameter's name does not change what it matches, so `/a/:x` and `/a/:y` are
 * the same route, while a regular expression or an optional marker after the name does and is kept.
 */
function normalizeRoutePattern(path: string): string {
  return path
    .split('/')
    .map((segment) =>
      segment.startsWith(':') ? segment.replace(/^:[^{?]*/, ':') : segment,
    )
    .join('/');
}

function describeEndpoint(
  endpoint: RegisteredEndpoint,
  prefix: string,
): string {
  return `${endpoint.method} ${prefix}${endpoint.path} from ${endpoint.owner}`;
}

/**
 * Fails when two API routes answer the same method and path. Hono matches in registration order and lets the first
 * match win, so the second registration would never run and nothing would say so.
 *
 * Hono records one entry per handler, so `router.post('/x', limit, validate, handle)` is three entries for a single
 * route, and `router.use()` is an `ALL` entry. Only entries whose handler is not a middleware — Hono's own test, a
 * handler that does not take `next` — count as endpoints, which leaves exactly one per route. Two endpoints conflict
 * when their patterns match and their methods are equal or either is `ALL`, whether they come from two contributions
 * or from the same router.
 */
export function assertNoDuplicateApiRoutes(
  routers: readonly OwnedApiRouter[],
  prefix: string = '/api',
): void {
  const endpoints = new Map<string, RegisteredEndpoint[]>();
  for (const { owner, router } of routers) {
    for (const route of inspectRoutes(router)) {
      if (route.isMiddleware) continue;
      const endpoint: RegisteredEndpoint = {
        owner,
        method: route.method,
        path: route.path,
      };
      const pattern = normalizeRoutePattern(route.path);
      const registered = endpoints.get(pattern) ?? [];
      const existing = registered.find(
        (candidate) =>
          candidate.method === endpoint.method ||
          candidate.method === 'ALL' ||
          endpoint.method === 'ALL',
      );
      if (existing) {
        throw new Error(
          `Duplicate API route: ${describeEndpoint(existing, prefix)} and ${describeEndpoint(endpoint, prefix)} answer the same requests. Only the first would ever run; remove or rename one of them.`,
        );
      }
      registered.push(endpoint);
      endpoints.set(pattern, registered);
    }
  }
}
