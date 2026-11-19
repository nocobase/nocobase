import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  defineCompositeResource,
  ResourceItems,
} from '@nocobase/authorization/core';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import {
  AUTHORIZATION_NAMESPACE,
  AuthorizationProvider,
  authorizationToken,
  createAppAuthorization,
  type AppAuthorization,
} from '../../server/index.js';
import { authorizationOptions } from '../../server/options.js';

const names = (authz: AppAuthorization): [string, string[]][] =>
  authz.ui.sections
    .tree()
    .map((section) => [
      section.name,
      section.subsections.map((subsection) => subsection.name),
    ]);

const tree = (
  options: Awaited<ReturnType<typeof authorizationOptions>>,
): [string, string[]][] =>
  options.sections.map((section) => [
    section.name,
    section.subsections.map((subsection) => subsection.name),
  ]);

const quotes = defineCompositeResource('sales.quotes', (resource) =>
  resource.title('Quotes').action('view', (action) =>
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

describe('authz.ui sections', () => {
  it('registers the built-in sections, the authorization subsection and the defaults', () => {
    const authz = createAppAuthorization({});
    expect(names(authz)).toEqual([
      ['pages', ['pages.page']],
      ['business', []],
      ['administration', ['authorization']],
    ]);
    expect(authz.ui.sections.get('business')).toEqual({
      name: 'business',
      title: { key: 'sections.business', ns: AUTHORIZATION_NAMESPACE },
      order: 100,
    });
    expect(authz.ui.defaultSectionOf('page')).toBeUndefined();
    expect(authz.ui.sections.get('pages.page')).toEqual({
      name: 'pages.page',
      title: { key: 'sections.page', ns: AUTHORIZATION_NAMESPACE },
      parent: 'pages',
      order: 0,
    });
    expect(authz.ui.defaultSectionOf('composite')).toBe('business');
    expect(authz.ui.defaultSectionOf('settings')).toBe('administration');
    expect(authz.ui.defaultSectionOf('database.collection')).toBeUndefined();
  });

  it('orders sections and nests exactly one level under a known top-level section', () => {
    const authz = createAppAuthorization({});
    authz.ui.sections.add({ name: 'reports', title: 'Reports', order: 50 });
    authz.ui.sections.add({ name: 'b', title: 'B', parent: 'business' });
    authz.ui.sections.add({
      name: 'a',
      title: 'A',
      parent: 'business',
      order: 1,
    });
    expect(names(authz).slice(0, 3)).toEqual([
      ['pages', ['pages.page']],
      ['reports', []],
      ['business', ['a', 'b']],
    ]);
    expect(() =>
      authz.ui.sections.add({ name: 'x', title: 'X', parent: 'missing' }),
    ).toThrow(/unknown parent/);
    expect(() =>
      authz.ui.sections.add({ name: 'deep', title: 'Deep', parent: 'a' }),
    ).toThrow(/cannot nest/);
    expect(() => authz.ui.sections.add({ name: 'top', title: 'Top' })).toThrow(
      /needs an order/,
    );
  });

  it('accepts a deep-equal re-add and rejects any other', () => {
    const authz = createAppAuthorization({});
    const automation = {
      name: 'automation',
      title: 'Automation',
      parent: 'administration',
    };
    authz.ui.sections.add(automation);
    authz.ui.sections.add({ ...automation });
    expect(() =>
      authz.ui.sections.add({ ...automation, title: 'Jobs' }),
    ).toThrow(/already registered/);
    expect(() =>
      authz.ui.sections.add({ name: 'pages', title: 'Pages', order: 0 }),
    ).toThrow(/already registered/);
  });

  describe('extending a subsection another plugin owns', () => {
    const owner = {
      name: 'automation',
      title: { key: 'nav.automation', ns: 'workflow' },
      parent: 'administration',
    };
    const extension = {
      name: 'automation',
      title: { key: 'nav.automation', ns: 'scheduler' },
      parent: 'administration',
      extend: true,
    };

    it('does nothing when the owner booted first', () => {
      const authz = createAppAuthorization({});
      authz.ui.sections.add(owner);
      authz.ui.sections.add(extension);
      expect(authz.ui.sections.get('automation')).toEqual(owner);
    });

    it('creates the subsection and yields to an owner that boots later', () => {
      const authz = createAppAuthorization({});
      authz.ui.sections.add({ ...extension, order: 5 });
      const { extend: _extend, ...created } = { ...extension, order: 5 };
      expect(authz.ui.sections.get('automation')).toEqual(created);
      authz.ui.sections.add(owner);
      expect(authz.ui.sections.get('automation')).toEqual(owner);
      expect(() =>
        authz.ui.sections.add({ ...owner, title: 'Automation' }),
      ).toThrow(/already registered/);
    });

    it('throws for an owner under another parent, or an extend on a top-level section', () => {
      const authz = createAppAuthorization({});
      authz.ui.sections.add(extension);
      expect(() =>
        authz.ui.sections.add({ ...owner, parent: 'business' }),
      ).toThrow(/already registered under administration/);
      expect(() =>
        authz.ui.sections.add({
          name: 'top',
          title: 'Top',
          order: 1,
          extend: true,
        }),
      ).toThrow(/only as a subsection/);
    });
  });
});

describe('authz.ui groups and placement', () => {
  it('nests groups to any depth and rejects a conflicting re-add', () => {
    const authz = createAppAuthorization({});
    authz.ui.groups.add({ name: 'ledgers', title: 'Ledgers' });
    authz.ui.groups.add({ name: 'ledgers', title: 'Ledgers' });
    authz.ui.groups.add({
      name: 'payables',
      title: 'Payables',
      parent: 'ledgers',
    });
    authz.ui.groups.add({ name: 'bills', title: 'Bills', parent: 'payables' });
    expect(() =>
      authz.ui.groups.add({ name: 'ledgers', title: 'Books' }),
    ).toThrow(/already registered/);
    expect(() =>
      authz.ui.groups.add({ name: 'x', title: 'X', parent: 'missing' }),
    ).toThrow(/unknown parent/);
    expect(authz.ui.groups.list().map((group) => group.name)).toEqual([
      'ledgers',
      'payables',
      'bills',
    ]);
  });

  it('places a ref or a composite reference in a subsection only', () => {
    const authz = createAppAuthorization({});
    authz.database.collections.add({ name: 'quotes', title: 'Quotes' });
    const reference = authz.compositeResources.define(quotes);
    authz.ui.sections.add({
      name: 'sales',
      title: 'Sales',
      parent: 'business',
    });
    authz.ui.place(reference, { section: 'sales' });
    authz.ui.place(
      { type: 'composite', id: 'sales.quotes' },
      { section: 'sales' },
    );
    expect(
      authz.ui.placementOf({ type: 'composite', id: 'sales.quotes' }),
    ).toEqual({ section: 'sales' });
    expect(() =>
      authz.ui.place(reference, { section: 'sales', group: 'other' }),
    ).toThrow(/already placed/);
    expect(() =>
      authz.ui.place({ type: 'settings', id: 'x' }, { section: 'business' }),
    ).toThrow(/only in a subsection/);
  });

  it('checks the default section of a type', () => {
    const authz = createAppAuthorization({});
    expect(() => authz.ui.defaultSection('report', 'missing')).toThrow(
      /unknown top-level section/,
    );
    expect(() => authz.ui.defaultSection('report', 'authorization')).toThrow(
      /unknown top-level section/,
    );
    authz.ui.defaultSection('report', 'administration');
    authz.ui.defaultSection('report', 'administration');
    expect(() => authz.ui.defaultSection('report', 'business')).toThrow(
      /already defaults/,
    );
  });

  it('lists an unplaced composite under its default section Other', async () => {
    const authz = createAppAuthorization({});
    authz.database.collections.add({ name: 'quotes', title: 'Quotes' });
    authz.compositeResources.define(quotes);
    const options = await authorizationOptions(authz);
    expect(
      options.sections.find((section) => section.name === 'business')
        ?.subsections,
    ).toMatchObject([
      {
        name: 'business.other',
        title: { key: 'sections.other', ns: AUTHORIZATION_NAMESPACE },
        resources: [{ type: 'composite', id: 'sales.quotes' }],
      },
    ]);
  });
});

describe('the page subsection', () => {
  it('is registered by pagesPlugin and marked for the client to fill, titled in this plugin', async () => {
    const authz = createAppAuthorization({});
    const options = await authorizationOptions(authz);
    expect(options.sections[0]).toMatchObject({
      name: 'pages',
      subsections: [
        {
          name: 'pages.page',
          title: { key: 'sections.page', ns: AUTHORIZATION_NAMESPACE },
          recordType: {
            type: 'page',
            actions: [{ name: 'access', title: expect.anything() }],
          },
          resources: [],
        },
      ],
    });
    expect(
      (await authorizationOptions(authz, { rules: true })).sections[0]
        ?.subsections,
    ).toEqual([]);
    expect(authz.ui.validate(authz).errors).toEqual([]);
  });
});

describe('authz.ui startup validation', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reports unknown subsections, groups and resources, and warns about unplaced items', () => {
    const authz = createAppAuthorization({});
    authz.database.collections.add({ name: 'quotes', title: 'Quotes' });
    authz.compositeResources.define(quotes);
    authz.settings.add({ id: 'misc', title: 'Misc', actions: ['manage'] });
    authz.ui.place({ type: 'settings', id: 'misc' }, { section: 'nowhere' });
    authz.settings.add({ id: 'bills', title: 'Bills', actions: ['manage'] });
    authz.ui.place(
      { type: 'settings', id: 'bills' },
      { section: 'authorization', group: 'missing' },
    );
    authz.ui.place(
      { type: 'settings', id: 'ghost' },
      { section: 'authorization' },
    );
    authz.ui.place({ type: 'unknown', id: 'x' }, { section: 'authorization' });
    const report = authz.ui.validate(authz);
    expect(report.errors).toEqual([
      'settings:misc is placed in unknown subsection nowhere',
      'settings:bills is placed in unknown group missing',
      'settings:ghost is placed but not registered',
      'unknown:x is placed but not registered',
    ]);
    expect(report.warnings).toEqual([
      'composite:sales.quotes is not placed; it is listed under business.other',
    ]);
  });

  it('includes composites whose data scope targets a type without recordAccess', () => {
    const authz = createAppAuthorization({});
    authz.compositeResources.define({
      name: 'ledger.view',
      title: 'Ledger',
      actions: [
        {
          name: 'view',
          title: 'View',
          dataScopes: [{ key: 'rows', title: 'Rows' }],
          grants: [
            {
              resource: { type: 'ledger', id: 'main' },
              actions: [{ action: 'read', scopeKey: 'rows' }],
            },
          ],
        },
      ],
    });
    authz.resourceTypes.add({ type: 'ledger', actions: ['read'] });
    authz.ui.place(
      { type: 'composite', id: 'ledger.view' },
      { section: 'authorization' },
    );
    expect(authz.ui.validate(authz).errors).toEqual([
      'Data scope ledger.view.view.rows targets resource type ledger, which does not declare recordAccess',
    ]);
  });

  it('runs when the provider starts, after every plugin has booted: throws in development and warns in production', async () => {
    const container = new ServiceContainer();
    const app = {
      container,
      config: { get: () => undefined },
    } as unknown as AppPluginApplication;
    const provider = new AuthorizationProvider(app);
    provider.register();
    await provider.boot();
    const authz = container.resolve(authorizationToken);
    authz.ui.place(
      { type: 'settings', id: 'ghost' },
      { section: 'authorization' },
    );
    authz.settings.add({ id: 'misc', title: 'Misc', actions: ['manage'] });
    const error = 'settings:ghost is placed but not registered';
    const warning =
      'settings:misc is not placed; it is listed under administration.other';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'development');
    await expect(provider.start()).rejects.toThrow(
      `misconfigured:\n- ${error}`,
    );
    expect(warn.mock.calls).toEqual([[`Authorization workspace: ${warning}`]]);
    warn.mockClear();
    vi.stubEnv('NODE_ENV', 'production');
    await expect(provider.start()).resolves.toBeUndefined();
    expect(warn.mock.calls).toEqual([
      [`Authorization workspace: ${warning}`],
      [`Authorization workspace: ${error}`],
    ]);
    warn.mockRestore();
  });
});

