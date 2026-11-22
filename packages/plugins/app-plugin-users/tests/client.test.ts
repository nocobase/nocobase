import {
  applyClientRouteComponentOverrides,
  defineClientRouteComponentOverrides,
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
  type AppClientRouteComponentLoader,
} from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';

import {
  INVITE_ROUTE_ID,
  RoleSelection,
  USER_CREATE_ROUTE_ID,
  USER_EDIT_ROUTE_ID,
  USERS_ROUTE_ID,
  UserForm,
  UsersClient,
} from '../client/index.js';
import users from '../client/plugin.js';
import UserFormPage from '../client/pages/users/user-form.js';
import UsersPage from '../client/pages/users/users.js';

const resolve = (
  registration: ReturnType<typeof users>,
): readonly AppClientRegisteredRoute[] =>
  resolveAppClientContributions([
    {
      packageName: registration.packageName,
      source: 'plugin',
      routes: registration.routes,
    },
  ]).routes;

const flatten = (
  routes: readonly AppClientRegisteredRoute[],
): AppClientRegisteredRoute[] =>
  routes.flatMap((route) => [route, ...flatten(route.children ?? [])]);

const byId = (routes: readonly AppClientRegisteredRoute[], id: string) => {
  const route = flatten(routes).find((candidate) => candidate.id === id);
  if (!route) throw new Error(`Route ${id} is not registered.`);
  return route;
};

const component = async (
  routes: readonly AppClientRegisteredRoute[],
  id: string,
) => (await byId(routes, id).componentLoader!()).default;

const replacement = (name: string): AppClientRouteComponentLoader => {
  const Replacement = () => null;
  Object.defineProperty(Replacement, 'name', { value: name });
  return () => Promise.resolve({ default: Replacement });
};

describe('@nocobase/app-plugin-users Client routes', () => {
  it('serves the invitation page to visitors without a session', async () => {
    const registration = users();
    expect(registration.serviceProviders).toEqual([]);
    const invite = byId(resolve(registration), INVITE_ROUTE_ID);
    expect(invite).toMatchObject({
      path: '/invite/:token',
      auth: 'optional',
      authz: 'skip',
    });
    await expect(invite.componentLoader!()).resolves.toMatchObject({
      default: expect.any(Function),
    });
  }, 15_000);

  it('registers User management in the Accounts and permissions settings category', async () => {
    const routes = resolve(users());
    const account = routes.find(
      (route) => route.name === 'systemSettings.account',
    );
    expect(account).toBeDefined();
    const list = byId(routes, USERS_ROUTE_ID);
    expect(flatten(account!.children ?? [])).toContain(list);
    expect(list).toMatchObject({
      path: '/settings/users',
      auth: 'required',
      authz: { resource: { type: 'user', id: '*' }, action: 'read' },
      navigation: {
        title: 'management.users',
        description: 'management.usersDescription',
      },
      packageName: '@nocobase/app-plugin-users',
    });
    expect(byId(routes, USER_CREATE_ROUTE_ID)).toMatchObject({
      path: '/settings/users/create',
      authz: { resource: { type: 'user', id: '*' }, action: 'create' },
      presentation: { kind: 'dialog', title: 'management.newUser' },
    });
    expect(byId(routes, USER_EDIT_ROUTE_ID)).toMatchObject({
      path: '/settings/users/:userId/edit',
      presentation: { kind: 'drawer', title: 'management.editUser' },
    });
    expect(byId(routes, '@nocobase/app-plugin-users:settingsUser').path).toBe(
      '/settings/users/:userId',
    );
    expect(await component(routes, USERS_ROUTE_ID)).toBe(UsersPage);
    expect(await component(routes, USER_CREATE_ROUTE_ID)).toBe(UserFormPage);
    expect(await component(routes, USER_EDIT_ROUTE_ID)).toBe(UserFormPage);
  }, 15_000);

  it('exports the user form and API client for applications that replace a page', () => {
    expect(UserForm).toBe(UserFormPage);
    expect(RoleSelection).toEqual(expect.any(Function));
    expect(UsersClient).toEqual(expect.any(Function));
  });

  it('replaces only the list, keeping the plugin dialog and drawer', async () => {
    const routes = applyClientRouteComponentOverrides(
      resolve(users()),
      defineClientRouteComponentOverrides([
        { routeId: USERS_ROUTE_ID, componentLoader: replacement('MyUsers') },
      ]),
    );
    expect((await component(routes, USERS_ROUTE_ID)).name).toBe('MyUsers');
    expect(await component(routes, USER_CREATE_ROUTE_ID)).toBe(UserFormPage);
    expect(await component(routes, USER_EDIT_ROUTE_ID)).toBe(UserFormPage);
    // The address, authorization and presentation stay the plugin's.
    expect(byId(routes, USERS_ROUTE_ID).path).toBe('/settings/users');
    expect(byId(routes, USER_EDIT_ROUTE_ID).presentation?.kind).toBe('drawer');
  }, 15_000);

  it('replaces all three pages when each is overridden', async () => {
    const routes = applyClientRouteComponentOverrides(
      resolve(users()),
      defineClientRouteComponentOverrides([
        { routeId: USERS_ROUTE_ID, componentLoader: replacement('MyUsers') },
        {
          routeId: USER_CREATE_ROUTE_ID,
          componentLoader: replacement('MyCreate'),
        },
        { routeId: USER_EDIT_ROUTE_ID, componentLoader: replacement('MyEdit') },
      ]),
    );
    expect((await component(routes, USERS_ROUTE_ID)).name).toBe('MyUsers');
    expect((await component(routes, USER_CREATE_ROUTE_ID)).name).toBe(
      'MyCreate',
    );
    expect((await component(routes, USER_EDIT_ROUTE_ID)).name).toBe('MyEdit');
  });

  it('lets an application replace the invitation page without changing its identity', () => {
    const inviteComponentLoader = () =>
      Promise.resolve({ default: () => null as never });
    expect(users({ inviteComponentLoader }).routeComponentOverrides).toEqual([
      {
        routeId: '@nocobase/app-plugin-users:invite',
        componentLoader: inviteComponentLoader,
      },
    ]);
  });
});
