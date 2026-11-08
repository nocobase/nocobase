import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { routeKey } from '../../routing/route-navigation.js';

/** The application registers its real management page with this stable name. */
export const API_KEYS_MANAGEMENT_ROUTE_NAME = 'apiKeysManagement';
export const APPLICATION_API_KEYS_MANAGEMENT_ROUTE_NAME =
  'applicationApiKeysManagement';

export function findApiKeysManagement(
  routes: readonly AppClientRegisteredRoute[],
  denied: ReadonlySet<string>,
  scope: 'personal' | 'application' = 'personal',
): { route: AppClientRegisteredRoute; denied: boolean } | undefined {
  function walk(
    nodes: readonly AppClientRegisteredRoute[],
    parentDenied: boolean,
  ): ReturnType<typeof findApiKeysManagement> {
    for (const route of nodes) {
      const inaccessible = parentDenied || denied.has(routeKey(route));
      if (
        route.name ===
          (scope === 'personal'
            ? API_KEYS_MANAGEMENT_ROUTE_NAME
            : APPLICATION_API_KEYS_MANAGEMENT_ROUTE_NAME) &&
        route.componentLoader &&
        route.auth === 'required' &&
        route.path.startsWith('/') &&
        !/[:*?]/.test(route.path)
      ) {
        return { route, denied: inaccessible };
      }
      const nested = walk(route.children ?? [], inaccessible);
      if (nested) return nested;
    }
    return undefined;
  }
  return walk(routes, false);
}
