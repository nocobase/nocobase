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
  it('chooses an accessible concrete page and ignores dynamic paths', () => {
    expect(
      firstAccessiblePage([
        item(page('detail', '/orders/:id')),
        item(page('orders', '/orders')),
      ]),
    ).toBe('/orders');
  });

  it('keeps the access-denied page when no destination is permitted', () => {
    expect(firstAccessiblePage([])).toBeUndefined();
  });
});
