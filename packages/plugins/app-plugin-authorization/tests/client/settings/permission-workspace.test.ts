// @vitest-environment node
import { appClientLocales } from '@nocobase/app-client';
import { describe, expect, it } from 'vitest';
import {
  defineAppRoutes,
  defineSystemSettingsRoutes,
  resolveAppClientContributions,
  SYSTEM_SETTINGS_CATEGORIES,
} from '@nocobase/app-client/plugins';
import type {
  AuthorizationOptionsResponse,
  LocalizedText,
  PermissionGrant,
} from '../../../client/index.js';
import { authorizationSettingsRoutes } from '../../../client/routes.js';
import { defaultPermissionPageCatalog } from '../../../client/settings/page-catalog.js';
import { permissionWorkspace } from '../../../client/settings/permission-workspace.js';
import type { PermissionWorkspaceSelection } from '../../../client/settings/workspace-selection.js';
import {
  CUSTOM_FILTER,
  NO_SCOPE,
  applyFilter,
  draftFromGrants,
  filterKey,
  grantsFromDraft,
  permissionRowId,
  sameGrants,
  unconfiguredFilter,
} from '../../../client/settings/permissions-model.js';
import {
  applyQuickSet,
  settingsPageObject,
  menusUsing,
  dependentsOf,
  narrowerOptions,
  setActionEnabled,
  setScopeValue,
  type PermissionGrants,
  type PermissionValue,
} from '../../../client/components/permission-editor-model.js';
import pluginEnUS from '../../../client/locales/en-US.js';
import { appWords, settingsRoutes } from '../../helpers/settings-fixture.js';

// The words of this plugin's pages and of the application's own routes, as one lookup.
const enUS = {
  ...pluginEnUS,
  navigation: appWords['en-US'].navigation,
  settings: { ...pluginEnUS.settings, ...appWords['en-US'].settings },
};

/** The application's home page, which everyone signed in may open. */
const home = defineAppRoutes([
  {
    name: 'home',
    path: '/',
    authz: 'skip',
    navigation: { title: 'navigation.home' },
    componentLoader: async () => ({ default: () => null }),
  },
]);

/** A settings page another plugin guards with a page grant, as the capability guide does. */
const GUIDE_ACCESS = {
  resource: { type: 'page', id: 'fixture-guide' },
  action: 'access',
} as const;
const guide = defineSystemSettingsRoutes([
  {
    parent: SYSTEM_SETTINGS_CATEGORIES.system,
    name: 'fixtureGuide',
    path: '/guide',
    auth: 'required',
    authz: GUIDE_ACCESS,
    navigation: {
      title: 'Fixture guide',
      relatedSettings: ['fixture-personal', 'uninstalled-plugin'],
    },
    componentLoader: async () => ({ default: () => null }),
  },
]);

const appClientEnUS = (
  (await appClientLocales['en-US']!()) as { readonly default: object }
).default;
const find = (resources: object, key: string): unknown =>
  key
    .split('.')
    .reduce<unknown>(
      (value, part) =>
        value && typeof value === 'object'
          ? Reflect.get(value, part)
          : undefined,
      resources,
    );
const lookup = (key: string): unknown =>
  find(enUS, key) ?? find(appClientEnUS, key);
const words = {
  text: (value: LocalizedText): string =>
    typeof value === 'string'
      ? value
      : String(lookup(value.key) ?? value.defaultValue ?? value.key),
  t: (key: string, values?: Record<string, unknown>): string =>
    String(lookup(key) ?? key).replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
      String(values?.[name] ?? ''),
    ),
};

const scope = (key: string, collection: string, defaultValue = '') => ({
  key,
  collection,
  title: key,
  fields: ['ownerId'],
  recordAccess: ['allRecords', 'customFilter', 'department', 'own'],
  defaultValue,
});

const source = {
  sections: [
    {
      name: 'business',
      title: 'Business operations',
      order: 100,
      subsections: [
        {
          name: 'fixtureContracts',
          title: 'Contracts',
          resources: [
            {
              type: 'composite',
              id: 'contracts',
              title: 'Contracts',
              actions: [
                { name: 'view', title: 'View' },
                { name: 'update', title: 'Edit' },
                { name: 'approve', title: 'Approve' },
                { name: 'refund', title: 'Refund' },
                { name: 'sign', title: 'Sign' },
              ],
              dataScopes: {
                view: [scope('records', 'contracts', 'own')],
                update: [scope('records', 'contracts')],
                approve: [
                  scope('records', 'contracts'),
                  scope('departments', 'departments'),
                ],
                // Signing also reads the contract's contacts, another object's records.
                sign: [
                  scope('records', 'contracts'),
                  scope('signers', 'contacts', 'own'),
                ],
              },
            },
            {
              type: 'composite',
              id: 'contract-contacts',
              title: 'Contacts',
              actions: [
                { name: 'view', title: 'View' },
                { name: 'update', title: 'Edit' },
              ],
              dataScopes: {
                view: [scope('records', 'contacts')],
                update: [scope('records', 'contacts')],
              },
            },
          ],
        },
      ],
    },
    {
      name: 'administration',
      title: 'Administration',
      order: 200,
      subsections: [
        {
          name: 'authorization',
          title: 'Authorization',
          resources: [
            {
              type: 'settings',
              id: 'fixture-personal',
              title: 'Personal tools',
              actions: [
                { name: 'create', title: 'Create personal tool', risk: 'high' },
              ],
            },
            {
              type: 'settings',
              id: 'authorization.permission-sets',
              title: 'Permission sets',
              actions: [
                { name: 'read', title: 'Read' },
                { name: 'update', title: 'Update' },
              ],
            },
          ],
        },
      ],
    },
  ],
  recordAccess: [
    { key: 'allRecords', title: 'All records' },
    { key: 'customFilter', title: 'Custom filter' },
    { key: 'department', title: 'Their department' },
    { key: 'own', title: 'Their own' },
  ],
  subjectTypes: [],
  // Registered with `authz.database.collections.add`; the server titles untitled scopes only with their keys.
  collections: [
    { name: 'contracts', title: 'Contract records', fields: ['ownerId'] },
    { name: 'departments', title: 'Departments', fields: ['ownerId'] },
  ],
} as unknown as AuthorizationOptionsResponse;

