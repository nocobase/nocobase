import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';

export function routeKey(route: AppClientRegisteredRoute): string {
  return `${route.packageName}:${route.path}:${route.id}`;
}
