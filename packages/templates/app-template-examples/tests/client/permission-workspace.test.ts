import { describe, expect, it } from 'vitest';
import { defineAppRoutes } from '@nocobase/app-client/plugins';
import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-client/runtime';
import type {
  AuthorizationOptionsResponse,
  LocalizedText,
  PermissionGrant,
} from '@nocobase/app-plugin-authorization/client';
import { CAPABILITY_GUIDE_ACCESS } from '@nocobase/app-plugin-foundation/client';
import appRuntime from '../../client/runtime.js';
import applicationRoutes from '../../client/routes.js';
import {
  permissionWorkspace,
  type PermissionWorkspaceSelection,
} from '../../client/pages/settings/permission-workspace.js';
import {
  CUSTOM_FILTER,
  NO_SCOPE,
  draftFromGrants,
  filterKey,
  grantsFromDraft,
  permissionRowId,
  sameGrants,
  unconfiguredFilter,
} from '../../client/pages/settings/permissions-model.js';
import {
  applyQuickSet,
  menusUsing,
  dependentsOf,
  narrowerOptions,
  setActionEnabled,
  setMenuChecked,
  setScopeValue,
  type PermissionGrants,
  type PermissionValue,
} from '../../client/components/permission-editor-model.js';
import enUS from '../../client/locales/en-US.js';

const lookup = (key: string): unknown =>
  key
    .split('.')
    .reduce<unknown>(
      (value, part) =>
        value && typeof value === 'object'
          ? Reflect.get(value, part)
          : undefined,
      enUS,
    );
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
              id: 'authorization.permission-sets',
              title: 'Permission sets',
              actions: [
                { name: 'read', title: 'Read' },
                { name: 'update', title: 'Update' },
              ],
            },
            {
              type: 'settings',
              id: 'authorization.inspector',
              title: 'Permission check',
              actions: [{ name: 'inspect', title: 'Inspect' }],
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
          resource: { type: 'page', id: 'fixture-contracts' },
          action: 'access',
        },
        navigation: { title: 'Fixture contracts' },
        componentLoader: async () => ({ default: () => null }),
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
  const { routes } = await resolveAppRuntime(
    defineAppRuntime({
      ...appRuntime,
      routes: () => [...applicationRoutes, business],
    }),
  );
  return {
    workspace: permissionWorkspace(source, routes, {}, words, chosen),
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
    expect(ws.menuPages.get(contracts.id)).toEqual(['fixture-contracts']);
    expect(menuOf(ws, 'Fixture help')).toMatchObject({ public: true });
    // One object, used by two menus.
    expect(
      menusUsing(ws.menus, 'composite:contracts').map((menu) => menu.label),
    ).toEqual(['Fixture contracts', 'Fixture reports']);
  });

  it('lists system settings with their real actions and the escalation notice', async () => {
    const { workspace: ws } = await workspace();
    const settings = ws.menus.at(-1)!;
    expect(settings.label).toBe(enUS.settings.title);
    const roles = leaves(settings.children ?? []).find(
      ({ menu }) => menu.label === enUS.settings.permissionManagement,
    )!.menu;
    const sets = ws.objects.find(
      (object) => object.id === 'settings:authorization.permission-sets',
    )!;
    // Checking the whole System settings group, sensitive entries included, and clearing it again never changes
    // what the role may do with an object: entries opened by an action stay as they are.
    const grants: PermissionGrants = {
      [permissionRowId(
        { type: 'settings', id: 'authorization.permission-sets' },
        'update',
      )]: {},
    };
    const all = setMenuChecked(
      ws.menus,
      { menus: [], grants },
      settings.id,
      true,
    );
    expect(all.grants).toBe(grants);
    expect(all.menus).not.toContain(roles.id);
    const none = setMenuChecked(ws.menus, all, settings.id, false);
    expect(none).toEqual({ menus: [], grants });
    expect(
      grantsFromDraft(all, {}, [], ws).filter(
        (grant) => grant.resource.type !== 'page',
      ),
    ).toEqual(grantsFromDraft(none, {}, [], ws));
    // A settings page guarded by an action opens with it.
    expect(roles.opensWith).toBe(
      permissionRowId(
        { type: 'settings', id: 'authorization.permission-sets' },
        'read',
      ),
    );
    expect(roles.uses?.primary).toContain(sets.id);
    expect(sets.group).toBe(enUS.settings.title);
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
    const users = ws.objects.find((object) => object.id === 'user:*')!;
    expect(users.actions[0]).toMatchObject({
      label: enUS.settings.readUsers,
      view: true,
    });
    expect(
      users.actions.find((action) => action.label === enUS.settings.assignRole),
    ).toMatchObject({ risk: 'high' });
    // Settings pages are not business menus.
    expect(
      leaves(ws.menus.slice(0, -1)).some(
        ({ menu }) => menu.label === enUS.settings.users,
      ),
    ).toBe(false);
    // Features and extensions is one page, under System settings.
    const guide = leaves(ws.menus).filter(({ menu }) =>
      ws.menuPages.get(menu.id)?.includes(CAPABILITY_GUIDE_ACCESS.resource.id),
    );
    expect(guide.map(({ path }) => path[0])).toEqual([enUS.settings.title]);
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
        resource: { type: 'page', id: 'fixture-contracts' },
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
    const page = { type: 'page', id: 'fixture-contracts' };
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
    // The same holds for an explicit signer scope stored while the contacts View is off: it is read, saved and
    // reloaded as no records, never kept as All records.
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
      signers: NO_SCOPE,
    });
    const signersOf = (grants: readonly PermissionGrant[]) =>
      grants
        .find((grant) => grant.resource.id === 'contracts')
        ?.actions.find((entry) => entry.action === 'sign')?.policy?.scopes
        ?.signers;
    const saved = grantsFromDraft(read.draft, read.filters, existing, ws);
    expect(signersOf(saved)).toBe('');
    expect(draftFromGrants(saved, ws).draft.grants[contract('sign')]).toEqual({
      scopes: { signers: NO_SCOPE },
    });
    // A draft that still holds an explicit value is saved as no records too.
    expect(
      signersOf(
        grantsFromDraft(
          value({
            [contract('view')]: {},
            [contract('sign')]: { scopes: { signers: 'allRecords' } },
          }),
          {},
          existing,
          ws,
        ),
      ),
    ).toBe('');
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
        resource: { type: 'page', id: 'fixture-contracts' },
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

  it('leaves checking other users’ permissions out of Enable all', async () => {
    const { workspace: ws } = await workspace();
    const inspect = permissionRowId(
      { type: 'settings', id: 'authorization.inspector' },
      'inspect',
    );
    const object = ws.objects.find((item) =>
      item.actions.some((action) => action.id === inspect),
    )!;
    expect(
      object.actions.find((action) => action.id === inspect),
    ).toMatchObject({
      risk: 'sensitive',
    });
    const { grants } = applyQuickSet(ws.objects, {}, object, 'all');
    expect(grants[inspect]).toBeUndefined();
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
});

