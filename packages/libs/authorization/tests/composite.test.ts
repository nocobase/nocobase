import { describe, expect, it, vi } from 'vitest';
import {
  dataScopeTarget,
  createAuthorization,
  defineCompositeResource,
  selection,
  type AccessConstraint,
  type AuthorizationGrant,
  type AuthorizationPlugin,
  type BindableCompositeResourcePermission,
  type CompositeResourceContribution,
  type CompositeResource,
  type PermissionGrant,
  type ResolveAccessConstraintsInput,
} from '../src/core/index.js';
import { flattenGrants, grantProvider } from './helpers/grant-provider.js';

type Access = 'recordsIOwn' | 'allRecords';

/** A stand-in for the database plugin's collection permission. */
class CollectionPermission implements BindableCompositeResourcePermission {
  declare readonly recordAccessSelection?: Access;
  constructor(
    private readonly collection: string,
    private readonly actions: readonly string[],
  ) {}
  bind<K extends string>(
    key: K,
  ): CompositeResourceContribution<Record<K, Access>> {
    return {
      build: () => ({
        grants: [
          {
            resource: { type: 'database.collection', id: this.collection },
            actions: this.actions.map((action) => ({
              action,
              policy: { type: 'database', fields: '*' },
              scopeKey: key,
            })),
          },
        ],
        dataScopes: [
          {
            key,
            title: this.collection,
            options: ['recordsIOwn', 'allRecords'],
            defaultValue: 'recordsIOwn',
          },
        ],
      }),
    };
  }
}

const quotes = defineCompositeResource('sales.quotes', (resource) =>
  resource
    .title('Quotes')
    .action('submit', (action) =>
      action
        .title('Submit')
        .grant(
          'quotes',
          new CollectionPermission('quotes', ['read', 'update']),
        ),
    )
    .action('export', (action) =>
      action.grant({
        build: () => ({
          grants: [
            {
              resource: { type: 'database.collection', id: 'quotes' },
              actions: [{ action: 'read' }],
            },
          ],
        }),
      }),
    ),
);

const quotesObject: CompositeResource = {
  name: 'sales.quotes',
  title: 'Quotes',
  actions: [
    {
      name: 'submit',
      title: 'Submit',
      dataScopes: [
        {
          key: 'quotes',
          title: 'quotes',
          options: ['recordsIOwn', 'allRecords'],
          defaultValue: 'recordsIOwn',
        },
      ],
      grants: [
        {
          resource: { type: 'database.collection', id: 'quotes' },
          actions: ['read', 'update'].map((action) => ({
            action,
            policy: { type: 'database', fields: '*' },
            scopeKey: 'quotes',
          })),
        },
      ],
    },
    {
      name: 'export',
      title: 'export',
      grants: [
        {
          resource: { type: 'database.collection', id: 'quotes' },
          actions: [{ action: 'read' }],
        },
      ],
    },
  ],
};

const alice = { principal: { type: 'user', id: 'alice' } };

function setup(
  grants: readonly PermissionGrant[] = [],
  extra: readonly AuthorizationPlugin[] = [],
) {
  const authz = createAuthorization({
    plugins: [
      { id: 'grants', grants: grantProvider(flattenGrants(grants)) },
      ...extra,
    ],
  });
  return authz;
}

