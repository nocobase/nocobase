import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import {
  createAuthorization,
  defineCompositeResource,
  grantBacked,
  keyScopeAllows,
  permissionSetsPlugin,
  ResourceItems,
  type AuthorizationEnv,
  type AuthorizationPlugin,
  type KeyScope,
  type PermissionGrant,
  type ResourceRef,
} from '../src/index.js';
import { MockPermissionSetStore } from './helpers/mock-permission-set-store.js';

/** A `settings` catalog with two items and a `page` type, grant-backed. */
const catalog: AuthorizationPlugin = {
  id: 'catalog',
  setup(authz) {
    const settings = new ResourceItems();
    settings.add({
      id: 'billing',
      title: 'Billing',
      actions: ['read', 'manage'],
    });
    settings.add({
      id: 'members',
      title: 'Members',
      actions: ['read', 'manage'],
    });
    authz.resourceTypes.add({
      type: 'settings',
      items: settings,
      authorize: grantBacked(),
    });
    const pages = new ResourceItems();
    pages.add({ id: 'orders', title: 'Orders', actions: ['access'] });
    pages.add({ id: 'reports', title: 'Reports', actions: ['access'] });
    authz.resourceTypes.add({
      type: 'page',
      items: pages,
      authorize: grantBacked(),
    });
  },
};

/** A scope covering exactly the listed actions. */
function scope(
  entries: readonly { resource: ResourceRef; actions: readonly string[] }[],
  objects: Readonly<Record<string, readonly string[]>> = {},
): KeyScope {
  return {
    keyId: 'key-1',
    allows: (resource, action) =>
      entries.some(
        (entry) =>
          entry.resource.type === resource.type &&
          entry.resource.id === resource.id &&
          entry.actions.includes(action),
      ),
    objects: (business) => objects[business] ?? 'all',
    permissions: entries,
  };
}

function setup(grants: readonly PermissionGrant[], superuser = false) {
  const authorization = createAuthorization({
    plugins: [
      catalog,
      permissionSetsPlugin({
        store: new MockPermissionSetStore({
          permissionSets: [
            { key: 'staff', grants },
            { key: 'superuser', grants: [] },
          ],
          assignments: [
            {
              id: 'alice-staff',
              subject: { type: 'user', id: 'alice' },
              permissionSet: superuser ? 'superuser' : 'staff',
            },
          ],
        }),
      }),
    ],
  });
  if (superuser)
    authorization.permissionSets.protect({
      owner: '@nocobase/test',
      keys: ['superuser'],
      unrestricted: true,
    });
  return authorization;
}

const alice = { type: 'user', id: 'alice' } as const;
const billingRead = {
  resource: { type: 'settings', id: 'billing' },
  action: 'read',
} as const;
const billingManage = {
  resource: { type: 'settings', id: 'billing' },
  action: 'manage',
} as const;

const staffGrants: readonly PermissionGrant[] = [
  {
    resource: { type: 'settings', id: 'billing' },
    actions: [{ action: 'read' }, { action: 'manage' }],
  },
  { resource: { type: 'page', id: 'orders' }, actions: [{ action: 'access' }] },
];

