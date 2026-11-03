import { describe, expect, it } from 'vitest';
import {
  ResourceItems,
  createAuthorization,
  grantBacked,
  type AuthorizationGrant,
} from '../src/core/index.js';
import { grantProvider } from './helpers/grant-provider.js';

const alice = { principal: { type: 'user', id: 'alice' } };

function withGrants(
  grants: readonly Omit<AuthorizationGrant, 'source'>[],
  unrestricted = false,
): ReturnType<typeof createAuthorization> {
  return createAuthorization({
    plugins: [{ id: 'grants', grants: grantProvider(grants, unrestricted) }],
  });
}

describe('resource types', () => {
  it('registers a type with its capabilities and no display data', () => {
    const authz = createAuthorization({ plugins: [] });
    const items = new ResourceItems();
    authz.resourceTypes.add({
      type: 'report',
      actions: ['read'],
      items,
    });
    authz.resourceTypes.add({
      type: 'ledger',
      actions: ['read'],
      recordAccess: true,
    });
    expect(authz.resourceTypes.get('report')).toEqual({
      type: 'report',
      actions: [{ name: 'read' }],
      recordAccess: false,
      items,
    });
    expect(authz.resourceTypes.get('ledger').recordAccess).toBe(true);
    expect(() => authz.resourceTypes.get('missing')).toThrow(/not registered/);
    expect(() =>
      authz.resourceTypes.add({ type: 'report', actions: ['x'] }),
    ).toThrow(/already registered/);
    expect(() => authz.resourceTypes.add({ type: 'bare' })).toThrow(
      /needs items or declared actions/,
    );
  });
});

describe('the reserved composite type', () => {
  it('is registered by the core and cannot be registered again', () => {
    const authz = createAuthorization({ plugins: [] });
    expect(authz.resourceTypes.list().map((type) => type.type)).toEqual([
      'composite',
    ]);
    expect(() =>
      authz.resourceTypes.add({ type: 'composite', actions: ['run'] }),
    ).toThrow(/reserved for composite resources/);
    expect(() =>
      createAuthorization({
        plugins: [
          {
            id: 'squatter',
            setup(host) {
              host.resourceTypes.add({ type: 'composite', actions: ['run'] });
            },
          },
        ],
      }),
    ).toThrow(/reserved for composite resources/);
  });
});

describe('resource items', () => {
  it('inherits declared actions and their titles', () => {
    const authz = createAuthorization({ plugins: [] });
    const items = new ResourceItems();
    items.add({ id: 'sales', title: 'Sales' });
    items.add({
      id: 'costs',
      title: 'Costs',
      actions: [{ name: 'read', title: 'View' }],
    });
    authz.resourceTypes.add({
      type: 'report',
      items,
      actions: [{ name: 'read', title: 'Read' }, 'export'],
    });
    expect(items.list()).toEqual([
      {
        id: 'sales',
        title: 'Sales',
        actions: [{ name: 'read', title: 'Read' }, { name: 'export' }],
      },
      {
        id: 'costs',
        title: 'Costs',
        actions: [{ name: 'read', title: 'View' }],
      },
    ]);
    expect(() =>
      items.add({ id: 'bad', title: 'Bad', actions: ['delete'] }),
    ).toThrow(/does not declare action delete/);
    expect(() => items.add({ id: 'sales', title: 'Again' })).toThrow(
      /already registered/,
    );
  });

  it('requires item actions when the type declares none', () => {
    const authz = createAuthorization({ plugins: [] });
    const settings = new ResourceItems();
    authz.resourceTypes.add({ type: 'settings', items: settings });
    expect(() => settings.add({ id: 'workflow', title: 'W' })).toThrow(
      /needs actions/,
    );
    settings.add({ id: 'workflow', title: 'W', actions: ['manage'] });
    expect(settings.get('workflow')?.actions).toEqual([{ name: 'manage' }]);
  });

  it('denies an unregistered item or action, even without restriction', async () => {
    for (const unrestricted of [false, true]) {
      const authz = withGrants(
        [
          { resource: { type: 'report', id: '*' }, action: 'read' },
          { resource: { type: 'report', id: '*' }, action: 'delete' },
        ],
        unrestricted,
      );
      const items = new ResourceItems();
      authz.resourceTypes.add({ type: 'report', items });
      items.add({ id: 'sales', title: 'Sales', actions: ['read'] });
      const context = authz.for(alice);
      await expect(
        context.can({
          resource: { type: 'report', id: 'sales' },
          action: 'read',
        }),
      ).resolves.toBe(true);
      for (const request of [
        { resource: { type: 'report', id: 'costs' }, action: 'read' },
        { resource: { type: 'report', id: 'sales' }, action: 'delete' },
      ])
        await expect(context.authorize(request)).resolves.toMatchObject({
          effect: 'deny',
          reasons: [{ code: 'RESOURCE_ACTION_NOT_SUPPORTED' }],
        });
    }
  });

  it('accepts any record id for a declared action and denies an undeclared one', async () => {
    const authz = withGrants([
      { resource: { type: 'hub.app', id: '*' }, action: 'read' },
      { resource: { type: 'hub.app', id: '*' }, action: 'erase' },
    ]);
    const registered = authz.resourceTypes.add({
      type: 'hub.app',
      actions: ['read'],
    });
    expect(registered.items).toBeUndefined();
    expect(registered.actions).toEqual([{ name: 'read' }]);
    const context = authz.for(alice);
    for (const id of ['app-1', 'app-2', '*'])
      await expect(
        context.can({ resource: { type: 'hub.app', id }, action: 'read' }),
      ).resolves.toBe(true);
    await expect(
      context.authorize({
        resource: { type: 'hub.app', id: 'app-1' },
        action: 'erase',
      }),
    ).resolves.toMatchObject({
      effect: 'deny',
      reasons: [{ code: 'RESOURCE_ACTION_NOT_SUPPORTED' }],
    });
  });
});

