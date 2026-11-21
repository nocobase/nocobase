import { describe, expect, it } from 'vitest';
import {
  createAuthorization,
  CredentialCatalog,
  defineCompositeResource,
  grantBacked,
  permissionSetsPlugin,
  ResourceItems,
  type AccessConstraint,
  type AuthorizationPlugin,
  type CompositeResourceContribution,
  type KeyScope,
  type PermissionGrant,
} from '../src/index.js';
import { MockPermissionSetStore } from './helpers/mock-permission-set-store.js';

const alice = { type: 'user', id: 'alice' } as const;

/** Settings with an item whose `manage` is a person's only, and a recording record type for composite branches. */
function catalog(received: AccessConstraint[][]): AuthorizationPlugin {
  return {
    id: 'catalog',
    setup(authz) {
      const settings = new ResourceItems();
      settings.add({
        id: 'accounts',
        title: 'Accounts',
        actions: [
          'read',
          { name: 'manage', humanOnly: 'Manages people', risk: 'high' },
        ],
      });
      authz.resourceTypes.add({
        type: 'settings',
        items: settings,
        authorize: grantBacked(),
      });
      authz.resourceTypes.add({
        type: 'database.collection',
        actions: ['read'],
        recordAccess: true,
        async authorize(request, context) {
          const grants = await context.grants.resolve(request);
          if (grants.length === 0) return { effect: 'deny', reasons: [] };
          for (const grant of grants)
            received.push([...(grant.origin?.constraints ?? [])]);
          return { effect: 'permit', reasons: [] };
        },
      });
    },
  };
}

const quotesContribution: CompositeResourceContribution<{ quote: string }> = {
  build: () => ({
    dataScopes: [{ key: 'quote', title: 'Quotes' }],
    grants: [
      {
        resource: { type: 'database.collection', id: 'quotes' },
        actions: [{ action: 'read', scopeKey: 'quote' }],
      },
    ],
  }),
};

function setup(grants: readonly PermissionGrant[]) {
  const received: AccessConstraint[][] = [];
  const authorization = createAuthorization({
    plugins: [
      catalog(received),
      permissionSetsPlugin({
        store: new MockPermissionSetStore({
          permissionSets: [{ key: 'staff', grants }],
          assignments: [
            {
              id: 'alice-staff',
              subject: alice,
              permissionSet: 'staff',
            },
          ],
        }),
      }),
    ],
  });
  authorization.compositeResources.define(
    defineCompositeResource('sales.quotes', (resource) =>
      resource.action('view', (action) => action.grant(quotesContribution)),
    ),
  );
  authorization.compositeResources.define(
    defineCompositeResource('sales.payouts', (resource) =>
      resource.action('approve', (action) =>
        action.humanOnly('Moves money').risk('high').grant(quotesContribution),
      ),
    ),
  );
  return { authorization, received };
}

/** A credential bounded only by its holder: it narrows no action. */
const unbounded: KeyScope = {
  keyId: 'key-1',
  allows: () => true,
  objects: () => 'all',
  permissions: null,
};

const accountsManage = {
  resource: { type: 'settings', id: 'accounts' },
  action: 'manage',
} as const;

const staff: readonly PermissionGrant[] = [
  {
    resource: { type: 'settings', id: 'accounts' },
    actions: [{ action: 'read' }, { action: 'manage' }],
  },
  {
    resource: { type: 'composite', id: 'sales.quotes' },
    actions: [
      {
        action: 'view',
        policy: { type: 'composite', scopes: { quote: { type: 'all' } } },
      },
    ],
  },
];