describe('compositeResources', () => {
  it('are built in: available without any plugin, and handed to every plugin setup', () => {
    let seen: unknown;
    const authz = createAuthorization({
      plugins: [
        {
          id: 'reader',
          setup(host) {
            seen = host.compositeResources;
          },
        },
      ],
    });
    expect(seen).toBe(authz.compositeResources);
    const reference = authz.compositeResources.define(quotes);
    expect(reference.name).toBe('sales.quotes');
    expect(authz.compositeResources.list().map((item) => item.name)).toEqual([
      'sales.quotes',
    ]);
    expect(
      authz.compositeResources.getAction('sales.quotes', 'export')?.name,
    ).toBe('export');
    expect(authz.compositeResources.validate()).toEqual([
      'Data scope sales.quotes.submit.quotes targets unregistered resource type database.collection',
    ]);
    expect(
      authz.resourceTypes.get('composite').items?.has('sales.quotes'),
    ).toBe(true);
  });

  it('builds the same definition in object and builder form', () => {
    expect(quotes.build()).toEqual(quotesObject);
    const built = quotes.build();
    built.title = 'Mutated';
    expect(quotes.build().title).toBe('Quotes');
  });

  it('registers either form as an item of the composite type', () => {
    for (const definition of [quotes, quotesObject]) {
      const authz = setup();
      const reference = authz.compositeResources.define(definition);
      expect(reference.name).toBe('sales.quotes');
      expect(authz.compositeResources.list()).toEqual([quotesObject]);
      expect(
        authz.compositeResources.getAction('sales.quotes', 'export'),
      ).toEqual(quotesObject.actions[1]);
      const composite = authz.resourceTypes.get('composite');
      expect(composite.type).toBe('composite');
      expect(composite.items?.list()).toEqual([
        {
          id: 'sales.quotes',
          title: 'Quotes',
          actions: [
            { name: 'submit', title: 'Submit' },
            { name: 'export', title: 'export' },
          ],
        },
      ]);
      expect(() => authz.compositeResources.define(definition)).toThrow(
        'already defined',
      );
    }
  });

  it('keeps the pages it is used on and the pages that turn an action on, without granting anything', async () => {
    const customers = defineCompositeResource('crm.customers', (r) =>
      r
        .title('Customers')
        .usedOn('crm.customers', 'dashboard')
        .action('view', (a) =>
          a
            .title('View customers')
            .defaultFor('crm.customers')
            .grant({
              build: () => ({
                grants: [
                  {
                    resource: { type: 'records', id: 'customers' },
                    actions: [{ action: 'read' }],
                  },
                ],
              }),
            }),
        ),
    );
    const built = customers.build();
    expect(built.usedOn).toEqual(['crm.customers', 'dashboard']);
    expect(built.actions[0]?.defaultFor).toEqual(['crm.customers']);
    const authz = setup([
      {
        resource: { type: 'page', id: 'crm.customers' },
        actions: [{ action: 'access' }],
      },
    ]);
    authz.compositeResources.define(built);
    expect(authz.compositeResources.list()[0]?.usedOn).toEqual([
      'crm.customers',
      'dashboard',
    ]);
    // Page access alone still opens no action.
    const decision = await authz.for(alice).authorize({
      resource: { type: 'composite', id: 'crm.customers' },
      action: 'view',
    });
    expect(decision.effect).toBe('deny');
    expect(() =>
      authz.compositeResources.define({
        ...built,
        name: 'crm.repeated',
        usedOn: ['dashboard', 'dashboard'],
      }),
    ).toThrow('needs unique, nonempty page ids');
    expect(() =>
      defineCompositeResource('crm.blank', (r) =>
        r.action('view', (a) =>
          a.defaultFor('').grant({
            build: () => ({
              grants: [
                {
                  resource: { type: 'records', id: 'customers' },
                  actions: [{ action: 'read' }],
                },
              ],
            }),
          }),
        ),
      ),
    ).toThrow('needs unique, nonempty page ids');
  });

  it('composes whatever its definition lists, except another composite', () => {
    const authz = setup();
    const view = (type: string) => ({
      name: `x.${type}`,
      title: type,
      actions: [
        {
          name: 'view',
          title: 'View',
          grants: [
            { resource: { type, id: 'orders' }, actions: [{ action: 'read' }] },
          ],
        },
      ],
    });
    for (const type of ['page', 'settings', 'workflow', 'database.collection'])
      authz.compositeResources.define(view(type));
    expect(() => authz.compositeResources.define(view('composite'))).toThrow(
      'cannot compose another composite resource',
    );
    expect(() =>
      defineCompositeResource('nested', (resource) =>
        resource.action('run', (action) =>
          action.grant({
            build: () => ({
              grants: [
                {
                  resource: { type: 'composite', id: 'sales.quotes' },
                  actions: [{ action: 'export' }],
                },
              ],
            }),
          }),
        ),
      ),
    ).toThrow('cannot compose another composite resource');
  });

  it('rejects incomplete definitions', () => {
    const authz = setup();
    expect(() =>
      defineCompositeResource('quotes', (resource) => resource),
    ).toThrow('needs unique, nonempty actions');
    expect(() =>
      defineCompositeResource('quotes', (resource) =>
        resource.action('view', (action) => action),
      ),
    ).toThrow('grants nothing');
    const [submit] = quotesObject.actions;
    expect(() =>
      authz.compositeResources.define({
        ...quotesObject,
        actions: [{ ...submit!, dataScopes: [] }],
      }),
    ).toThrow('unknown data scope');
    expect(() =>
      authz.compositeResources.define({
        ...quotesObject,
        actions: [
          {
            ...submit!,
            dataScopes: [
              ...submit!.dataScopes!,
              { key: 'orders', title: 'Orders' },
            ],
          },
        ],
      }),
    ).toThrow('is not used by a grant');
  });
  it('builds typed grants whose policy names data scopes', () => {
    const reference = quotes.reference();
    expect(reference.grant('submit', 'export')).toEqual({
      resource: { type: 'composite', id: 'sales.quotes' },
      actions: [{ action: 'submit' }, { action: 'export' }],
    });
    expect(reference.grant({ submit: { quotes: 'allRecords' } })).toEqual({
      resource: { type: 'composite', id: 'sales.quotes' },
      actions: [
        {
          action: 'submit',
          policy: { type: 'composite', scopes: { quotes: 'allRecords' } },
        },
      ],
    });
    expect(reference.scope('submit', 'quotes')).toEqual({
      action: 'submit',
      scopeKey: 'quotes',
    });
    expect(() =>
      reference.grant({ submit: { quotes: 'other' as Access } }),
    ).toThrow('does not offer other');
    expect(() => reference.scope('export', 'quotes' as never)).toThrow(
      'Unknown composite resource data scope',
    );
  });
});

