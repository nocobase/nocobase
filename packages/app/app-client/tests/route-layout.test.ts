import { expect, it } from 'vitest';
import {
  defineAppRoutes,
  defineSystemSettingsRoutes,
  resolveAppClientContributions,
} from '../src/plugins.js';

const page = {
  name: 'report',
  path: '/report',
  authz: 'skip',
  componentLoader: async () => ({ default: () => null }),
} as const;

it('registers the contribution layout on signed-in routes and their children', () => {
  const { routes } = resolveAppClientContributions([
    {
      packageName: 'reports',
      routes: defineAppRoutes(
        [
          {
            ...page,
            children: [{ ...page, name: 'detail', path: 'detail' }],
          },
          { ...page, name: 'public', path: '/public', auth: 'optional' },
        ],
        { layout: 'none' },
      ),
    },
  ]);

  expect(routes[0]).toMatchObject({
    layout: 'none',
    auth: 'required',
    authz: 'skip',
    children: [{ layout: 'none', path: '/report/detail' }],
  });
  expect(routes[1]).not.toHaveProperty('layout');
});

it('supports a standalone page next to an ordinary page in a navigation group', () => {
  const { routes } = resolveAppClientContributions([
    {
      packageName: 'reports',
      routes: defineAppRoutes([
        {
          name: 'group',
          navigation: { title: 'Reports' },
          children: [
            { ...page, layout: 'none' },
            { ...page, name: 'summary', path: '/summary' },
          ],
        },
      ]),
    },
  ]);

  expect(routes[0]?.children?.[0]).toMatchObject({ layout: 'none' });
  expect(routes[0]?.children?.[1]).not.toHaveProperty('layout');
});

it('rejects invalid layout values in options and on routes', () => {
  const layout = 'unknown' as 'none';
  for (const routes of [
    defineAppRoutes([page], { layout }),
    defineAppRoutes([{ ...page, layout }]),
  ]) {
    expect(() =>
      resolveAppClientContributions([{ packageName: 'reports', routes }]),
    ).toThrow(/must use layout "none"/);
  }
});

it('rejects standalone declarations on guest and settings routes', () => {
  expect(() =>
    resolveAppClientContributions([
      {
        packageName: 'reports',
        routes: defineAppRoutes([{ ...page, auth: 'guest', layout: 'none' }]),
      },
    ]),
  ).toThrow(/requires auth "required"/);
  expect(() =>
    resolveAppClientContributions([
      {
        packageName: 'reports',
        routes: defineSystemSettingsRoutes([{ ...page, layout: 'none' }]),
      },
    ]),
  ).toThrow(/can only declare layout in defineAppRoutes/);
});

it('rejects a layout change within a parent page and its outlets', () => {
  expect(() =>
    resolveAppClientContributions([
      {
        packageName: 'reports',
        routes: defineAppRoutes([
          {
            ...page,
            children: [
              { ...page, name: 'detail', path: 'detail', layout: 'none' },
            ],
          },
        ]),
      },
    ]),
  ).toThrow(/must share its ancestor page's layout/);
});
