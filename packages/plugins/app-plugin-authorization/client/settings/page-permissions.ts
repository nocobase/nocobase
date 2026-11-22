import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import type { LocalizedText } from '../authorization-client.js';
import type { CatalogResource } from './permissions-model.js';
import type { PermissionPageCatalog } from './page-catalog.js';

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
        const title = pagePermissionTitle(route, titles);
        // Route ordering may put an untitled detail before its named entry page.
        if (
          !resources.has(id) ||
          (title && typeof resources.get(id)?.title === 'string')
        )
          resources.set(id, {
            type: 'page',
            id,
            title: title ?? unnamed(route.path),
            actions: [{ name: 'access', title: { key: 'settings.access' } }],
          });
      }
      visit(route.children ?? []);
    }
  };
  visit(routes);
  return [...resources.values()];
}

/** Resource ownership follows the application's real settings branch, not translated labels or URL guesses. */
export function configurationResources(
  catalog: PermissionPageCatalog,
): ReadonlySet<string> {
  const resources = new Set<string>();
  const visit = (
    items: readonly AppClientRegisteredRoute[],
    inSettings = false,
  ): void => {
    for (const route of items) {
      const settings =
        inSettings ||
        (route.source === 'application' &&
          ['settings', 'systemManagement'].includes(route.name));
      if (
        settings &&
        route.componentLoader &&
        typeof route.authz === 'object'
      ) {
        resources.add(
          JSON.stringify([route.authz.resource.type, route.authz.resource.id]),
        );
      }
      visit(route.children ?? [], settings);
    }
  };
  visit(catalog.routes);
  // Include plugin pages moved into settings by the application's navigation transform.
  for (const category of catalog.settings) {
    for (const module of category.modules) visit([module.route], true);
  }
  return resources;
}
