import { expect, it } from 'vitest';
import {
  defineAppRoutes,
  resolveAppClientContributions,
} from '../src/plugins.js';

const componentLoader = async () => ({ default: () => null });

it('keeps a trimmed navigation description and drops a blank one', () => {
  const { routes } = resolveAppClientContributions([
    {
      packageName: '@example/app',
      routes: defineAppRoutes([
        {
          name: 'users',
          path: '/users',
          navigation: { title: 'Users', description: '  Manage accounts. ' },
          componentLoader,
        },
        {
          name: 'roles',
          path: '/roles',
          navigation: { title: 'Roles', description: '   ' },
          componentLoader,
        },
      ]),
    },
  ]);
  expect(routes[0].navigation).toEqual({
    title: 'Users',
    description: 'Manage accounts.',
  });
  expect(routes[1].navigation).not.toHaveProperty('description');
  expect(Object.isFrozen(routes[0].navigation)).toBe(true);
});
