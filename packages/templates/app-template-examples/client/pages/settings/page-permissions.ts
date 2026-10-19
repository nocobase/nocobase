import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import type { LocalizedText } from '@nocobase/app-plugin-authorization/client';
import type { CatalogResource } from './permissions-model.js';

/** Application route names are stable within their owner; labels never change stored grants. */
export type PagePermissionTitles = Readonly<Record<string, string>>;

export function pagePermissionTitle(
  route: AppClientRegisteredRoute,
  titles: PagePermissionTitles,
): LocalizedText | undefined {
  const key =
    (route.source === 'application' && Object.hasOwn(titles, route.name)
      ? titles[route.name]
      : undefined) ??
    route.navigation?.title ??
    route.breadcrumb?.title;
  return key?.trim() ? { key, ns: route.packageName } : undefined;
}

/** Preserve every existing resource id/action; never use a technical route id as its label. */
export function pagePermissionResources(
  routes: readonly AppClientRegisteredRoute[],
  titles: PagePermissionTitles,
  unnamed: (path: string) => string,
): CatalogResource[] {
  const resources = new Map<string, CatalogResource>();
  const visit = (items: readonly AppClientRegisteredRoute[]): void => {
    for (const route of items) {
      if (
        route.componentLoader &&
        typeof route.authz === 'object' &&
        route.authz.resource.type === 'page'
      ) {
        const id = route.authz.resource.id;
        // Resolved child routes may inherit the parent's authorization resource.
        // They share one grant, so showing independent checkboxes is misleading.
        if (!resources.has(id))
          resources.set(id, {
            type: 'page',
            id,
            title: pagePermissionTitle(route, titles) ?? unnamed(route.path),
            actions: [{ name: 'access', title: { key: 'settings.access' } }],
          });
      }
      visit(route.children ?? []);
    }
  };
  visit(routes);
  return [...resources.values()];
}
