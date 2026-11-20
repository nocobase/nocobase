import { describe, expect, it } from 'vitest';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  firstAccessiblePage,
  type RouteNavigationItem,
} from '../../client/routing/route-navigation.js';

const page = (name: string, path: string): AppClientRegisteredRoute => ({
  id: name,
  name,
  path,
  auth: 'required',
  authz: { resource: { type: 'page', id: name }, action: 'access' },
  packageName: 'test',
  source: 'application',
  componentLoader: async () => ({ default: () => null }),
});
const item = (
  route: AppClientRegisteredRoute,
  children: RouteNavigationItem[] = [],
): RouteNavigationItem => ({ route, children });

describe('denied Home landing destination', () => {
  it('chooses the first accessible concrete business page', () => {
    expect(
      firstAccessiblePage([
        item({ ...page('group', '/group'), componentLoader: undefined }, [
          item(page('detail', '/orders/:id')),
          item(page('orders', '/orders')),
        ]),
        item(page('settings', '/settings')),
      ]),
    ).toBe('/orders');
  });

  it('uses a settings page when that is the only permitted destination', () => {
    expect(
      firstAccessiblePage([item(page('settingsUsers', '/settings/users'))]),
    ).toBe('/settings/users');
  });

  it('keeps the access-denied page when no destination is permitted', () => {
    expect(firstAccessiblePage([])).toBeUndefined();
  });
});
