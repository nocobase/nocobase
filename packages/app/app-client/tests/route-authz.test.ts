import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import {
  defineAppRoutes,
  resolveAppClientContributions,
  type AppClientRoutePageDefinition,
} from '../src/plugins.js';

const componentLoader = async () => ({ default: () => null });
const check = { resource: { type: 'report', id: 'orders' }, action: 'read' };

it('keeps declared checks and preserves parent guards when a child skips', () => {
  const page = { resource: { type: 'page', id: 'orders' }, action: 'access' };
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
              authz: page,
              componentLoader,
              children: [
                { name: 'skip', path: 'skip', authz: 'skip', componentLoader },
                {
                  name: 'report',
                  path: 'report',
                  authz: check,
                  componentLoader,
                },
              ],
            },
          ],
        },
      ]),
    },
  ]);
  const group = result.routes[0]!;
  const orders = group.children![0]!;
  expect(group.authz).toBe('skip');
  expect(orders.authz).toEqual(page);
  expect(orders.children!.map((child) => child.authz)).toEqual(['skip', check]);
  expect(Object.isFrozen(orders.children![1]!.authz)).toBe(true);
});

const settle = (
  routes: Parameters<typeof resolveAppClientContributions>[0][number]['routes'],
) => resolveAppClientContributions([{ packageName: 'example', routes }]);

describe('a page without authz', () => {
  let warn: MockInstance<typeof console.warn>;
  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it('keeps explicit values, including unrestricted', () => {
    const result = settle(
      defineAppRoutes([
        { name: 'a', path: '/a', authz: 'skip', componentLoader },
        { name: 'b', path: '/b', authz: 'unrestricted', componentLoader },
        { name: 'c', path: '/c', authz: check, componentLoader },
      ]),
    );
    expect(result.routes.map((route) => route.authz)).toEqual([
      'skip',
      'unrestricted',
      check,
    ]);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([check, 'skip', 'unrestricted'] as const)(
    'inherits %j from the nearest ancestor page through groups and several levels',
    (authz) => {
      const result = settle(
        defineAppRoutes([
          {
            name: 'orders',
            path: '/orders',
            authz,
            componentLoader,
            children: [
              {
                name: 'section',
                navigation: { title: 'Section' },
                children: [
                  {
                    name: 'detail',
                    path: 'detail',
                    componentLoader,
                    children: [
                      { name: 'history', path: 'history', componentLoader },
                    ],
                  },
                ],
              },
            ],
          },
        ]),
      );
      const section = result.routes[0]!.children![0]!;
      const detail = section.children![0]!;
      expect(section.authz).toBe('skip');
      expect(detail.authz).toEqual(authz);
      expect(detail.children![0]!.authz).toEqual(authz);
      expect(warn).not.toHaveBeenCalled();
    },
  );

  it('lets a child override what its descendants inherit', () => {
    const result = settle(
      defineAppRoutes([
        {
          name: 'orders',
          path: '/orders',
          authz: 'unrestricted',
          componentLoader,
          children: [
            {
              name: 'report',
              path: 'report',
              authz: check,
              componentLoader,
              children: [{ name: 'daily', path: 'daily', componentLoader }],
            },
          ],
        },
      ]),
    );
    const report = result.routes[0]!.children![0]!;
    expect(report.authz).toEqual(check);
    expect(report.children![0]!.authz).toEqual(check);
  });

  it('defaults the first page by auth, without throwing', () => {
    const result = settle([
      defineAppRoutes([
        { name: 'protected', path: '/protected', componentLoader },
        {
          name: 'guest',
          path: '/guest',
          auth: 'guest',
          componentLoader,
        },
        {
          name: 'optional',
          path: '/optional',
          auth: 'optional',
          componentLoader,
        },
        {
          name: 'group',
          navigation: { title: 'Group' },
          children: [{ name: 'grouped', path: '/grouped', componentLoader }],
        },
      ]),
    ]);
    expect(result.routes.map((route) => route.authz)).toEqual([
      'unrestricted',
      'skip',
      'skip',
      'skip',
    ]);
    expect(result.routes[3]!.children![0]!.authz).toBe('unrestricted');
  });

  it('warns once per defaulted route with its id, path and default', () => {
    settle([
      defineAppRoutes([
        {
          name: 'orders',
          path: '/orders',
          componentLoader,
          children: [{ name: 'detail', path: ':id', componentLoader }],
        },
        {
          name: 'public',
          path: '/public',
          auth: 'optional',
          componentLoader,
        },
      ]),
    ]);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0]![0]).toMatch(
      /"example:orders" at "\/orders".*"unrestricted".*Declare authz/,
    );
    expect(warn.mock.calls[1]![0]).toMatch(
      /"example:public" at "\/public".*"skip".*Declare authz/,
    );
  });
});

it.each([
  { access: false },
  { access: { resource: 'orders', action: 'access' } },
  { authz: false },
  { authz: null },
  { authz: 'orders' },
  { authz: { resource: 'orders', action: 'access' } },
  { authz: { resource: { type: '', id: 'orders' }, action: 'access' } },
  { authz: { resource: { type: 'page', id: '' }, action: 'access' } },
  { authz: { resource: { type: 'page', id: 'orders' }, action: '' } },
])(
  'rejects removed or malformed authorization declarations: %j',
  (declaration) => {
    expect(() =>
      resolveAppClientContributions([
        {
          packageName: 'example',
          routes: defineAppRoutes([
            {
              name: 'orders',
              path: '/orders',
              componentLoader,
              ...declaration,
            } as unknown as AppClientRoutePageDefinition,
          ]),
        },
      ]),
    ).toThrow(/authz/);
  },
);
