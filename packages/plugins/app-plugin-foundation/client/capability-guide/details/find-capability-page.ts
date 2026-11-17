import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { routeKey } from './route-key.js';

export function findCapabilityPage(
  routes: readonly AppClientRegisteredRoute[],
  denied: ReadonlySet<string>,
  names: readonly string[],
  paths: readonly string[] = [],
): { route: AppClientRegisteredRoute; denied: boolean } | undefined {
  type Match = { route: AppClientRegisteredRoute; denied: boolean };
  function walk(
    nodes: readonly AppClientRegisteredRoute[],
    parentDenied = false,
  ): Match | undefined {
    for (const route of nodes) {
      const inaccessible = parentDenied || denied.has(routeKey(route));
      if (
        (names.includes(route.name ?? '') || paths.includes(route.path)) &&
        route.componentLoader &&
        route.path.startsWith('/') &&
        !/[:*?]/.test(route.path)
      )
        return { route, denied: inaccessible };
      const nested = walk(route.children ?? [], inaccessible);
      if (nested) return nested;
    }
    return undefined;
  }
  return walk(routes);
}