describe('options', () => {
  it('lists sections with their subsections, but no type without a default section', async () => {
    const authz = createAppAuthorization({});
    authz.database.collections.add({ name: 'orders', title: 'Orders' });
    const custom = new ResourceItems();
    authz.resourceTypes.add({ type: 'custom', items: custom });
    custom.add({ id: 'one', title: 'One', actions: ['read'] });
    authz.resourceTypes.add({
      type: 'hub.app',
      actions: ['read'],
    });
    authz.ui.sections.add({
      name: 'automation',
      title: 'Automation',
      parent: 'administration',
    });
    authz.settings.add({
      id: 'workflow',
      title: 'Workflow',
      actions: [{ name: 'manage' }],
    });
    authz.ui.place(
      { type: 'settings', id: 'workflow' },
      { section: 'automation' },
    );
    authz.settings.add({
      id: 'misc',
      title: 'Misc',
      actions: [{ name: 'manage' }],
    });
    const options = await authorizationOptions(authz);
    expect(tree(options)).toEqual([
      ['pages', ['pages.page']],
      ['business', []],
      [
        'administration',
        ['authorization', 'automation', 'administration.other'],
      ],
    ]);
    const administration = options.sections[2]!.subsections;
    expect(administration[0]).toMatchObject({
      name: 'authorization',
      title: expect.objectContaining({
        key: 'options.settingsModules.authorization',
      }),
    });
    // The inspector is not a grantable settings item; its routes still check `settings:authorization.inspector`.
    expect(administration[0]?.resources.map((resource) => resource.id)).toEqual(
      ['authorization.permission-sets'],
    );
    expect(administration[1]?.resources).toEqual([
      {
        type: 'settings',
        id: 'workflow',
        title: 'Workflow',
        actions: [{ name: 'manage', title: 'manage' }],
      },
    ]);
    // A resource without a subsection lands in its default section's "Other".
    expect(administration[2]).toMatchObject({
      title: expect.objectContaining({ key: 'sections.other' }),
      resources: [{ type: 'settings', id: 'misc' }],
    });
    expect(options.resourceGroups).toBeUndefined();
  });

  it('orders a subsection by placement order, then unordered ones by registration', async () => {
    const authz = createAppAuthorization({});
    authz.ui.sections.add({
      name: 'automation',
      title: 'Automation',
      parent: 'administration',
    });
    for (const [id, order] of [
      ['unordered', undefined],
      ['last', 100],
      ['first', 1],
    ] as const) {
      authz.settings.add({ id, title: id, actions: [{ name: 'manage' }] });
      authz.ui.place(
        { type: 'settings', id },
        { section: 'automation', ...(order === undefined ? {} : { order }) },
      );
    }
    const options = await authorizationOptions(authz);
    const automation = options.sections[2]!.subsections.find(
      (subsection) => subsection.name === 'automation',
    );
    expect(automation?.resources.map((resource) => resource.id)).toEqual([
      'first',
      'last',
      'unordered',
    ]);
    expect(() =>
      authz.ui.place(
        { type: 'settings', id: 'first' },
        { section: 'automation', order: Number.NaN },
      ),
    ).toThrow('needs a finite order');
  });

  it('lists the resource groups the resources name, with their ancestors', async () => {
    const authz = createAppAuthorization({});
    authz.ui.groups.add({ name: 'ledgers', title: 'Ledgers' });
    authz.ui.groups.add({
      name: 'payables',
      title: 'Payables',
      parent: 'ledgers',
      order: 2,
    });
    authz.ui.groups.add({ name: 'unused', title: 'Unused' });
    authz.settings.add({
      id: 'bills',
      title: 'Bills',
      actions: [{ name: 'manage' }],
    });
    authz.settings.add({
      id: 'invoices',
      title: 'Invoices',
      actions: [{ name: 'manage' }],
    });
    authz.ui.place(
      { type: 'settings', id: 'invoices' },
      { section: 'authorization', group: 'payables' },
    );
    const options = await authorizationOptions(authz);
    expect(options.resourceGroups).toEqual([
      { name: 'ledgers', title: 'Ledgers' },
      { name: 'payables', title: 'Payables', parent: 'ledgers', order: 2 },
    ]);
    expect(
      options.sections[2]?.subsections
        .flatMap((subsection) => subsection.resources)
        .find((resource) => resource.id === 'invoices'),
    ).toMatchObject({ group: 'payables' });
    expect(
      options.sections[2]?.subsections
        .find((subsection) => subsection.name === 'authorization')
        ?.resources.map((resource) => resource.id),
    ).toContain('invoices');
  });

  it('describes composite data scopes and narrows rule options to them', async () => {
    const authz = createAppAuthorization({});
    authz.database.collections.add({ name: 'orders', title: 'Orders' });
    authz.ui.sections.add({
      name: 'sales',
      title: 'Sales',
      parent: 'business',
    });
    expect(tree(await authorizationOptions(authz, { rules: true }))).toEqual([
      ['pages', []],
      ['business', []],
      ['administration', []],
    ]);
    const title = { key: 'sales.title', ns: 'example' };
    const actionTitle = { key: 'sales.view', ns: 'example' };
    const orders = authz.compositeResources.define({
      name: 'sales.orders',
      title,
      actions: [
        {
          name: 'view',
          title: actionTitle,
          dataScopes: [
            {
              key: 'orders',
              title: 'Orders',
              options: ['recordsIOwn', 'allRecords'],
            },
          ],
          grants: [
            {
              resource: { type: 'database.collection', id: 'orders' },
              actions: [
                {
                  action: 'read',
                  policy: { type: 'database' },
                  scopeKey: 'orders',
                },
              ],
            },
          ],
        },
        {
          name: 'export',
          title: 'Export',
          grants: [
            {
              resource: { type: 'database.collection', id: 'orders' },
              actions: [{ action: 'read', policy: { type: 'database' } }],
            },
          ],
        },
      ],
    });
    authz.ui.place(orders, { section: 'sales' });
    const options = await authorizationOptions(authz);
    expect(options.sections[1]).toMatchObject({
      name: 'business',
      subsections: [
        {
          name: 'sales',
          title: 'Sales',
          resources: [
            {
              type: 'composite',
              id: 'sales.orders',
              title: expect.objectContaining(title),
              actions: [
                { name: 'view', title: expect.objectContaining(actionTitle) },
                { name: 'export', title: 'Export' },
              ],
              dataScopes: {
                view: [
                  {
                    key: 'orders',
                    title: 'Orders',
                    collection: 'orders',
                    fields: [],
                    recordAccess: ['allRecords'],
                  },
                ],
              },
            },
          ],
        },
      ],
    });
    const rules = await authorizationOptions(authz, { rules: true });
    expect(tree(rules)).toEqual([
      ['pages', []],
      ['business', ['sales']],
      ['administration', []],
    ]);
    expect(rules.recordAccess.map((entry) => entry.key)).toContain(
      'recordsIOwn',
    );
  });
});
