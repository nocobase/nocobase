import { describe, expect, it } from 'vitest';
import {
  defineAppRoutes,
  resolveAppClientContributions,
  type AppClientRouteDefinition,
} from '../src/plugins.js';

const page = async () => ({ default: () => null });

describe('app parent contributions', () => {
  const define = defineAppRoutes;
  const resolve = (definitions: readonly AppClientRouteDefinition[]) =>
    resolveAppClientContributions([
      { packageName: '@example/owner', routes: define(definitions) },
    ]);
  const parent = '@example/owner:tools';

  it('supports forward references, nested groups, stable sorting and original ownership', () => {
    const owner = {
      packageName: '@example/owner',
      routes: define([
        {
          name: 'tools',
          path: '/tools',
          navigation: { title: 'Tools' },
          children: [
            {
              name: 'last',
              path: '/last',
              navigation: { title: 'Last', order: 10 },
              authz: {
                resource: { type: 'page', id: 'last' },
                action: 'access',
              },
              componentLoader: page,
            },
          ],
        },
        {
          name: 'first',
          path: '/first',
          navigation: { title: 'First', order: -10 },
          authz: { resource: { type: 'page', id: 'first' }, action: 'access' },
          componentLoader: page,
        },
      ]),
    };
    const child = {
      packageName: '@example/extension',
      routes: define([
        {
          parent,
          name: 'nested',
          path: '/nested',
          navigation: { title: 'Nested' },
          children: [],
        },
        {
          parent: 'nested',
          name: 'leaf',
          path: '/leaf',
          authz: { resource: { type: 'page', id: 'leaf' }, action: 'access' },
          componentLoader: page,
        },
        {
          parent,
          name: 'sibling',
          path: '/sibling',
          authz: {
            resource: { type: 'page', id: 'sibling' },
            action: 'access',
          },
          componentLoader: page,
        },
      ]),
    };
    for (const contributions of [
      [child, owner],
      [owner, child],
    ]) {
      const result = resolveAppClientContributions(contributions);
      const tree = result.routes;
      expect(tree.map((node) => node.name)).toEqual(['first', 'tools']);
      expect(tree[1]?.children?.map((node) => node.name)).toEqual([
        'nested',
        'sibling',
        'last',
      ]);
      expect(tree[1]?.children?.[0]?.children?.[0]).toMatchObject({
        path: '/tools/nested/leaf',
        packageName: '@example/extension',
        source: 'plugin',
      });
    }
    expect(owner.routes.routes[0]?.children).toHaveLength(1);
    expect(child.routes.routes[0]?.children).toHaveLength(0);
  });

  it('rejects missing parents, pages as parents, cycles and nested parent declarations', () => {
    for (const parent of ['missing', 'page']) {
      expect(() =>
        resolve([
          {
            name: 'page',
            path: '/page',
            authz: { resource: { type: 'page', id: 'page' }, action: 'access' },
            componentLoader: page,
          },
          {
            parent,
            name: 'child',
            path: '/child',
            authz: {
              resource: { type: 'page', id: 'child' },
              action: 'access',
            },
            componentLoader: page,
          },
        ]),
      ).toThrow('missing group');
    }
    expect(() =>
      resolve([
        { name: 'a', parent: 'b', navigation: { title: 'A' }, children: [] },
        { name: 'b', parent: 'a', navigation: { title: 'B' }, children: [] },
      ]),
    ).toThrow('Circular app parent');
    expect(() =>
      resolve([
        {
          name: 'a',
          navigation: { title: 'A' },
          children: [
            {
              parent: 'a',
              name: 'b',
              path: '/b',
              authz: { resource: { type: 'page', id: 'b' }, action: 'access' },
              componentLoader: page,
            },
          ],
        },
      ]),
    ).toThrow('cannot declare parent inside children');
  });
});

it('inherits app auth across plugins and rejects changing it', () => {
  const owner = {
    packageName: '@example/owner',
    routes: defineAppRoutes([
      {
        name: 'public',
        path: '/public',
        auth: 'guest',
        navigation: { title: 'Public' },
        children: [],
      },
    ]),
  };
  const child = (auth?: 'guest' | 'required') => ({
    packageName: '@example/extension',
    routes: defineAppRoutes([
      {
        parent: '@example/owner:public',
        name: 'leaf',
        path: '/leaf',
        ...(auth ? { auth } : {}),
        authz: 'skip' as const,
        componentLoader: page,
      },
    ]),
  });
  expect(
    resolveAppClientContributions([child(), owner]).routes[0]?.children?.[0]
      ?.auth,
  ).toBe('guest');
  expect(() =>
    resolveAppClientContributions([owner, child('required')]),
  ).toThrow('cannot change inherited auth');
});
