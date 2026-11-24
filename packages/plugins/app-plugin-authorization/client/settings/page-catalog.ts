import {
  compareNavigationOrder,
  isPersonalSettingsRoute,
  isSystemSettingsRoute,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';

/** One entry of the application's menu, with the entries nested under it. */
export interface PermissionNavigationItem {
  readonly route: AppClientRegisteredRoute;
  readonly children: readonly PermissionNavigationItem[];
}

/** One category of the system settings, with the modules it lists. */
export interface PermissionSettingsCategory {
  readonly route: AppClientRegisteredRoute;
  readonly modules: readonly { readonly route: AppClientRegisteredRoute }[];
}

/**
 * The pages a role editor lists, as the application arranges them. Only the application knows how its menu groups,
 * orders and hides routes, so it supplies this through the plugin's `pageCatalog` option; without one the plugin reads
 * the registered routes directly.
 */
export interface PermissionPageCatalog {
  /** Every route, as the router mounts it, for the pages no menu reaches. */
  readonly routes: readonly AppClientRegisteredRoute[];
  /** The application's menu, without the settings entries. */
  readonly navigation: readonly PermissionNavigationItem[];
  /** The system settings, by category. */
  readonly settings: readonly PermissionSettingsCategory[];
}

export type PermissionPageCatalogSource = (
  routes: readonly AppClientRegisteredRoute[],
) => PermissionPageCatalog;

/** The catalog of an application that supplies none: menu entries are the routes that declare `navigation`. */
export const defaultPermissionPageCatalog: PermissionPageCatalogSource = (
  routes,
) => {
  const menu = (
    items: readonly AppClientRegisteredRoute[],
  ): PermissionNavigationItem[] =>
    items
      .filter(
        (route) =>
          route.navigation &&
          !isSystemSettingsRoute(route) &&
          !isPersonalSettingsRoute(route),
      )
      .slice()
      .sort(compareNavigationOrder)
      .map((route) => ({ route, children: menu(route.children ?? []) }));
  const settings: PermissionSettingsCategory[] = routes
    .filter(
      (route) => isSystemSettingsRoute(route) && route.kind === 'category',
    )
    .slice()
    .sort(compareNavigationOrder)
    .map((route) => ({
      route,
      modules: (route.children ?? [])
        .slice()
        .sort(compareNavigationOrder)
        .map((module) => ({ route: module })),
    }))
    .filter((category) => category.modules.length > 0);
  return { routes, navigation: menu(routes), settings };
};
