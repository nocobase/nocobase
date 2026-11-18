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
import { createApplicationRoutes } from '../../client/routes.js';
import settingsRoutes from '../../client/pages/settings/routes.js';
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
              ],
              dataScopes: {
                view: [scope('records', 'contracts', 'own')],
                update: [scope('records', 'contracts')],
                approve: [
                  scope('records', 'contracts'),
                  scope('departments', 'departments'),
                ],
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
  collections: [],
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
      menu: 'fixtureContracts',
      actions: ['view', 'update', 'approve', 'refund'],
      risks: { refund: 'high' },
      scopeOrder: ['allRecords', 'department', 'own'],
    },
  ],
};

async function workspace() {
  const { routes } = await resolveAppRuntime(
    defineAppRuntime({
      ...appRuntime,
      routes: () => [...createApplicationRoutes(), settingsRoutes, business],
    }),
  );
  return {
    workspace: permissionWorkspace(source, routes, {}, words, selection),
  };
}

const contract = (action: string) =>
  permissionRowId({ type: 'composite', id: 'contracts' }, action);
const menuOf = (
  ws: Awaited<ReturnType<typeof workspace>>['workspace'],
  label: string,
) =>
  ws.modules
    .flatMap((module) => module.menus)
    .find((menu) => menu.label === label);

describe('role permission workspace', () => {
  it('puts business operations on their menu with View first and the other scopes following it', async () => {
    const { workspace: ws } = await workspace();
    const sales = ws.modules.find((module) => module.label === 'Fixture sales');
    expect(sales?.menus.map((menu) => menu.label)).toEqual([
      'Fixture contracts',
      'Fixture reports',
      'Fixture help',
    ]);
    const contracts = menuOf(ws, 'Fixture contracts')!;
    expect(contracts.actions.map((action) => action.label)).toEqual([
      'View',
      'Edit',
      'Approve',
      'Refund',
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
    expect(ws.menuPages.get(contracts.id)).toEqual(['fixture-contracts']);
    // A menu without business operations is opened through its page; a public menu needs nothing.
    expect(menuOf(ws, 'Fixture reports')?.actions).toEqual([
      {
        id: permissionRowId({ type: 'page', id: 'fixture-reports' }, 'access'),
        label: 'Open page',
        view: true,
      },
    ]);
    expect(menuOf(ws, 'Fixture help')).toMatchObject({
      public: true,
      actions: [],
    });
  });

  it('lists system settings under Administration with their real actions and the escalation notice', async () => {
    const { workspace: ws } = await workspace();
    const administration = ws.modules.at(-1)!;
    expect(administration.administration).toBe(true);
    const roles = administration.menus.find(
      (menu) => menu.label === enUS.settings.permissionManagement,
    )!;
    const update = roles.actions.find(
      (action) =>
        action.id ===
        permissionRowId(
          { type: 'settings', id: 'authorization.permission-sets' },
          'update',
        ),
    );
    expect(update).toMatchObject({ risk: 'high' });
    expect(roles.notice).toBe(enUS.settings.escalation.roles);
    const users = administration.menus.find(
      (menu) => menu.label === enUS.settings.users,
    )!;
    expect(users.actions[0]).toMatchObject({
      label: enUS.settings.readUsers,
      view: true,
    });
    expect(
      users.actions.find((action) => action.label === enUS.settings.assignRole),
    ).toMatchObject({ risk: 'high' });
    // Settings pages are not business menus.
    expect(
      ws.modules
        .filter((module) => !module.administration)
        .flatMap((module) => module.menus)
        .some((menu) => menu.label === enUS.settings.users),
    ).toBe(false);
    // Features and extensions is one control, in Administration.
    const guide = permissionRowId(CAPABILITY_GUIDE_ACCESS.resource, 'access');
    expect(
      ws.modules.flatMap((module) =>
        module.menus.flatMap((menu) =>
          menu.actions
            .filter((action) => action.id === guide)
            .map(() => module.administration),
        ),
      ),
    ).toEqual([true]);
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
      [contract('view')]: { scopes: { records: 'department' } },
      [contract('update')]: {},
      [contract('approve')]: {
        scopes: { records: 'own', departments: '__preserved__' },
      },
    });
    expect(
      sameGrants(grantsFromDraft(draft, filters, original, ws), original),
    ).toBe(true);

    // Narrowing View narrows its followers with it.
    const narrowed = grantsFromDraft(
      { ...draft, [contract('view')]: { scopes: { records: 'own' } } },
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

  it('opens a menu exactly when any of its actions is on', async () => {
    const { workspace: ws } = await workspace();
    const page = { type: 'page', id: 'fixture-contracts' };
    const opened = grantsFromDraft({ [contract('update')]: {} }, {}, [], ws);
    expect(opened).toContainEqual({
      resource: page,
      actions: [{ action: 'access' }],
    });
    expect(
      opened.find(
        (grant) =>
          grant.resource.id === 'contracts' &&
          grant.resource.type === 'composite',
      )?.actions,
    ).toEqual([
      // Edit follows View's default when View is off.
      {
        action: 'update',
        policy: { type: 'composite', scopes: { records: '' } },
      },
    ]);
    const closed = grantsFromDraft(
      {},
      {},
      [{ resource: page, actions: [{ action: 'access' }] }],
      ws,
    );
    expect(closed).toEqual([]);
  });

  it('asks for custom filter conditions before saving and stores them with the scope', async () => {
    const { workspace: ws } = await workspace();
    const draft = {
      [contract('view')]: { scopes: { records: CUSTOM_FILTER } },
    };
    expect(unconfiguredFilter(draft, {}, ws)).toEqual({
      action: contract('view'),
      scope: 'records',
    });
    const filter = { status: { $eq: 'signed' } };
    const filters = { [filterKey(contract('view'), 'records')]: filter };
    expect(unconfiguredFilter(draft, filters, ws)).toBeUndefined();
    const grants = grantsFromDraft(draft, filters, [], ws);
    expect(
      grants.find((grant) => grant.resource.type === 'composite')?.actions,
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
    expect(draftFromGrants(grants, ws)).toEqual({ draft, filters });
  });
});
