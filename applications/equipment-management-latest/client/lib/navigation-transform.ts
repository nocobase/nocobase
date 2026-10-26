import { groupFoundationNavigation } from '@nocobase/app-plugin-foundation/client';
import type { RouteNavigationItem } from '../routing/route-navigation.js';

/** Application-owned navigation customization, applied after permission filtering. */
export function transformNavigation(
  items: RouteNavigationItem[],
): RouteNavigationItem[] {
  return groupFoundationNavigation(collapsePermissionNavigation(items));
}

/** One sidebar entry opens the first readable tab; original routes and guards remain unchanged. */
export function collapsePermissionNavigation(
  items: RouteNavigationItem[],
): RouteNavigationItem[] {
  return items.map((item) => {
    if (item.route.name !== 'permissionManagement')
      return {
        ...item,
        children: collapsePermissionNavigation([...item.children]),
      };
    const first = item.children[0];
    if (!first) return item;
    return {
      route: {
        ...first.route,
        name: item.route.name,
        navigation: item.route.navigation,
      },
      children: [],
      activeRouteKeys: item.children.map(
        (child) =>
          `${child.route.packageName}:${child.route.path}:${child.route.id}`,
      ),
    };
  });
}
