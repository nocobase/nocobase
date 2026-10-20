import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';

export interface FoundationNavigationNode<T> {
  readonly route: Pick<
    AppClientRegisteredRoute,
    'name' | 'packageName' | 'componentLoader'
  >;
  readonly children: readonly T[];
}

/** Group an already permission-filtered Foundation entry without changing its route, guards or URL. */
export function groupFoundationNavigation<
  T extends FoundationNavigationNode<T>,
>(items: readonly T[], settingsGroupName = 'settings'): T[] {
  const settings = items.find(
    (item) =>
      item.route.name === settingsGroupName && !item.route.componentLoader,
  );
  const isFoundation = (item: T): boolean =>
    item.route.packageName === '@nocobase/app-plugin-foundation' &&
    item.route.name === 'foundation';
  const foundation = items.filter(isFoundation);
  if (!settings || foundation.length === 0) return [...items];
  return items
    .filter((item) => !isFoundation(item))
    .map((item) =>
      item === settings
        ? { ...item, children: [...item.children, ...foundation] }
        : item,
    );
}
