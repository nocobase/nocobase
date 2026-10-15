import type { RouteNavigationItem } from '../routing/route-navigation.js';

/** Application-owned navigation customization, applied after permission filtering. */
export function transformNavigation(
  items: RouteNavigationItem[],
): RouteNavigationItem[] {
  return items;
}