describe('example permission selection', () => {
  it('shows customers, contacts and sales reps as three objects the Customers and contacts page uses', async () => {
    const crm = (id: string, title: string) => ({
      type: 'composite',
      id,
      title,
      actions: [
        { name: 'view', title: 'View' },
        { name: 'edit', title: 'Edit' },
      ],
      dataScopes: {
        view: [scope('records', id)],
        edit: [scope('records', id)],
      },
    });
    const catalog = {
      ...source,
      sections: [
        {
          name: 'crm',
          title: 'CRM',
          order: 0,
          subsections: [
            {
              name: 'crm',
              title: 'Customers',
              resources: [
                crm('example.crm.customers', 'Customers'),
                crm('example.crm.contacts', 'Contacts'),
                crm('example.crm.salesReps', 'Sales reps'),
              ],
            },
          ],
        },
      ],
    } as unknown as AuthorizationOptionsResponse;
    const { routes } = await resolveAppRuntime(
      defineAppRuntime({ ...appRuntime, routes: () => [...applicationRoutes] }),
    );
    const ws = permissionWorkspace(catalog, routes, {}, words);
    expect(
      ws.objects
        .filter((object) => object.group === 'Customers')
        .map((object) => object.label),
    ).toEqual(['Customers', 'Contacts', 'Sales reps']);
    const page = leaves(ws.menus).find(({ menu }) =>
      ws.menuPages.get(menu.id)?.includes('customer-contacts'),
    )?.menu;
    expect(page?.uses).toEqual({
      primary: ['composite:example.crm.customers'],
      related: [
        'composite:example.crm.contacts',
        'composite:example.crm.salesReps',
      ],
    });
  });
});
