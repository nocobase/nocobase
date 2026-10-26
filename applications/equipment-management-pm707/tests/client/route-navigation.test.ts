import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';
import {
  buildRouteNavigation,
  selectedNavigationId,
} from '../../client/routing/route-navigation.js';

const page = (name: string, path: string): AppClientRegisteredRoute => ({
  name,
  id: name,
  path,
  auth: 'required',
  packageName: 'test',
  source: 'application',
  navigation: { title: name },
  componentLoader: async () => ({ default: () => null }),
});

describe('route navigation', () => {
  it('promotes visible descendants of hidden pages and removes denied subtrees and empty groups', () => {
    const routes = [
      {
        ...page('hidden', '/hidden'),
        navigation: undefined,
        children: [page('child', '/hidden/child')],
      },
      {
        ...page('denied', '/denied'),
        children: [page('secret', '/denied/secret')],
      },
      { ...page('empty', '/empty'), componentLoader: undefined, children: [] },
    ];
    expect(
      buildRouteNavigation(routes, new Set(['test:/denied:denied'])).map(
        ({ route }) => route.id,
      ),
    ).toEqual(['child']);
  });
  it('does not select an unrelated menu for a matched hidden root page', () => {
    const routes = [
      page('home', '/'),
      { ...page('hidden', '/hidden'), navigation: undefined },
    ];
    expect(selectedNavigationId(routes, '/hidden')).toBeUndefined();
  });

  it('selects the deepest menu page through hidden descendants and multiple groups', () => {
    const routes = [
      {
        ...page('group', '/'),
        componentLoader: undefined,
        children: [
          {
            ...page('orders', '/orders'),
            children: [
              { ...page('detail', '/orders/:orderId'), navigation: undefined },
            ],
          },
        ],
      },
    ];
    expect(selectedNavigationId(routes, '/orders/42')).toBe(
      'test:/orders:orders',
    );
  });
});
