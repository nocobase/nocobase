import { expect, it } from 'vitest';
import {
  defineAppRoutes,
  resolveAppClientContributions,
  applyClientRouteComponentOverrides,
} from '../src/plugins.js';
const componentLoader = async () => ({ default: () => null });
it('resolves nested pages and pathless navigation groups as trees', () => {
  const result = resolveAppClientContributions([
    {
      packageName: 'example',
      routes: defineAppRoutes([
        {
          name: 'business',
          navigation: { title: 'Business' },
          children: [
            {
              name: 'orders',
              path: '/orders',
              navigation: { title: 'Orders' },
              authz: {
                resource: { type: 'page', id: 'orders' },
                action: 'access',
              },
              componentLoader,
              children: [
                {
                  name: 'detail',
                  path: ':orderId',
                  authz: 'skip',
                  componentLoader,
                },
              ],
            },
          ],
        },
      ]),
    },
  ]);
  expect(result.routes[0]?.children?.[0]).toMatchObject({
    id: 'example:orders',
    path: '/orders',
    children: [{ id: 'example:detail', path: '/orders/:orderId' }],
  });
});
it('overrides nested pages without losing their children', () => {
  const result = resolveAppClientContributions([
    {
      packageName: 'example',
      routes: defineAppRoutes([
        {
          name: 'orders',
          path: '/orders',
          authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
          componentLoader,
          children: [
            {
              name: 'detail',
              path: ':orderId',
              authz: 'skip',
              componentLoader,
            },
          ],
        },
      ]),
    },
  ]);
  expect(
    applyClientRouteComponentOverrides(result.routes, [
      { routeId: 'example:detail', componentLoader },
    ])[0]?.children,
  ).toHaveLength(1);
});
it('rejects dynamic menu links and changed child authentication', () => {
  expect(() =>
    resolveAppClientContributions([
      {
        packageName: 'example',
        routes: defineAppRoutes([
          {
            name: 'detail',
            path: '/orders/:id',
            navigation: { title: 'Detail' },
            authz: {
              resource: { type: 'page', id: 'detail' },
              action: 'access',
            },
            componentLoader,
          },
        ]),
      },
    ]),
  ).toThrow(/navigation/i);
  expect(() =>
    resolveAppClientContributions([
      {
        packageName: 'example',
        routes: defineAppRoutes([
          {
            name: 'orders',
            path: '/orders',
            authz: {
              resource: { type: 'page', id: 'orders' },
              action: 'access',
            },
            componentLoader,
            children: [
              {
                name: 'detail',
                path: ':id',
                auth: 'optional',
                authz: 'skip',
                componentLoader,
              },
            ],
          },
        ]),
      },
    ]),
  ).toThrow(/auth/i);
});

it('rejects duplicate app names and conflicting child paths across groups', () => {
  const group = (name: string, childName: string, path: string) => ({
    name,
    navigation: { title: name },
    children: [
      {
        name: childName,
        path,
        authz: { resource: { type: 'page', id: childName }, action: 'access' },
        componentLoader,
      },
    ],
  });
  expect(() =>
    resolveAppClientContributions([
      {
        packageName: 'example',
        routes: defineAppRoutes([
          group('one', 'same', '/one'),
          group('two', 'same', '/two'),
        ]),
      },
    ]),
  ).toThrow(/duplicate client route name/);
  expect(() =>
    resolveAppClientContributions([
      {
        packageName: 'example',
        routes: defineAppRoutes([
          group('one', 'first', '/records/:id'),
          group('two', 'second', '/records/:recordId'),
        ]),
      },
    ]),
  ).toThrow(/conflicts/);
});

it('freezes recursive declarations and rejects overrides of groups', () => {
  const declaration = defineAppRoutes([
    {
      name: 'group',
      navigation: { title: 'Group' },
      children: [
        {
          name: 'page',
          path: '/page',
          authz: { resource: { type: 'page', id: 'page' }, action: 'access' },
          componentLoader,
        },
      ],
    },
  ]);
  expect(Object.isFrozen(declaration.routes[0]?.children?.[0])).toBe(true);
  expect(Object.isFrozen(declaration.routes[0]?.navigation)).toBe(true);
  const result = resolveAppClientContributions([
    { packageName: 'example', routes: declaration },
  ]);
  expect(() =>
    applyClientRouteComponentOverrides(result.routes, [
      { routeId: 'example:group', componentLoader },
    ]),
  ).toThrow(/group/);
});