const business = defineAppRoutes([
  {
    name: 'fixtureSales',
    navigation: { title: 'Fixture sales' },
    children: [
      {
        name: 'fixtureContracts',
        path: '/fixture-contracts',
        authz: {
          resource: { type: 'page', id: 'contracts' },
          action: 'access',
        },
        navigation: { title: 'Fixture contracts' },
        componentLoader: async () => ({ default: () => null }),
        children: [
          {
            name: 'fixtureContractDetails',
            path: ':id',
            componentLoader: async () => ({ default: () => null }),
          },
        ],
      },
      {
        name: 'fixtureReports',
        path: '/fixture-reports',
        authz: {
          resource: { type: 'page', id: 'fixture-reports' },
          action: 'access',
        },
        navigation: { title: 'Fixture reports' },
        componentLoader: async () => ({ default: () => null }),
      },
      {
        name: 'fixtureHelp',
        path: '/fixture-help',
        authz: 'skip',
        navigation: { title: 'Fixture help' },
        componentLoader: async () => ({ default: () => null }),
      },
    ],
  },
]);

const selection: PermissionWorkspaceSelection = {
  business: [
    {
      type: 'composite',
      id: 'contracts',
      actions: ['view', 'update', 'approve', 'refund', 'sign'],
      risks: { refund: 'high' },
      scopeOrder: ['allRecords', 'department', 'own'],
    },
    {
      type: 'composite',
      id: 'contract-contacts',
      actions: ['view', 'update'],
      scopeOrder: ['allRecords', 'department', 'own'],
    },
  ],
  pages: {
    fixtureContracts: {
      primary: ['contracts'],
      related: ['contract-contacts'],
    },
    fixtureReports: { related: ['contracts'] },
  },
};

async function workspace(chosen: PermissionWorkspaceSelection = selection) {
  const { routes } = resolveAppClientContributions([
    {
      packageName: '@nocobase/app-testing',
      source: 'application',
      routes: [home, ...settingsRoutes, business],
    },
    {
      packageName: '@nocobase/app-plugin-authorization',
      source: 'plugin',
      routes: [authorizationSettingsRoutes(), guide],
    },
  ]);
  return {
    workspace: permissionWorkspace(
      source,
      defaultPermissionPageCatalog(routes),
      {},
      words,
      chosen,
    ),
  };
}

type Workspace = Awaited<ReturnType<typeof workspace>>['workspace'];

const contract = (action: string) =>
  permissionRowId({ type: 'composite', id: 'contracts' }, action);
const contact = (action: string) =>
  permissionRowId({ type: 'composite', id: 'contract-contacts' }, action);
const objectOf = (ws: Workspace, label: string) =>
  ws.objects.find((object) => object.label === label);
const leaves = (
  nodes: Workspace['menus'],
  path: readonly string[] = [],
): { path: readonly string[]; menu: Workspace['menus'][number] }[] =>
  nodes.flatMap((node) =>
    node.children
      ? leaves(node.children, [...path, node.label])
      : [{ path, menu: node }],
  );
const menuOf = (ws: Workspace, label: string) =>
  leaves(ws.menus).find(({ menu }) => menu.label === label)?.menu;
const value = (
  grants: PermissionGrants,
  menus: readonly string[] = [],
): PermissionValue => ({ menus, grants });

