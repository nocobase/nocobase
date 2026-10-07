import { describe, expect, it, vi } from 'vitest';
import { UsersRound } from 'lucide-react';

import users from '../client/plugin.js';
import {
  createRoleFilterOptions,
  createStatusFilterOptions,
} from '../client/filter-options.js';
import {
  emptyUserCapabilities,
  loadUserCapabilities,
  USER_MANAGEMENT_ACTIONS,
} from '../client/user-permissions.js';
import {
  assignableRoleScopes,
  emptyRoleScopeValues,
  hasEveryRequiredRoleScope,
  localizeRoleScopes,
  selectedRoleScopeValues,
} from '../client/role-scopes.js';

describe('@nocobase/app-plugin-users Client routes', () => {
  it('keeps filter values internal while exposing readable labels', () => {
    expect(
      createStatusFilterOptions({
        all: 'All statuses',
        enabled: 'Enabled',
        disabled: 'Disabled',
      }),
    ).toEqual([
      { value: 'all', label: 'All statuses' },
      { value: 'enabled', label: 'Enabled' },
      { value: 'disabled', label: 'Disabled' },
    ]);
    expect(
      createRoleFilterOptions(
        [
          {
            key: 'hub',
            label: 'Hub role',
            selection: 'single',
            requiredOnCreate: true,
            hasAuthenticatedDefaultAccess: false,
            options: [
              { value: 'hub-administrator', label: 'Administrator' },
              { value: 'hub-viewer', label: 'Viewer' },
            ],
          },
        ],
        'All roles',
      ),
    ).toEqual([
      { value: 'all', label: 'All roles' },
      { value: 'hub:hub-administrator', label: 'Administrator' },
      { value: 'hub:hub-viewer', label: 'Viewer' },
    ]);
  });

  it('requires an explicit role choice and omits empty optional scopes', () => {
    const scopes = [
      {
        key: 'hub',
        label: 'Hub role',
        selection: 'single' as const,
        requiredOnCreate: true,
        hasAuthenticatedDefaultAccess: false,
        options: [
          { value: 'hub-administrator', label: 'Administrator' },
          { value: 'hub-viewer', label: 'Viewer' },
        ],
      },
      {
        key: 'teams',
        label: 'Teams',
        selection: 'multiple' as const,
        requiredOnCreate: false,
        hasAuthenticatedDefaultAccess: true,
        options: [{ value: 'support', label: 'Support' }],
      },
    ];
    const empty = emptyRoleScopeValues(scopes);

    expect(empty).toEqual({ hub: '', teams: [] });
    expect(hasEveryRequiredRoleScope(scopes, empty)).toBe(false);
    expect(
      selectedRoleScopeValues(scopes, {
        ...empty,
        hub: 'hub-viewer',
      }),
    ).toEqual({ hub: 'hub-viewer' });
  });

  it('localizes role labels and omits protected-only scopes from creation', () => {
    const scopes = [
      {
        key: 'app',
        label: 'Roles',
        labelI18nKey: 'page.roles',
        labelI18nNs: '@nocobase/app-plugin-users',
        selection: 'multiple' as const,
        requiredOnCreate: false,
        hasAuthenticatedDefaultAccess: true,
        options: [
          {
            value: 'system-administrator',
            label: 'System administrator',
            labelI18nKey: 'page.systemAdministrator',
            labelI18nNs: '@nocobase/app-plugin-users',
            assignable: false,
            removable: false,
          },
        ],
      },
    ];

    expect(
      localizeRoleScopes(scopes, (key) =>
        key === 'page.roles' ? '角色' : '系统管理员',
      ),
    ).toMatchObject([
      {
        label: '角色',
        options: [{ label: '系统管理员' }],
      },
    ]);
    expect(assignableRoleScopes(scopes)).toEqual([]);
  });

  it('loads every user action for button-level access control', async () => {
    const can = vi.fn(
      ({
        action,
      }: {
        resource: { type: string; id: string };
        action: string;
      }) => Promise.resolve(action === 'update'),
    );

    await expect(loadUserCapabilities({ can }, 'user-1')).resolves.toEqual({
      ...emptyUserCapabilities(),
      update: true,
    });
    expect(can.mock.calls).toEqual(
      USER_MANAGEMENT_ACTIONS.map((action) => [
        { resource: { type: 'user', id: 'user-1' }, action },
      ]),
    );
  });
  it('mounts one protected Settings page at a relative path', async () => {
    const registration = users({ mount: 'settings', path: '/users' });
    expect(registration.serviceProviders).toEqual([]);
    expect(registration.routes).toHaveLength(2);
    expect(registration.routes[0]).toMatchObject({
      parent: 'settings',
      routes: [
        {
          name: 'users',
          path: '/users',
          authz: { resource: { type: 'page', id: 'users' }, action: 'access' },
        },
      ],
    });
    await expect(
      registration.routes[0]?.routes[0]?.componentLoader(),
    ).resolves.toMatchObject({ default: expect.any(Function) });
  });

  it('serves the invitation page to visitors without a session', async () => {
    const registration = users({ mount: 'settings' });
    expect(registration.routes[1]).toMatchObject({
      parent: 'app',
      routes: [
        {
          name: 'invite',
          path: '/invite/:token',
          auth: 'optional',
          authz: 'skip',
        },
      ],
    });
    await expect(
      registration.routes[1]?.routes[0]?.componentLoader(),
    ).resolves.toMatchObject({ default: expect.any(Function) });
  });

  it('can mount the same owned route in the App without changing its identity', () => {
    const componentLoader = () =>
      Promise.resolve({ default: () => null as never });
    const registration = users({
      mount: 'app',
      path: '/team/users',
      componentLoader,
    });
    expect(registration.routes[0]).toMatchObject({
      parent: 'app',
      routes: [
        {
          name: 'users',
          path: '/team/users',
          auth: 'required',
          authz: { resource: { type: 'page', id: 'users' }, action: 'access' },
          navigation: { title: 'nav.users', icon: UsersRound },
        },
        { name: 'invite', path: '/invite/:token' },
      ],
    });
    expect(registration.serviceProviders).toEqual([]);
    expect(registration.routeComponentOverrides).toEqual([
      {
        routeId: '@nocobase/app-plugin-users:users',
        componentLoader,
      },
    ]);
  });

  it('does not accept a Settings-prefixed relative path', () => {
    expect(() => users({ path: '/settings/users' })).toThrow(
      'must not include /settings',
    );
  });
});