describe('grantBacked', () => {
  it('permits only on a policy-less matching grant', async () => {
    const authz = withGrants([
      { resource: { type: 'user', id: '*' }, action: 'read' },
      {
        resource: { type: 'user', id: '*' },
        action: 'update',
        policy: { type: 'custom' },
      },
    ]);
    authz.resourceTypes.add({
      type: 'user',
      actions: ['read', 'update'],
      authorize: grantBacked(),
    });
    const context = authz.for(alice);
    await expect(
      context.authorize({
        resource: { type: 'user', id: 'u1' },
        action: 'read',
      }),
    ).resolves.toMatchObject({
      effect: 'permit',
      reasons: [{ code: 'GRANT_MATCHED' }],
    });
    await expect(
      context.authorize({
        resource: { type: 'user', id: 'u1' },
        action: 'update',
      }),
    ).resolves.toMatchObject({
      effect: 'deny',
      reasons: [{ code: 'NO_MATCHING_GRANT' }],
    });
  });

  it('checks the extra condition once a grant matches', async () => {
    const authz = withGrants([
      { resource: { type: 'hub.app', id: '*' }, action: 'read' },
    ]);
    const seen: number[] = [];
    authz.resourceTypes.add({
      type: 'hub.app',
      actions: ['read'],
      authorize: grantBacked({
        also: (request, grants) => {
          seen.push(grants.length);
          return Promise.resolve(request.resource.id === 'mine');
        },
      }),
    });
    const context = authz.for(alice);
    await expect(
      context.can({
        resource: { type: 'hub.app', id: 'mine' },
        action: 'read',
      }),
    ).resolves.toBe(true);
    await expect(
      context.can({
        resource: { type: 'hub.app', id: 'other' },
        action: 'read',
      }),
    ).resolves.toBe(false);
    expect(seen).toEqual([1, 1]);
  });

  it('is the default and a type action may override it', async () => {
    const authz = withGrants([
      { resource: { type: 'job', id: 'nightly' }, action: 'run' },
    ]);
    const jobs = new ResourceItems();
    authz.resourceTypes.add({
      type: 'job',
      items: jobs,
      actions: [
        'run',
        {
          name: 'inspect',
          authorize: () => Promise.resolve({ effect: 'permit', reasons: [] }),
        },
      ],
    });
    jobs.add({ id: 'nightly', title: 'Nightly' });
    const context = authz.for(alice);
    await expect(
      context.can({ resource: { type: 'job', id: 'nightly' }, action: 'run' }),
    ).resolves.toBe(true);
    await expect(
      context.can({
        resource: { type: 'job', id: 'nightly' },
        action: 'inspect',
      }),
    ).resolves.toBe(true);
  });
});

it('preserves localized action descriptions even when an action has no title', () => {
  const authz = createAuthorization({ plugins: [] });
  const items = new ResourceItems();
  const description = { key: 'access.deleteHint', ns: '@example/tools' };
  items.add({
    id: 'tools',
    title: 'Tools',
    actions: [{ name: 'delete', description }],
  });
  authz.resourceTypes.add({ type: 'tools', items });
  expect(items.get('tools')?.actions).toEqual([
    { name: 'delete', description },
  ]);
});