describe('data scopes', () => {
  const scoped = (
    grants: readonly { type: string; id: string; scopeKey?: string }[],
  ): CompositeResource => ({
    name: 'scoped',
    title: 'Scoped',
    actions: [
      {
        name: 'run',
        title: 'Run',
        dataScopes: [{ key: 'records', title: 'Records' }],
        grants: grants.map(({ type, id, scopeKey }) => ({
          resource: { type, id },
          actions: [
            { action: 'read', ...(scopeKey === undefined ? {} : { scopeKey }) },
          ],
        })),
      },
    ],
  });
  const ledger = (recordAccess: boolean): AuthorizationPlugin => ({
    id: 'ledger',
    setup(host) {
      host.resourceTypes.add({
        type: 'ledger',
        actions: ['read'],
        recordAccess,
      });
    },
  });

  it('binds to the one resource its grant actions address', () => {
    const definition = scoped([
      { type: 'ledger', id: 'a', scopeKey: 'records' },
      { type: 'ledger', id: 'b' },
    ]);
    expect(dataScopeTarget(definition.actions[0]!, 'records')).toEqual({
      type: 'ledger',
      id: 'a',
    });
    expect(() => dataScopeTarget(definition.actions[0]!, 'missing')).toThrow(
      'is not used by a grant',
    );
    for (const second of [
      { type: 'ledger', id: 'b', scopeKey: 'records' },
      { type: 'journal', id: 'a', scopeKey: 'records' },
    ])
      expect(() =>
        setup([], [ledger(true)]).compositeResources.define(
          scoped([{ type: 'ledger', id: 'a', scopeKey: 'records' }, second]),
        ),
      ).toThrow('targets more than one resource');
  });

  it('rejects a target type without recordAccess at define once it is registered', () => {
    const definition = scoped([
      { type: 'ledger', id: 'a', scopeKey: 'records' },
    ]);
    expect(() =>
      setup([], [ledger(false)]).compositeResources.define(definition),
    ).toThrow('does not declare recordAccess');
    const authz = setup([], [ledger(true)]);
    authz.compositeResources.define(definition);
    expect(authz.compositeResources.validate()).toEqual([]);
  });

  it('checks a type registered later on validate and on first use', async () => {
    const definition = scoped([
      { type: 'ledger', id: 'a', scopeKey: 'records' },
    ]);
    const unregistered = setup([
      {
        resource: { type: 'composite', id: 'scoped' },
        actions: [{ action: 'run' }],
      },
    ]);
    unregistered.compositeResources.define(definition);
    expect(unregistered.compositeResources.validate()).toEqual([
      'Data scope scoped.run.records targets unregistered resource type ledger',
    ]);
    await expect(
      unregistered.for(alice).authorize({
        resource: { type: 'composite', id: 'scoped' },
        action: 'run',
      }),
    ).resolves.toMatchObject({
      effect: 'deny',
      reasons: [
        {
          code: 'INVALID_GRANT',
          message: expect.stringContaining('unregistered resource type ledger'),
        },
      ],
    });
    const late = setup(
      [
        {
          resource: { type: 'composite', id: 'scoped' },
          actions: [{ action: 'run' }],
        },
      ],
      [],
    );
    late.compositeResources.define(definition);
    late.resourceTypes.add({ type: 'ledger', actions: ['read'] });
    expect(late.compositeResources.validate()).toEqual([
      'Data scope scoped.run.records targets resource type ledger, which does not declare recordAccess',
    ]);
    await expect(
      late.for(alice).can({
        resource: { type: 'composite', id: 'scoped' },
        action: 'run',
      }),
    ).resolves.toBe(false);
  });
});