describe('role permission workspace', () => {
  it('sets each business object once, with View first and the other scopes following it', async () => {
    const { workspace: ws } = await workspace();
    const contracts = objectOf(ws, 'Contracts')!;
    // Objects are grouped by the catalog subsection that registers them.
    expect(contracts.group).toBe('Contracts');
    expect(contracts.actions.map((action) => action.label)).toEqual([
      'View',
      'Edit',
      'Approve',
      'Refund',
      'Sign',
    ]);
    const [view, edit, approve, refund] = contracts.actions;
    expect(view).toMatchObject({ view: true });
    expect(view?.scopes?.[0]?.options?.map((option) => option.value)).toEqual([
      'allRecords',
      'department',
      'own',
      CUSTOM_FILTER,
      NO_SCOPE,
    ]);
    expect(edit?.scopes).toEqual([
      expect.objectContaining({ id: 'records', followsView: true }),
    ]);
    // An action with two kinds of data has a scope for each; only the one on View's collection follows it.
    expect(approve).toMatchObject({ business: true });
    expect(approve?.scopes?.map((slot) => [slot.id, slot.followsView])).toEqual(
      [
        ['records', true],
        ['departments', undefined],
      ],
    );
    expect(refund).toMatchObject({ risk: 'high', business: true });
    // A second object on the same page is an object of its own, never flattened into the first.
    expect(
      objectOf(ws, 'Contacts')?.actions.map((action) => action.label),
    ).toEqual(['View', 'Edit']);
    expect(contracts.actions.some((action) => action.label.includes('·'))).toBe(
      false,
    );
  });

  it('lists every menu with the objects its page uses, for reference only', async () => {
    const { workspace: ws } = await workspace();
    // Top-level pages sit at the top of the tree, with no Main menu group around them.
    expect(ws.menus.some((node) => node.id === 'group:main')).toBe(false);
    expect(
      ws.menus.find((node) => node.label === enUS.navigation.home),
    ).toMatchObject({ public: true });
    const sales = ws.menus.find((node) => node.label === 'Fixture sales');
    expect(sales?.children?.map((menu) => menu.label)).toEqual([
      'Fixture contracts',
      'Fixture reports',
      'Fixture help',
    ]);
    const contracts = menuOf(ws, 'Fixture contracts')!;
    // A page declares the objects it uses.
    expect(contracts.uses).toEqual({
      primary: ['composite:contracts'],
      related: ['composite:contract-contacts'],
    });
    expect(menuOf(ws, 'Fixture reports')?.uses).toEqual({
      related: ['composite:contracts'],
    });
    expect(ws.menuPages.get(contracts.id)).toEqual(['contracts']);
    expect(menuOf(ws, 'Fixture help')).toMatchObject({ public: true });
    // One object, used by two menus.
    expect(
      menusUsing(ws.menus, 'composite:contracts').map((menu) => menu.label),
    ).toEqual(['Fixture contracts', 'Fixture reports']);
  });

  it('infers a primary object from the stored page id when no mapping is declared', async () => {
    const { workspace: ws } = await workspace({ business: selection.business });
    expect(menuOf(ws, 'Fixture contracts')?.uses).toEqual({
      primary: ['composite:contracts'],
    });
    expect(menuOf(ws, 'Fixture reports')?.uses).toBeUndefined();
  });

  it.each([
    {
      declaration: { primary: ['contract-contacts'], related: ['contracts'] },
      expected: {
        primary: ['composite:contract-contacts'],
        related: ['composite:contracts'],
      },
    },
    {
      declaration: { related: ['contracts'] },
      expected: { related: ['composite:contracts'] },
    },
    { declaration: {}, expected: undefined },
  ])(
    'honors an explicit mapping over inference ($declaration)',
    async ({ declaration, expected }) => {
      const { workspace: ws } = await workspace({
        business: selection.business,
        pages: { fixtureContracts: declaration },
      });
      expect(menuOf(ws, 'Fixture contracts')?.uses).toEqual(expected);
    },
  );

  it('sets system settings in their own tab, one page per settings module', async () => {
    const { workspace: ws } = await workspace();
    const page = (label: string) =>
      ws.settings.find((item) => item.label === label);
    const roles = page(enUS.settings.permissionManagement)!;
    const sets = roles.objects.find(
      (object) => object.id === 'settings:authorization.permission-sets',
    )!;
    // Settings menus and objects appear only here, never among the business menus and objects.
    expect(
      leaves(ws.menus).some(({ menu }) =>
        [enUS.settings.users, enUS.settings.permissionManagement].includes(
          menu.label,
        ),
      ),
    ).toBe(false);
    expect(ws.objects.some((object) => object.id.startsWith('settings:'))).toBe(
      false,
    );
    expect(ws.objects.some((object) => object.id === 'user:*')).toBe(false);
    // Grouped by the settings home's categories; no data scopes.
    expect(roles.group).toBe('Accounts and permissions');
    expect(
      ws.settings.flatMap((item) =>
        item.objects.flatMap((object) =>
          object.actions.filter((action) => action.scopes?.length),
        ),
      ),
    ).toEqual([]);
    expect(sets.actions[0]).toMatchObject({
      id: permissionRowId(
        { type: 'settings', id: 'authorization.permission-sets' },
        'read',
      ),
      view: true,
    });
    expect(
      sets.actions.find(
        (action) =>
          action.id ===
          permissionRowId(
            { type: 'settings', id: 'authorization.permission-sets' },
            'update',
          ),
      ),
    ).toMatchObject({ risk: 'high' });
    expect(sets.notice).toBe(enUS.settings.escalation.roles);
    const users = page(enUS.settings.users)!.objects[0]!;
    expect(users.actions[0]).toMatchObject({
      label: enUS.settings.readUsers,
      view: true,
    });
    expect(
      users.actions.find((action) => action.label === enUS.settings.assignRole),
    ).toMatchObject({ risk: 'high' });
    // A page guarded by a page grant opens with one action, stored as that page's access and not as a menu.
    const guide = ws.settings.find((item) =>
      item.objects.some((object) =>
        object.actions.some(
          (action) =>
            action.id ===
            permissionRowId(
              { type: 'page', id: GUIDE_ACCESS.resource.id },
              'access',
            ),
        ),
      ),
    )!;
    const personalAction = guide.objects[1]!.actions[0]!;
    expect(guide.objects).toHaveLength(2);
    expect(personalAction).toMatchObject({
      label: 'Create personal tool',
      risk: 'high',
    });
    const personalOnly = setActionEnabled(
      guide.objects,
      {},
      personalAction.id,
      true,
    );
    expect(
      grantsFromDraft({ menus: [], grants: personalOnly.grants }, {}, [], ws),
    ).toEqual([
      {
        resource: { type: 'settings', id: 'fixture-personal' },
        actions: [{ action: 'create' }],
      },
    ]);
    const open = guide.objects[0]!.actions[0]!;
    expect(open).toMatchObject({ label: enUS.settings.openPage, view: true });
    expect(
      [...ws.menuPages.values()].some((pages) =>
        pages.includes(GUIDE_ACCESS.resource.id),
      ),
    ).toBe(false);
    const saved = grantsFromDraft(
      { menus: [], grants: { [open.id]: {} } },
      {},
      [],
      ws,
    );
    expect(saved).toEqual([
      {
        resource: { type: 'page', id: GUIDE_ACCESS.resource.id },
        actions: [{ action: 'access' }],
      },
    ]);
    expect(draftFromGrants(saved, ws).draft).toEqual({
      menus: [],
      grants: { [open.id]: {} },
    });
    // Enable all for a page leaves the risky actions off.
    const enabled = applyQuickSet(
      [...ws.objects, ...ws.settings.flatMap((item) => item.objects)],
      {},
      settingsPageObject(roles),
      'all',
    ).grants;
    expect(Object.keys(enabled)).toContain(sets.actions[0]!.id);
    expect(
      sets.actions
        .filter((action) => action.risk)
        .some((action) => enabled[action.id]),
    ).toBe(false);
  });

  it('stores what the editor shows and keeps what it does not', async () => {
    const { workspace: ws } = await workspace();
    const unrelated: PermissionGrant = {
      resource: { type: 'composite', id: 'other-plugin' },
      actions: [{ action: 'run' }],
    };
    const original: PermissionGrant[] = [
      unrelated,
      {
        resource: { type: 'composite', id: 'contracts' },
        actions: [
          {
            action: 'view',
            policy: { type: 'composite', scopes: { records: 'department' } },
          },
          // Stored with View's own value: it follows View.
          {
            action: 'update',
            policy: { type: 'composite', scopes: { records: 'department' } },
          },
          {
            action: 'approve',
            policy: {
              type: 'composite',
              scopes: {
                records: 'own',
                departments: { type: 'legacyPolicy', filter: {} },
              },
            },
          },
        ],
      },
      {
        resource: { type: 'page', id: 'contracts' },
        actions: [{ action: 'access' }],
      },
    ];
    const { draft, filters } = draftFromGrants(original, ws);
    expect(draft).toEqual({
      menus: [menuOf(ws, 'Fixture contracts')!.id],
      grants: {
        [contract('view')]: { scopes: { records: 'department' } },
        [contract('update')]: {},
        [contract('approve')]: {
          scopes: { records: 'own', departments: '__preserved__' },
        },
      },
    });
    expect(
      sameGrants(grantsFromDraft(draft, filters, original, ws), original),
    ).toBe(true);

    // Narrowing View narrows its followers with it.
    const narrowed = grantsFromDraft(
      {
        ...draft,
        grants: {
          ...draft.grants,
          [contract('view')]: { scopes: { records: 'own' } },
        },
      },
      filters,
      original,
      ws,
    );
    const actions = narrowed.find(
      (grant) => grant.resource.id === 'contracts',
    )!.actions;
    expect(actions.find((entry) => entry.action === 'update')?.policy).toEqual({
      type: 'composite',
      scopes: { records: 'own' },
    });
    // An unknown stored scope is kept as it was.
    expect(
      actions.find((entry) => entry.action === 'approve')?.policy?.scopes,
    ).toEqual({
      records: 'own',
      departments: { type: 'legacyPolicy', filter: {} },
    });
    expect(narrowed).toContainEqual(unrelated);
  });

  it('stores menu access apart from the objects’ actions', async () => {
    const { workspace: ws } = await workspace();
    const page = { type: 'page', id: 'contracts' };
    const menu = menuOf(ws, 'Fixture contracts')!.id;
    // An action alone opens no menu.
    const actionOnly = grantsFromDraft(
      value({ [contract('update')]: {} }),
      {},
      [],
      ws,
    );
    expect(actionOnly.some((grant) => grant.resource.type === 'page')).toBe(
      false,
    );
    expect(
      actionOnly.find((grant) => grant.resource.id === 'contracts')?.actions,
    ).toEqual([
      // Edit follows View's default when View is off.
      {
        action: 'update',
        policy: { type: 'composite', scopes: { records: '' } },
      },
    ]);
    // A checked menu opens its page without any action.
    expect(grantsFromDraft(value({}, [menu]), {}, [], ws)).toEqual([
      { resource: page, actions: [{ action: 'access' }] },
    ]);
    // Unchecking it closes the page and leaves the object's actions as they are.
    const stored: PermissionGrant[] = [
      { resource: page, actions: [{ action: 'access' }] },
      {
        resource: { type: 'composite', id: 'contracts' },
        actions: [
          {
            action: 'view',
            policy: { type: 'composite', scopes: { records: 'own' } },
          },
        ],
      },
    ];
    const { draft, filters } = draftFromGrants(stored, ws);
    expect(draft.menus).toEqual([menu]);
    expect(
      grantsFromDraft({ ...draft, menus: [] }, filters, stored, ws),
    ).toEqual([stored[1]]);
  });

  it('keeps per-page grants of a menu nobody toggled and opens or closes all its pages only when it is toggled', () => {
    const list = { type: 'page', id: 'orders-list' };
    const detail = { type: 'page', id: 'orders-detail' };
    const ws = {
      menus: [],
      objects: [],
      settings: [],
      bindings: new Map(),
      menuPages: new Map([['orders', ['orders-list', 'orders-detail']]]),
    } satisfies Parameters<typeof grantsFromDraft>[3];
    // Only the list opens, so the menu reads as checked.
    const stored: PermissionGrant[] = [
      { resource: list, actions: [{ action: 'access' }] },
    ];
    const { draft, filters } = draftFromGrants(stored, ws);
    expect(draft.menus).toEqual(['orders']);
    // Saving it unchanged, or only renaming the role, grants the detail nothing.
    expect(grantsFromDraft(draft, filters, stored, ws)).toEqual(stored);
    // Unchecking closes every page; checking it again from nothing opens every page.
    expect(
      grantsFromDraft({ ...draft, menus: [] }, filters, stored, ws),
    ).toEqual([]);
    expect(grantsFromDraft(draft, filters, [], ws)).toEqual([
      { resource: list, actions: [{ action: 'access' }] },
      { resource: detail, actions: [{ action: 'access' }] },
    ]);
  });

  it('keeps a granted action’s hidden scopes as stored and gives only a new action their initial value', () => {
    const resource = { type: 'composite', id: 'orders' };
    const id = permissionRowId(resource, 'create');
    const ws = {
      menus: [],
      objects: [],
      settings: [],
      bindings: new Map([
        [
          id,
          {
            resource,
            action: 'create',
            view: false,
            scopes: [
              {
                key: 'orders',
                collection: 'orders',
                fields: [],
                visible: false,
                defaultValue: 'allRecords',
              },
              {
                key: 'stations',
                collection: 'stations',
                fields: [],
                visible: true,
                defaultValue: 'own',
              },
            ],
          },
        ],
      ]),
      menuPages: new Map(),
    } satisfies Parameters<typeof grantsFromDraft>[3];
    const roundTrip = (stored: PermissionGrant[]) => {
      const { draft, filters } = draftFromGrants(stored, ws);
      return grantsFromDraft(draft, filters, stored, ws);
    };
    const withScopes = (scopes: Record<string, unknown>): PermissionGrant[] => [
      {
        resource,
        actions: [{ action: 'create', policy: { type: 'composite', scopes } }],
      },
    ];
    // The hidden key is missing, or null: both stay so.
    const missing = withScopes({ stations: 'own' });
    expect(roundTrip(missing)).toEqual(missing);
    const nulled = withScopes({ orders: null, stations: 'own' });
    expect(roundTrip(nulled)).toEqual(nulled);
    // Turned on now, the action gets the hidden scope's initial value.
    expect(grantsFromDraft(value({ [id]: {} }), {}, [], ws)).toEqual(
      withScopes({ orders: 'allRecords', stations: 'own' }),
    );
  });

  it('asks for custom filter conditions before saving and stores them with the scope', async () => {
    const { workspace: ws } = await workspace();
    const grants = {
      [contract('view')]: { scopes: { records: CUSTOM_FILTER } },
    };
    expect(unconfiguredFilter(grants, {}, ws)).toEqual({
      action: contract('view'),
      scope: 'records',
    });
    const filter = { status: { $eq: 'signed' } };
    const filters = { [filterKey(contract('view'), 'records')]: filter };
    expect(unconfiguredFilter(grants, filters, ws)).toBeUndefined();
    const stored = grantsFromDraft(value(grants), filters, [], ws);
    expect(
      stored.find((grant) => grant.resource.type === 'composite')?.actions,
    ).toEqual([
      {
        action: 'view',
        policy: {
          type: 'composite',
          scopes: {
            records: {
              type: 'recordAccess',
              key: CUSTOM_FILTER,
              params: { filter },
            },
          },
        },
      },
    ]);
    expect(draftFromGrants(stored, ws)).toEqual({
      draft: value(grants),
      filters,
    });
  });

  it('offers Edit only scopes provably inside View', async () => {
    const values = async (chosen: PermissionWorkspaceSelection) => {
      const { workspace: ws } = await workspace(chosen);
      const contracts = objectOf(ws, 'Contracts')!;
      const edit = contracts.actions[1]!;
      const grants = {
        [contract('view')]: { scopes: { records: 'department' } },
        [contract('update')]: {},
      };
      return {
        offered: narrowerOptions(contracts, grants, edit.scopes![0]!).map(
          (option) => option.value,
        ),
        // Picking an unrelated scope keeps Edit on Same as view.
        picked: setScopeValue(
          ws.objects,
          grants,
          contract('update'),
          'records',
          'own',
        ).grants[contract('update')]?.scopes,
      };
    };
    // Their department and Their own filter different fields: neither is known to hold the other.
    expect(await values(selection)).toEqual({
      offered: [NO_SCOPE],
      picked: {},
    });
    const nested: PermissionWorkspaceSelection = {
      business: [
        { ...selection.business[0]!, scopeSubsets: { department: ['own'] } },
      ],
    };
    expect(await values(nested)).toEqual({
      offered: ['own', NO_SCOPE],
      picked: { records: 'own' },
    });
  });

  it('lets each object follow its own View', async () => {
    const { workspace: ws } = await workspace();
    const edit = objectOf(ws, 'Contacts')!.actions.find(
      (action) => action.id === contact('update'),
    )!;
    expect(edit.scopes?.[0]?.followsView).toBe(true);
    // Contacts View narrowed to Their own sends a wider contacts Edit back to it, whatever the contracts View is.
    const change = setScopeValue(
      ws.objects,
      {
        [contract('view')]: { scopes: { records: 'allRecords' } },
        [contact('view')]: { scopes: { records: 'allRecords' } },
        [contact('update')]: { scopes: { records: 'department' } },
      },
      contact('view'),
      'records',
      'own',
    );
    expect(change.grants[contact('update')]?.scopes).toEqual({});
    expect(change.notices).toHaveLength(1);
    // Saved, the contacts Edit stores the contacts View's value.
    const stored = grantsFromDraft(value(change.grants), {}, [], ws);
    expect(
      stored
        .find((grant) => grant.resource.id === 'contract-contacts')
        ?.actions.find((entry) => entry.action === 'update')?.policy?.scopes,
    ).toEqual({ records: 'own' });
  });

  it('lets a scope on another object’s records follow that object’s View, set in one place', async () => {
    const { workspace: ws } = await workspace();
    const contracts = objectOf(ws, 'Contracts')!;
    const sign = contracts.actions.find(
      (action) => action.id === contract('sign'),
    )!;
    expect(sign.scopes?.map((slot) => slot.followsView)).toEqual([
      true,
      contact('view'),
    ]);
    const grants: PermissionGrants = {
      [contract('view')]: { scopes: { records: 'allRecords' } },
      [contract('sign')]: {},
      [contact('view')]: { scopes: { records: 'department' } },
    };
    // Never wider than the contacts View; without declared subsets only No records is provably inside it.
    expect(
      narrowerOptions(contracts, grants, sign.scopes![1]!, ws.objects).map(
        (option) => option.value,
      ),
    ).toEqual([NO_SCOPE]);
    // Saved, signing stores the contacts View's value; reloaded, it follows that View again.
    const stored = grantsFromDraft(value(grants), {}, [], ws);
    expect(
      stored
        .find((grant) => grant.resource.id === 'contracts')
        ?.actions.find((entry) => entry.action === 'sign')?.policy?.scopes,
    ).toEqual({ records: 'allRecords', signers: 'department' });
    expect(draftFromGrants(stored, ws).draft.grants[contract('sign')]).toEqual(
      {},
    );
    // Narrowing the contacts View sends a wider signer scope back to following it.
    const change = setScopeValue(
      ws.objects,
      {
        ...grants,
        [contact('view')]: { scopes: { records: 'allRecords' } },
        [contract('sign')]: { scopes: { signers: 'department' } },
      },
      contact('view'),
      'records',
      'own',
    );
    expect(change.grants[contract('sign')]?.scopes).toEqual({});
    // The contacts View is a requirement of signing: turning it off asks first and turns signing off with it.
    expect(
      dependentsOf(ws.objects, grants, [contact('view')]).map(
        (action) => action.id,
      ),
    ).toEqual([contract('sign')]);
    expect(
      setActionEnabled(ws.objects, grants, contact('view'), false).grants[
        contract('sign')
      ],
    ).toBeUndefined();
    // A stored role that signs without the contacts View never falls back to the scope's own, wider default: it is
    // saved with no signer records and reloads that way.
    const alone = grantsFromDraft(
      value({ [contract('view')]: {}, [contract('sign')]: {} }),
      {},
      [],
      ws,
    );
    expect(
      alone
        .find((grant) => grant.resource.id === 'contracts')
        ?.actions.find((entry) => entry.action === 'sign')?.policy?.scopes
        ?.signers,
    ).toBe('');
    expect(
      draftFromGrants(alone, ws).draft.grants[contract('sign')]?.scopes,
    ).toEqual({ signers: NO_SCOPE });
    // An explicit signer scope stored while the contacts View is off, by a seed or the API, is read, saved and
    // reloaded exactly as stored: opening the role never rewrites it.
    const existing: PermissionGrant[] = [
      {
        resource: { type: 'composite', id: 'contracts' },
        actions: [
          {
            action: 'view',
            policy: { type: 'composite', scopes: { records: 'allRecords' } },
          },
          {
            action: 'sign',
            policy: {
              type: 'composite',
              scopes: { records: 'allRecords', signers: 'allRecords' },
            },
          },
        ],
      },
    ];
    const read = draftFromGrants(existing, ws);
    expect(read.draft.grants[contract('sign')]?.scopes).toEqual({
      signers: 'allRecords',
    });
    const signersOf = (grants: readonly PermissionGrant[]) =>
      grants
        .find((grant) => grant.resource.id === 'contracts')
        ?.actions.find((entry) => entry.action === 'sign')?.policy?.scopes
        ?.signers;
    const saved = grantsFromDraft(read.draft, read.filters, existing, ws);
    expect(saved).toEqual(existing);
    expect(draftFromGrants(saved, ws).draft.grants[contract('sign')]).toEqual({
      scopes: { signers: 'allRecords' },
    });
    // A new action has nothing stored to keep: while that View is off it reaches no records.
    const draft = value({
      [contract('view')]: {},
      [contract('sign')]: { scopes: { signers: 'allRecords' } },
    });
    expect(signersOf(grantsFromDraft(draft, {}, [], ws))).toBe('');
  });

  it('saves a stored role unchanged until one scope is changed, whatever the Views its scopes follow', async () => {
    const { workspace: ws } = await workspace();
    const signersOf = (grants: readonly PermissionGrant[]) =>
      grants
        .find((grant) => grant.resource.id === 'contracts')
        ?.actions.find((entry) => entry.action === 'sign')?.policy?.scopes;
    // Seeded through the API: signing keeps signers with parameters and a plugin key, the contacts View stays off,
    // and a second stored sign entry has no signer key at all.
    const signers = {
      type: 'recordAccess',
      key: 'department',
      params: { depth: 2 },
    };
    const existing: PermissionGrant[] = [
      {
        resource: { type: 'composite', id: 'contracts' },
        actions: [
          {
            action: 'view',
            policy: { type: 'composite', scopes: { records: 'allRecords' } },
          },
          {
            action: 'sign',
            policy: {
              type: 'composite',
              scopes: {
                records: 'allRecords',
                signers,
                pluginSlot: 'kept',
              },
            },
          },
        ],
      },
    ];
    const read = draftFromGrants(existing, ws);
    // Opened and saved without a change, as when only the role's name changes, nothing is rewritten.
    expect(grantsFromDraft(read.draft, read.filters, existing, ws)).toEqual(
      existing,
    );
    const missing: PermissionGrant[] = [
      {
        resource: { type: 'composite', id: 'contracts' },
        actions: [
          {
            action: 'view',
            policy: { type: 'composite', scopes: { records: 'allRecords' } },
          },
          {
            action: 'sign',
            policy: { type: 'composite', scopes: { records: 'allRecords' } },
          },
        ],
      },
    ];
    const reread = draftFromGrants(missing, ws);
    expect(grantsFromDraft(reread.draft, reread.filters, missing, ws)).toEqual(
      missing,
    );
    // Turning the contacts View on and narrowing only the signer scope changes that scope alone.
    const on = setActionEnabled(
      ws.objects,
      read.draft.grants,
      contact('view'),
      true,
    );
    const narrowed = setScopeValue(
      ws.objects,
      on.grants,
      contract('sign'),
      'signers',
      NO_SCOPE,
    );
    const saved = grantsFromDraft(
      value(narrowed.grants),
      read.filters,
      existing,
      ws,
    );
    expect(signersOf(saved)).toEqual({
      records: 'allRecords',
      signers: '',
      pluginSlot: 'kept',
    });
    expect(
      saved.find((grant) => grant.resource.id === 'contract-contacts'),
    ).toBeDefined();
  });

  it('saves an Edit scope of its own unchanged when View widens', async () => {
    const { workspace: ws } = await workspace();
    const contracts = (records: Record<string, unknown>): PermissionGrant[] => [
      {
        resource: { type: 'composite', id: 'contracts' },
        actions: [
          {
            action: 'view',
            policy: { type: 'composite', scopes: { records: 'department' } },
          },
          {
            action: 'update',
            policy: { type: 'composite', scopes: records },
          },
        ],
      },
    ];
    const editOf = (grants: readonly PermissionGrant[]) =>
      grants
        .find((grant) => grant.resource.id === 'contracts')
        ?.actions.find((entry) => entry.action === 'update')?.policy?.scopes;
    // Edit keeps a scope of its own: one View does not hold provably, and one the catalog does not declare.
    for (const records of [
      { records: 'own' },
      {
        records: {
          type: 'recordAccess',
          key: 'legacyLimited',
          params: { depth: 1 },
        },
      },
    ]) {
      const existing = contracts(records);
      const read = draftFromGrants(existing, ws);
      const widened = setScopeValue(
        ws.objects,
        read.draft.grants,
        contract('view'),
        'records',
        'allRecords',
      );
      expect(widened.notices).toEqual([]);
      const saved = grantsFromDraft(
        value(widened.grants),
        read.filters,
        existing,
        ws,
      );
      expect(editOf(saved)).toEqual(records);
      expect(
        saved
          .find((grant) => grant.resource.id === 'contracts')
          ?.actions.find((entry) => entry.action === 'view')?.policy?.scopes,
      ).toEqual({ records: 'allRecords' });
    }
  });

  it('caps Edit to View when View gets new custom filter conditions, and keeps it otherwise', async () => {
    const { workspace: ws } = await workspace();
    const custom = (filter: unknown) => ({
      type: 'recordAccess',
      key: CUSTOM_FILTER,
      params: { filter },
    });
    const below = (amount: number) => ({ amount: { $lt: amount } });
    // View and Edit store their own custom filters; Approve follows View; Sign stores No records of its own.
    const existing: PermissionGrant[] = [
      {
        resource: { type: 'composite', id: 'contracts' },
        actions: [
          {
            action: 'view',
            policy: {
              type: 'composite',
              scopes: { records: custom(below(100)) },
            },
          },
          {
            action: 'update',
            policy: {
              type: 'composite',
              scopes: { records: custom(below(50)) },
            },
          },
          {
            action: 'approve',
            policy: {
              type: 'composite',
              scopes: { records: custom(below(100)), departments: 'own' },
            },
          },
          {
            action: 'sign',
            policy: {
              type: 'composite',
              scopes: { records: '', signers: 'own' },
            },
          },
        ],
      },
    ];
    const scopesOf = (grants: readonly PermissionGrant[], action: string) =>
      grants
        .find((grant) => grant.resource.id === 'contracts')
        ?.actions.find((entry) => entry.action === action)?.policy?.scopes;
    const read = draftFromGrants(existing, ws);
    expect(read.draft.grants[contract('approve')]?.scopes).toEqual({
      departments: 'own',
    });
    // Saving unchanged, as when only the name changes, stores exactly what was read.
    expect(
      sameGrants(
        grantsFromDraft(read.draft, read.filters, existing, ws),
        existing,
      ),
    ).toBe(true);
    // The same conditions again change nothing and say nothing.
    const again = applyFilter(
      ws.objects,
      read.draft,
      read.filters,
      contract('view'),
      'records',
      below(100),
    );
    expect(again.notices).toEqual([]);
    expect(again.value).toBe(read.draft);
    expect(
      sameGrants(
        grantsFromDraft(again.value, again.filters, existing, ws),
        existing,
      ),
    ).toBe(true);
    // New conditions with the same scope key: Edit's own filter cannot be shown to be inside them, so it follows View.
    const narrowed = applyFilter(
      ws.objects,
      read.draft,
      read.filters,
      contract('view'),
      'records',
      below(10),
    );
    expect(narrowed.notices).toEqual([
      expect.objectContaining({ kind: 'scope-reset', actions: ['Edit'] }),
    ]);
    const saved = grantsFromDraft(
      narrowed.value,
      narrowed.filters,
      existing,
      ws,
    );
    expect(scopesOf(saved, 'view')).toEqual({ records: custom(below(10)) });
    expect(scopesOf(saved, 'update')).toEqual({ records: custom(below(10)) });
    expect(scopesOf(saved, 'approve')).toEqual({
      records: custom(below(10)),
      departments: 'own',
    });
    // No records is declared inside every scope: it stays.
    expect(scopesOf(saved, 'sign')).toEqual({ records: '', signers: 'own' });
    // Widening View to All records keeps Edit's own filter.
    const widened = setScopeValue(
      ws.objects,
      read.draft.grants,
      contract('view'),
      'records',
      'allRecords',
    );
    expect(widened.notices).toEqual([]);
    expect(
      scopesOf(
        grantsFromDraft(value(widened.grants), read.filters, existing, ws),
        'update',
      ),
    ).toEqual({ records: custom(below(50)) });
  });

  it('keeps stored scope keys the catalog does not declare', async () => {
    const { workspace: ws } = await workspace();
    const original: PermissionGrant[] = [
      {
        resource: { type: 'composite', id: 'contracts' },
        actions: [
          {
            action: 'view',
            policy: {
              type: 'composite',
              scopes: { records: 'department', pluginSlot: 'kept' },
            },
          },
        ],
      },
      {
        resource: { type: 'page', id: 'contracts' },
        actions: [{ action: 'access' }],
      },
    ];
    const { draft, filters } = draftFromGrants(original, ws);
    expect(
      sameGrants(grantsFromDraft(draft, filters, original, ws), original),
    ).toBe(true);
    const changed = grantsFromDraft(
      {
        ...draft,
        grants: { [contract('view')]: { scopes: { records: 'own' } } },
      },
      filters,
      original,
      ws,
    );
    expect(
      changed.find((grant) => grant.resource.id === 'contracts')?.actions[0]
        ?.policy?.scopes,
    ).toEqual({ records: 'own', pluginSlot: 'kept' });
  });

  it('labels the scopes of a multi-scope action with their registered collection titles', async () => {
    const { workspace: ws } = await workspace();
    const approve = objectOf(ws, 'Contracts')!.actions.find(
      (action) => action.id === contract('approve'),
    );
    // The server titles these scopes only with their keys; the registered tables have real names.
    expect(approve?.scopes?.map((slot) => slot.label)).toEqual([
      'Contract records',
      'Departments',
    ]);
  });

  it('overrides the label of a scope slot by its key, not its table name', async () => {
    const { workspace: ws } = await workspace({
      ...selection,
      business: selection.business.map((entry) => ({
        ...entry,
        scopeTitles: { contracts: 'Contracts by table' },
        actionScopeTitles: {
          approve: { contracts: 'Legacy table label', records: 'By slot' },
        },
      })),
    });
    expect(
      objectOf(ws, 'Contracts')!
        .actions.find((action) => action.id === contract('approve'))
        ?.scopes?.map((slot) => slot.label),
    ).toEqual(['By slot', 'Departments']);
  });
});