describe('key scopes', () => {
  it('denies a check outside the scope with KEY_SCOPE, whatever the grants allow', async () => {
    const authz = setup(staffGrants).for({
      principal: alice,
      keyScope: scope([
        { resource: { type: 'settings', id: 'billing' }, actions: ['read'] },
      ]),
    });

    await expect(authz.can(billingRead)).resolves.toBe(true);
    await expect(authz.can(billingManage)).resolves.toBe(false);
    await expect(authz.authorize(billingManage)).resolves.toMatchObject({
      effect: 'deny',
      reasons: [{ code: 'KEY_SCOPE' }],
    });
    await expect(authz.require(billingManage)).rejects.toThrow(/key-1/u);
  });

  it('never grants: an action in the scope that the holder lacks stays denied', async () => {
    const authz = setup(staffGrants).for({
      principal: alice,
      keyScope: scope([
        { resource: { type: 'settings', id: 'members' }, actions: ['manage'] },
      ]),
    });

    await expect(
      authz.can({
        resource: { type: 'settings', id: 'members' },
        action: 'manage',
      }),
    ).resolves.toBe(false);
  });

  it('narrows a superuser to the scope', async () => {
    const authz = setup([], true).for({
      principal: alice,
      keyScope: scope([
        { resource: { type: 'page', id: 'reports' }, actions: ['access'] },
      ]),
    });

    await expect(
      authz.can({
        resource: { type: 'page', id: 'reports' },
        action: 'access',
      }),
    ).resolves.toBe(true);
    await expect(authz.can(billingRead)).resolves.toBe(false);
    await expect(authz.snapshot()).resolves.toEqual({
      unrestricted: false,
      permissions: [
        { resource: { type: 'page', id: 'reports' }, actions: ['access'] },
      ],
    });
  });

  it('keeps only the covered actions in the snapshot', async () => {
    const authz = setup(staffGrants).for({
      principal: alice,
      keyScope: scope([
        { resource: { type: 'settings', id: 'billing' }, actions: ['read'] },
        { resource: { type: 'page', id: 'reports' }, actions: ['access'] },
      ]),
    });

    await expect(authz.snapshot()).resolves.toEqual({
      unrestricted: false,
      permissions: [
        { resource: { type: 'settings', id: 'billing' }, actions: ['read'] },
      ],
    });
  });

  it('filters the unscoped snapshot when the scope lists no actions', async () => {
    const everything: KeyScope = {
      keyId: 'robot-key',
      allows: (resource) => resource.type !== 'page',
      objects: () => 'all',
      permissions: null,
    };
    const authz = setup(staffGrants).for({
      principal: alice,
      keyScope: everything,
    });

    await expect(authz.snapshot()).resolves.toEqual({
      unrestricted: false,
      permissions: [
        {
          resource: { type: 'settings', id: 'billing' },
          actions: ['manage', 'read'],
        },
      ],
    });
  });

  it('checks a composite action against the scope and not the grants it expands into', async () => {
    const authorization = setup([
      {
        resource: { type: 'composite', id: 'sales.billing' },
        actions: [{ action: 'review' }],
      },
    ]);
    authorization.compositeResources.define(
      defineCompositeResource('sales.billing', (resource) =>
        resource.title('Billing').action('review', (action) =>
          action.grant({
            build: () => ({
              grants: [
                {
                  resource: { type: 'settings', id: 'billing' },
                  actions: [{ action: 'read' }],
                },
              ],
            }),
          }),
        ),
      ),
    );
    const review = {
      resource: { type: 'composite', id: 'sales.billing' },
      action: 'review',
    } as const;

    const scoped = authorization.for({
      principal: alice,
      keyScope: scope([{ resource: review.resource, actions: ['review'] }]),
    });
    await expect(scoped.can(review)).resolves.toBe(true);
    const outside = authorization.for({
      principal: alice,
      keyScope: scope([{ resource: billingRead.resource, actions: ['read'] }]),
    });
    await expect(outside.can(review)).resolves.toBe(false);
  });

  it('carries the scope an identity step sets through the middleware', async () => {
    const authorization = setup(staffGrants);
    const keyScope = scope([
      { resource: { type: 'settings', id: 'billing' }, actions: ['read'] },
    ]);
    authorization.use(async (request, next) => {
      request.principal = alice;
      request.keyScope = keyScope;
      await next();
    });
    const app = new Hono<AuthorizationEnv>();
    app.use('*', authorization.middleware());
    app.get('/', async (context) =>
      context.json({
        read: await context.get('authz').can(billingRead),
        manage: await context.get('authz').can(billingManage),
        scoped: context.get('authz').identity.keyScope === keyScope,
      }),
    );

    await expect((await app.request('/')).json()).resolves.toEqual({
      read: true,
      manage: false,
      scoped: true,
    });
  });

  it('answers keyScopeAllows for identities with and without a scope', () => {
    const keyScope = scope([
      { resource: { type: 'settings', id: 'billing' }, actions: ['read'] },
    ]);
    expect(keyScopeAllows({}, billingManage.resource, 'manage')).toBe(true);
    expect(keyScopeAllows({ keyScope }, billingRead.resource, 'read')).toBe(
      true,
    );
    expect(keyScopeAllows({ keyScope }, billingManage.resource, 'manage')).toBe(
      false,
    );
  });
});