describe('composite authorization', () => {
  it('checks each composed collection once, with that action’s grants only', async () => {
    const calls: { action: string; grants: readonly AuthorizationGrant[] }[] =
      [];
    const database: AuthorizationPlugin = {
      id: 'database',
      composeConditions: (checks) => ({ tables: checks.length }),
      setup(authz) {
        authz.resourceTypes.add({
          type: 'database.collection',
          actions: ['read', 'create', 'update', 'delete'],
          recordAccess: true,
          async authorize(request, context) {
            const grants = await context.grants.resolve(request);
            calls.push({ action: request.action, grants });
            return {
              effect: 'conditional',
              conditions: { type: 'database', count: grants.length },
              reasons: [],
            };
          },
        });
      },
    };
    const reference = quotes.reference();
    const authz = setup(
      [
        reference.grant({ submit: { quotes: 'allRecords' } }),
        reference.grant('export'),
      ],
      [database],
    );
    authz.compositeResources.define(quotes);
    const decision = await authz.for(alice).authorize({
      resource: { type: 'composite', id: 'sales.quotes' },
      action: 'submit',
    });
    expect(decision.effect).toBe('conditional');
    expect(decision.conditions?.type).toBe('composite');
    expect(decision.conditions?.checks.map((check) => check.action)).toEqual([
      'read',
      'update',
    ]);
    expect(Reflect.get(decision.conditions ?? {}, 'tables')).toBe(2);
    expect(calls.map((call) => call.action)).toEqual(['read', 'update']);
    expect(calls[0]!.grants).toEqual([
      expect.objectContaining({
        resource: { type: 'database.collection', id: 'quotes' },
        policy: { type: 'database', fields: '*' },
        origin: {
          resource: { type: 'composite', id: 'sales.quotes' },
          action: 'submit',
          scopeKey: 'quotes',
          selection: selection.recordAccess('allRecords'),
          constraints: [],
        },
      }),
    ]);
    await expect(
      authz.for(alice).can({
        resource: { type: 'composite', id: 'sales.quotes' },
        action: 'submit',
      }),
    ).resolves.toBe(true);
  });

  it.each([
    [undefined, selection.recordAccess('recordsIOwn')],
    ['', undefined],
  ] as const)(
    'fills an unset data scope with its default (%j)',
    async (value, expected) => {
      const reference = quotes.reference();
      const seen: AuthorizationGrant[] = [];
      const authz = setup(
        [
          value === undefined
            ? reference.grant('submit')
            : reference.grant({ submit: { quotes: value } }),
        ],
        [
          {
            id: 'database',
            setup(host) {
              host.resourceTypes.add({
                type: 'database.collection',
                actions: ['read', 'create', 'update', 'delete'],
                recordAccess: true,
                async authorize(request, context) {
                  seen.push(...(await context.grants.resolve(request)));
                  return { effect: 'permit', reasons: [] };
                },
              });
            },
          },
        ],
      );
      authz.compositeResources.define(quotes);
      await expect(
        authz.for(alice).authorize({
          resource: { type: 'composite', id: 'sales.quotes' },
          action: 'submit',
        }),
      ).resolves.toMatchObject({ effect: 'permit' });
      expect(seen.map((grant) => grant.origin?.selection)).toEqual([
        expected,
        expected,
      ]);
    },
  );

  it('denies a stored composite policy the definition does not accept as an invalid grant', async () => {
    const authz = setup([
      {
        resource: { type: 'composite', id: 'sales.quotes' },
        actions: [
          {
            action: 'submit',
            policy: { type: 'composite', scopes: { missing: 'allRecords' } },
          },
        ],
      },
    ]);
    authz.compositeResources.define(quotes);
    await expect(
      authz.for(alice).authorize({
        resource: { type: 'composite', id: 'sales.quotes' },
        action: 'submit',
      }),
    ).resolves.toMatchObject({
      effect: 'deny',
      reasons: [
        {
          code: 'INVALID_GRANT',
          message: expect.stringContaining('no longer applies'),
          details: { source: { plugin: 'test', id: 'set' } },
        },
      ],
    });
  });

  it('shares branch constraints within a context and not across contexts', async () => {
    let revision = 1;
    const resolve = vi.fn(
      async (
        input: ResolveAccessConstraintsInput,
      ): Promise<readonly AccessConstraint[]> => [
        {
          source: { plugin: 'rules', id: String(revision) },
          effect: 'restrict',
          selection: selection.records([
            `${input.principal.id}:${input.scopeKey}:${revision}`,
          ]),
        },
      ],
    );
    const bound = vi.fn(() => ({ id: 'rules', resolve }));
    const received: (readonly AccessConstraint[] | undefined)[] = [];
    const rules: AuthorizationPlugin = {
      id: 'rules',
      setup(host) {
        host.constraints.add({ id: 'rules', resolve, for: bound });
        host.resourceTypes.add({
          type: 'database.collection',
          actions: ['read', 'create', 'update', 'delete'],
          recordAccess: true,
          async authorize(request, context) {
            for (const grant of await context.grants.resolve(request))
              received.push(grant.origin?.constraints);
            return { effect: 'permit', reasons: [] };
          },
        });
      },
    };
    const authz = setup([quotes.reference().grant('submit')], [rules]);
    authz.compositeResources.define(quotes);
    const request = {
      resource: { type: 'database.collection', id: 'quotes' },
      action: 'read',
    };
    const context = authz.for(alice);
    await Promise.all([context.authorize(request), context.authorize(request)]);
    revision = 2;
    await context.authorize(request);
    await authz.for(alice).authorize(request);
    await authz
      .for({ principal: { type: 'user', id: 'bob' } })
      .authorize(request);
    expect(received.map((value) => value?.[0]?.selection)).toEqual([
      selection.records(['alice:quotes:1']),
      selection.records(['alice:quotes:1']),
      selection.records(['alice:quotes:1']),
      selection.records(['alice:quotes:2']),
      selection.records(['bob:quotes:2']),
    ]);
    expect(resolve).toHaveBeenCalledTimes(3);
    expect(bound).toHaveBeenCalledTimes(3);
  });
});