describe('actions a person only may take', () => {
  it('reads what an action declares, inheriting from its type and composite builder', () => {
    const { authorization } = setup(staff);
    expect(authorization.humanOnly(accountsManage.resource, 'manage')).toBe(
      'Manages people',
    );
    expect(authorization.humanOnly(accountsManage.resource, 'read')).toBe(
      undefined,
    );
    expect(
      authorization.resourceTypes.action(
        { type: 'composite', id: 'sales.payouts' },
        'approve',
      ),
    ).toMatchObject({ humanOnly: 'Moves money', risk: 'high' });
  });

  it('lets a session take one and denies any credential, scoped or not', async () => {
    const { authorization } = setup(staff);
    await expect(
      authorization.for({ principal: alice }).can(accountsManage),
    ).resolves.toBe(true);
    const decision = await authorization
      .for({ principal: alice, keyScope: unbounded })
      .authorize(accountsManage);
    expect(decision).toMatchObject({
      effect: 'deny',
      reasons: [
        { code: 'KEY_HUMAN_ONLY', details: { reason: 'Manages people' } },
      ],
    });
    const scoped: KeyScope = {
      ...unbounded,
      allows: (resource) => resource.id === 'accounts',
      permissions: [
        {
          resource: accountsManage.resource,
          actions: ['read', 'manage'],
        },
      ],
    };
    await expect(
      authorization
        .for({ principal: alice, keyScope: scoped })
        .can(accountsManage),
    ).resolves.toBe(false);
    await expect(
      authorization
        .for({ principal: alice, keyScope: scoped })
        .can({ ...accountsManage, action: 'read' }),
    ).resolves.toBe(true);
  });

  it('leaves human-only actions out of a credential snapshot', async () => {
    const { authorization } = setup(staff);
    const snapshot = await authorization
      .for({ principal: alice, keyScope: unbounded })
      .snapshot();
    expect(snapshot.permissions).toContainEqual({
      resource: accountsManage.resource,
      actions: ['read'],
    });
  });
});

describe('record scopes of a credential', () => {
  it('restricts a composite branch to what the credential scope selects', async () => {
    const { authorization, received } = setup(staff);
    const quotes = { type: 'composite', id: 'sales.quotes' } as const;
    const scoped: KeyScope = {
      ...unbounded,
      policy: (resource, action) =>
        resource.id === 'sales.quotes' && action === 'view'
          ? { type: 'composite', scopes: { quote: 'recordsIOwn' } }
          : undefined,
    };
    await authorization
      .for({ principal: alice, keyScope: scoped })
      .authorize({ resource: quotes, action: 'view' });
    expect(received.at(-1)).toEqual([
      {
        source: { plugin: 'key-scope', id: 'key-1' },
        effect: 'restrict',
        selection: { type: 'recordAccess', key: 'recordsIOwn' },
      },
    ]);
    received.length = 0;
    await authorization
      .for({ principal: alice })
      .authorize({ resource: quotes, action: 'view' });
    expect(received.at(-1)).toEqual([]);
  });

  it('reaches no record through a damaged record scope', async () => {
    const { authorization, received } = setup(staff);
    const scoped: KeyScope = {
      ...unbounded,
      policy: () => ({ type: 'composite', scopes: { quote: { type: 'x' } } }),
    };
    await authorization.for({ principal: alice, keyScope: scoped }).authorize({
      resource: { type: 'composite', id: 'sales.quotes' },
      action: 'view',
    });
    expect(received.at(-1)?.[0]?.selection).toEqual({
      type: 'records',
      ids: [],
    });
  });
});

describe('credential catalog', () => {
  it('registers templates and object sources once each', async () => {
    const catalog = new CredentialCatalog();
    const remove = catalog.templates.add({
      id: 'releases.ci-deploy',
      title: 'CI deploy',
      grants: [
        {
          resource: { type: 'rel', id: 'rel.apps' },
          actions: ['upload', 'deploy'],
          objects: 'pick',
        },
      ],
    });
    expect(() =>
      catalog.templates.add({
        id: 'releases.ci-deploy',
        title: 'x',
        grants: [],
      }),
    ).toThrow(/already registered/);
    expect(catalog.templates.get('releases.ci-deploy')?.title).toBe(
      'CI deploy',
    );
    remove();
    expect(catalog.templates.list()).toEqual([]);
    const source = { list: () => Promise.resolve([]) };
    catalog.objectSources.add('rel.apps', source);
    expect(() => catalog.objectSources.add('rel.apps', source)).toThrow();
    expect(catalog.objectSources.list()).toEqual(['rel.apps']);
    await expect(
      catalog.objectSources
        .get('rel.apps')
        ?.list({ identity: { principal: alice } }),
    ).resolves.toEqual([]);
  });
});

