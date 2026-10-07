import type { Context } from 'hono';
import type { DescribeRouteOptions } from 'hono-openapi';
import { matchedRoutes } from 'hono/route';
import type { OpenAPIV3_1 } from 'openapi-types';

import { describeSpecOf } from './document.js';

/**
 * What `describeRoute()` declares for the route answering `context`, merged over the handlers registered with it (its
 * method and path); undefined when it declares nothing. A middleware reads it before the route runs, such as
 * authentication deciding whether the route accepts a credential. The route is the first one at or after the running
 * handler that is not a middleware for every method, so a sibling path that also matches (`/agents/{agentId}` beside
 * `/agents/available`) never lends it its declaration.
 */
export function declaredRouteOf(
  context: Context,
): DescribeRouteOptions | undefined {
  const routes = matchedRoutes(context);
  let index = context.req.routeIndex;
  while (index < routes.length && routes[index]?.method === 'ALL') index += 1;
  const target = routes[index];
  if (!target) return undefined;
  let declared: DescribeRouteOptions | undefined;
  for (const route of routes) {
    if (route.method !== target.method || route.path !== target.path) continue;
    const spec = describeSpecOf(route.handler);
    if (spec) declared = { ...declared, ...spec };
  }
  return declared;
}

/** Whether the route answering `context` lists `scheme` among its own security requirements. */
export function routeAcceptsScheme(context: Context, scheme: string): boolean {
  const security: readonly OpenAPIV3_1.SecurityRequirementObject[] =
    declaredRouteOf(context)?.security ?? [];
  return security.some((requirement) => scheme in requirement);
}

/**
 * The business action the route answering `context` declares in its `x-cli` extension (`cliRoute({ action })`);
 * undefined when it declares none. A route that accepts an agent's run names the action it performs, and the
 * application checks the run holds it before the route runs.
 */
export function declaredRouteActionOf(context: Context): string | undefined {
  const declared: Readonly<Record<string, unknown>> | undefined =
    declaredRouteOf(context);
  const cli: unknown = declared?.['x-cli'];
  if (!cli || typeof cli !== 'object') return undefined;
  const { action } = cli as { readonly action?: unknown };
  return typeof action === 'string' ? action : undefined;
}
