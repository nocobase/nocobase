import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';
import {
  buildRouteNavigation,
  selectedNavigationId,
  routeKey,
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

it('combines workflow plugin pages into two flat sections without changing page identity or permissions', () => {
  const lifecycle = '@nocobase/app-plugin-lifecycle-example';
  const office = '@nocobase/app-plugin-office-flows-example';
  const owned = (name: string, owner: string) => ({
    ...page(name, `/${name}`),
    packageName: owner,
  });
  const ticket = owned('ticket', lifecycle);
  const parameters = owned('lifecycleExampleParameters', lifecycle);
  const incoming = owned('incoming', office);
  const configuration = owned('officeFlowsConfiguration', office);
  const request = owned('officeTask', office);
  const management = owned('workflows', '@nocobase/app-template-examples');
  const group = (
    name: string,
    owner: string,
    children: AppClientRegisteredRoute[],
  ) => ({
    ...owned(name, owner),
    path: '/',
    componentLoader: undefined,
    children,
  });
  const routes = [
    page('home', '/'),
    group('lifecycle', lifecycle, [ticket, parameters, management]),
    group('office', office, [
      incoming,
      configuration,
      group('nested', office, [request]),
    ]),
  ];
  const items = buildRouteNavigation(routes, new Set([routeKey(incoming)]));
  expect(items.map((item) => item.route.name)).toEqual([
    'home',
    'workflowNavigation',
  ]);
  const sections = items[1].children;
  expect(sections.map((item) => item.route.name)).toEqual([
    'workflowBusiness',
    'workflowManagement',
  ]);
  expect(sections.every((item) => item.section)).toBe(true);
  expect(sections[0].children.map((item) => item.route)).toEqual([
    ticket,
    request,
  ]);
  expect(sections[1].children.map((item) => item.route)).toEqual([
    parameters,
    management,
    configuration,
  ]);
  expect(
    sections
      .flatMap((item) => item.children)
      .every((item) => item.children.length === 0),
  ).toBe(true);
  expect(selectedNavigationId(routes, ticket.path)).toBe(routeKey(ticket));
});