describe('record scopes of an unrestricted holder’s credential', () => {
  const RECORDS = ['q1', 'q2', 'q3'];
  const MINE = ['q1', 'q2'];

  /** The records a selection reaches among RECORDS. */
  const reach = (selection: {
    type: string;
    ids?: readonly string[];
    key?: string;
  }): string[] =>
    selection.type === 'all'
      ? RECORDS
      : selection.type === 'records'
        ? RECORDS.filter((id) => selection.ids?.includes(id))
        : selection.key === 'mine'
          ? MINE
          : [];

  /** A record type answering the ids a check reaches: its grants' selections, cut by every restriction. */
  const records: AuthorizationPlugin = {
    id: 'records',
    setup(authz) {
      authz.resourceTypes.add({
        type: 'database.collection',
        actions: ['read'],
        recordAccess: true,
        async authorize(request, context) {
          const grants = await context.grants.resolve(request);
          if (grants.length === 0) return { effect: 'deny', reasons: [] };
          let ids = new Set(
            grants.flatMap((grant) =>
              reach(grant.origin?.selection ?? { type: 'all' }),
            ),
          );
          for (const grant of grants)
            for (const constraint of grant.origin?.constraints ?? [])
              if (constraint.effect === 'restrict') {
                const kept = new Set(reach(constraint.selection));
                ids = new Set([...ids].filter((id) => kept.has(id)));
              }
          return {
            effect: 'conditional',
            conditions: { type: 'ids', ids: [...ids].sort() },
            reasons: [],
          };
        },
      });
    },
  };

  function reached(
    decision: Awaited<
      ReturnType<
        ReturnType<ReturnType<typeof createAuthorization>['for']>['authorize']
      >
    >,
  ): string[] | 'all' {
    const check = (
      decision.conditions as
        | { checks?: { decision: { conditions?: { ids?: string[] } } }[] }
        | undefined
    )?.checks?.[0];
    return check?.decision.conditions?.ids ?? 'all';
  }

  function setupWith(superuser: boolean) {
    const authorization = createAuthorization({
      plugins: [
        records,
        permissionSetsPlugin({
          store: new MockPermissionSetStore({
            permissionSets: [
              {
                key: 'staff',
                grants: [
                  {
                    resource: { type: 'composite', id: 'sales.quotes' },
                    actions: [
                      {
                        action: 'view',
                        policy: {
                          type: 'composite',
                          scopes: { quote: { type: 'all' } },
                        },
                      },
                    ],
                  },
                ],
              },
              { key: 'superuser', grants: [] },
            ],
            assignments: [
              {
                id: 'alice',
                subject: alice,
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
    authorization.compositeResources.define(
      defineCompositeResource('sales.quotes', (resource) =>
        resource.action('view', (action) => action.grant(quotesContribution)),
      ),
    );
    return authorization;
  }

  const keyWith = (quote: unknown): KeyScope => ({
    ...unbounded,
    policy: () => ({ type: 'composite', scopes: { quote } }),
  });
  const view = {
    resource: { type: 'composite', id: 'sales.quotes' },
    action: 'view',
  } as const;

  it.each([
    ['an unrestricted holder', true],
    ['a holder of every record', false],
  ])(
    'keeps the key of %s to the records it selects',
    async (_label, superuser) => {
      const authorization = setupWith(superuser);
      const picked = await authorization
        .for({
          principal: alice,
          keyScope: keyWith({ type: 'records', ids: ['q1'] }),
        })
        .authorize(view);
      expect(picked.effect).not.toBe('deny');
      expect(reached(picked)).toEqual(['q1']);
      const mine = await authorization
        .for({ principal: alice, keyScope: keyWith('mine') })
        .authorize(view);
      expect(reached(mine)).toEqual(MINE);
    },
  );

  it('leaves an unrestricted holder’s key without record scopes unrestricted', async () => {
    const authorization = setupWith(true);
    const decision = await authorization
      .for({ principal: alice, keyScope: unbounded })
      .authorize(view);
    expect(decision.effect).toBe('permit');
    expect(reached(decision)).toBe('all');
  });
});