it('resolves multiple navigation groups without changing descendant authentication or identity', () => {
  const result = resolveAppClientContributions([
    {
      packageName: 'example',
      routes: defineAppRoutes([
        {
          name: 'outer',
          auth: 'optional',
          navigation: { title: 'Outer' },
          children: [
            {
              name: 'inner',
              path: 'catalog',
              navigation: { title: 'Inner' },
              children: [
                { name: 'page', path: 'items', authz: 'skip', componentLoader },
              ],
            },
          ],
        },
      ]),
    },
  ]);
  expect(result.routes[0]?.children?.[0]?.children?.[0]).toMatchObject({
    id: 'example:page',
    path: '/catalog/items',
    auth: 'optional',
  });
});

it('preserves the parent and sibling loaders when overriding a nested page', async () => {
  const original = () => null;
  const replacement = () => null;
  const result = resolveAppClientContributions([
    {
      packageName: 'example',
      routes: defineAppRoutes([
        {
          name: 'parent',
          path: '/parent',
          authz: { resource: { type: 'page', id: 'parent' }, action: 'access' },
          componentLoader: async () => ({ default: original }),
          children: [
            { name: 'child', path: 'child', authz: 'skip', componentLoader },
          ],
        },
      ]),
    },
  ]);
  const overridden = applyClientRouteComponentOverrides(result.routes, [
    {
      routeId: 'example:child',
      componentLoader: async () => ({ default: replacement }),
    },
  ]);
  expect((await overridden[0]!.componentLoader!()).default).toBe(original);
  expect((await overridden[0]!.children![0]!.componentLoader!()).default).toBe(
    replacement,
  );
  expect(overridden[0]?.children?.[0]?.path).toBe('/parent/child');
});

it('names a child page through breadcrumb without putting it in a menu', () => {
  const result = resolveAppClientContributions([
    {
      packageName: 'example',
      routes: defineAppRoutes([
        {
          name: 'orders',
          path: '/orders',
          navigation: { title: 'Orders' },
          authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
          componentLoader,
          children: [
            // A menu entry needs a static path, so a detail page can only name itself through `breadcrumb`.
            {
              name: 'detail',
              path: ':orderId',
              breadcrumb: { title: 'Order detail' },
              authz: 'skip',
              componentLoader,
            },
            {
              name: 'preview',
              path: 'preview',
              authz: 'skip',
              componentLoader,
            },
          ],
        },
      ]),
    },
  ]);
  const orders = result.routes[0];

  // A menu entry is not a trail entry: declaring only `navigation` keeps the route out of the breadcrumb.
  expect(orders?.breadcrumb).toBeUndefined();
  expect(orders?.children?.[0]).toMatchObject({
    path: '/orders/:orderId',
    breadcrumb: { title: 'Order detail' },
  });
  expect(orders?.children?.[0]?.navigation).toBeUndefined();
  // Structure that names no destination carries no breadcrumb, which is how a consumer tells the two apart.
  expect(orders?.children?.[1]?.breadcrumb).toBeUndefined();
});

it('keeps the menu title and the breadcrumb title independent', () => {
  const result = resolveAppClientContributions([
    {
      packageName: 'example',
      routes: defineAppRoutes([
        {
          name: 'orders',
          path: '/orders',
          breadcrumb: { title: 'All orders' },
          navigation: { title: 'Orders' },
          authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
          componentLoader,
        },
      ]),
    },
  ]);

  expect(result.routes[0]).toMatchObject({
    breadcrumb: { title: 'All orders' },
    navigation: { title: 'Orders' },
  });
});

it('rejects a blank title', () => {
  expect(() =>
    resolveAppClientContributions([
      {
        packageName: 'example',
        routes: defineAppRoutes([
          {
            name: 'orders',
            path: '/orders',
            breadcrumb: { title: '  ' },
            authz: {
              resource: { type: 'page', id: 'orders' },
              action: 'access',
            },
            componentLoader,
          },
        ]),
      },
    ]),
  ).toThrow(/must define a non-empty title/);
});

it('rejects an empty breadcrumb title', () => {
  expect(() =>
    resolveAppClientContributions([
      {
        packageName: 'example',
        routes: defineAppRoutes([
          {
            name: 'orders',
            path: '/orders',
            breadcrumb: { title: '' },
            navigation: { title: 'Orders' },
            authz: {
              resource: { type: 'page', id: 'orders' },
              action: 'access',
            },
            componentLoader,
          },
        ]),
      },
    ]),
  ).toThrow(/must define a non-empty title/);
});
