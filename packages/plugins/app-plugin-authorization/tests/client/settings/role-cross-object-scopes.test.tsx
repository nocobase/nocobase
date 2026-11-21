// @vitest-environment jsdom
import { answerApi } from '@nocobase/app-testing/client';
import {
  type PermissionGrant,
  type PermissionSet,
} from '../../../client/index.js';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { expect, it, vi } from 'vitest';
import {
  appNamespaces,
  settingsRoutes,
} from '../../helpers/settings-fixture.js';
import { renderSettingsClient as renderWithApp } from '../../helpers/settings-client.js';
import RolesPage from '../../../client/settings/roles.js';
import RoleForm from '../../../client/settings/role-form.js';
import type { PermissionWorkspaceSelection } from '../../../client/settings/workspace-selection.js';
import enUS from '../../../client/locales/en-US.js';

// A transport application's dispatcher: creating a shipment reads stations, carriers and vehicles and dispatching
// reads drivers, each another object whose View the role does not have.
const selection: PermissionWorkspaceSelection = {
  business: [
    {
      type: 'composite',
      id: 'tms.shipments',
      actions: ['view', 'create', 'dispatch'],
      scopeOrder: ['allRecords', 'myStations', 'activeRecords'],
    },
    ...['stations', 'carriers', 'vehicles', 'drivers'].map((id) => ({
      type: 'composite',
      id: `tms.${id}`,
      actions: ['view'],
      scopeOrder: ['allRecords', 'myStations', 'activeRecords'],
    })),
  ],
};

const words = enUS.settings;
const editor = words.permissionEditor;
const namespaces = appNamespaces;
const routes = settingsRoutes;
const scope = (key: string, collection: string) => ({
  key,
  collection,
  title: key,
  fields: ['stationId'],
  recordAccess: ['allRecords', 'myStations', 'activeRecords'],
  defaultValue: '',
});
const object = (id: string, title: string) => ({
  type: 'composite',
  id: `tms.${id}`,
  title,
  actions: [{ name: 'view', title: 'View' }],
  dataScopes: { view: [scope('records', id)] },
});
const options = {
  sections: [
    {
      name: 'business',
      title: 'Business operations',
      order: 100,
      subsections: [
        {
          name: 'transport',
          title: 'Transport',
          resources: [
            {
              type: 'composite',
              id: 'tms.shipments',
              title: 'Shipments',
              actions: [
                { name: 'view', title: 'View' },
                { name: 'create', title: 'Create' },
                { name: 'dispatch', title: 'Dispatch' },
              ],
              dataScopes: {
                view: [scope('records', 'shipments')],
                create: [
                  scope('stations', 'stations'),
                  scope('carriers', 'carriers'),
                  scope('vehicles', 'vehicles'),
                ],
                dispatch: [
                  scope('records', 'shipments'),
                  scope('drivers', 'drivers'),
                ],
              },
            },
            object('stations', 'Stations'),
            object('carriers', 'Carriers'),
            object('vehicles', 'Vehicles'),
            object('drivers', 'Drivers'),
          ],
        },
      ],
    },
  ],
  recordAccess: [
    { key: 'allRecords', title: 'All records' },
    { key: 'myStations', title: 'My stations' },
    { key: 'activeRecords', title: 'Active records' },
  ],
  subjectTypes: [],
  collections: [
    { name: 'shipments', title: 'Shipments', fields: ['stationId'] },
    { name: 'stations', title: 'Stations', fields: ['stationId'] },
    { name: 'carriers', title: 'Carriers', fields: ['stationId'] },
    { name: 'vehicles', title: 'Vehicles', fields: ['stationId'] },
    { name: 'drivers', title: 'Drivers', fields: ['stationId'] },
  ],
};
// As a seed stores it: the four scopes on other objects are set while none of their Views is.
const seeded: readonly PermissionGrant[] = [
  {
    resource: { type: 'composite', id: 'tms.shipments' },
    actions: [
      {
        action: 'view',
        policy: { type: 'composite', scopes: { records: 'myStations' } },
      },
      {
        action: 'create',
        policy: {
          type: 'composite',
          scopes: {
            stations: 'myStations',
            carriers: 'activeRecords',
            vehicles: 'activeRecords',
          },
        },
      },
      {
        action: 'dispatch',
        policy: {
          type: 'composite',
          scopes: { records: 'myStations', drivers: 'activeRecords' },
        },
      },
    ],
  },
];

function api(roles: PermissionSet[]) {
  return vi.fn(
    ({
      path,
      method,
      json,
    }: {
      path: string;
      method: string;
      json?: { title?: string; grants?: readonly PermissionGrant[] };
    }) => {
      if (path === 'authorization/permissions')
        return { data: { unrestricted: true, permissions: [] } };
      if (path === 'authorization/permissionSets/options')
        return { data: options };
      if (path === 'authorization/permissionSets') return { data: roles };
      const key = decodeURIComponent(path.split('/').at(-1) ?? '');
      const index = roles.findIndex((role) => role.key === key);
      if (index === -1) return new Response(null, { status: 404 });
      if (method === 'PATCH' && json)
        roles[index] = {
          ...roles[index]!,
          ...(json.title ? { title: json.title } : {}),
          ...(json.grants ? { grants: json.grants } : {}),
        };
      return { data: roles[index] };
    },
  );
}

it('shows and keeps the scopes a dispatcher has on objects it cannot view when only its name changes', async () => {
  const user = userEvent.setup();
  const roles = [
    {
      key: 'dispatcher',
      title: 'Dispatcher',
      grants: structuredClone(seeded),
      revision: 'one',
    },
  ] as PermissionSet[];
  const calls = api(roles);
  await renderWithApp(
    <Routes>
      <Route path='/settings/roles' element={<RolesPage />}>
        <Route path=':key/edit' element={<RoleForm />} />
      </Route>
    </Routes>,
    {
      route: '/settings/roles/dispatcher/edit',
      namespaces,
      routes,
      authorization: { workspace: selection },
      fetch: answerApi(calls),
    },
  );
  await user.click(
    await screen.findByRole('tab', { name: new RegExp(editor.objectsTab) }),
  );
  const list = screen.getByRole('navigation', { name: editor.objects });
  await user.click(within(list).getByRole('button', { name: /^Shipments/ }));
  // Each scope shows what is stored, read-only, beside what it needs.
  for (const [label, shown, needs] of [
    ['Create: Stations', 'My stations', 'Stations'],
    ['Create: Carriers', 'Active records', 'Carriers'],
    ['Create: Vehicles', 'Active records', 'Vehicles'],
    ['Dispatch: Drivers', 'Active records', 'Drivers'],
  ] as const) {
    const select = screen.getByRole('combobox', { name: label });
    expect(select).toHaveTextContent(shown);
    expect(select).toBeDisabled();
    expect(
      screen.getByText(editor.needsView.replace('{{object}}', needs)),
    ).toBeVisible();
  }
  expect(screen.queryByText(/unsaved change/)).not.toBeInTheDocument();
  // Only the name changes.
  await user.click(screen.getByRole('button', { name: words.rename }));
  await user.type(screen.getByRole('textbox', { name: /Role name/ }), ' 2');
  await user.click(
    within(screen.getByRole('dialog', { name: words.renameTitle })).getByRole(
      'button',
      { name: words.rename },
    ),
  );
  await user.click(
    screen.getByRole('button', { name: words.reviewAndSave, exact: true }),
  );
  await user.click(
    await screen.findByRole('button', { name: words.review.confirm }),
  );
  await waitFor(() =>
    expect(calls).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'PATCH' }),
    ),
  );
  expect(roles[0]?.title).toBe('Dispatcher 2');
  expect(roles[0]?.grants).toEqual(seeded);
});

it('keeps a role’s own custom filters when View’s stored condition is applied again, and reads locked ones', async () => {
  const user = userEvent.setup();
  const filterOptions = structuredClone(options);
  filterOptions.recordAccess.push({
    key: 'customFilter',
    title: 'Custom filter',
  });
  for (const resource of filterOptions.sections[0]!.subsections[0]!.resources)
    for (const scopes of Object.values(resource.dataScopes))
      for (const item of scopes) item.recordAccess.push('customFilter');
  // Stored by the API as single conditions, with keys in their own order, not as the groups the form writes.
  const below = (amount: number) => ({
    type: 'recordAccess',
    key: 'customFilter',
    params: {
      filter: {
        value: amount,
        operator: '$lt',
        path: ['stationId'],
        kind: 'condition',
      },
    },
  });
  const stored: readonly PermissionGrant[] = [
    {
      resource: { type: 'composite', id: 'tms.shipments' },
      actions: [
        {
          action: 'view',
          policy: { type: 'composite', scopes: { records: below(100) } },
        },
        {
          action: 'create',
          policy: {
            type: 'composite',
            scopes: {
              stations: below(20),
              carriers: 'activeRecords',
              vehicles: 'activeRecords',
            },
          },
        },
        {
          action: 'dispatch',
          policy: {
            type: 'composite',
            scopes: { records: below(50), drivers: 'activeRecords' },
          },
        },
      ],
    },
  ];
  const roles = [
    {
      key: 'pricing',
      title: 'Pricing',
      grants: structuredClone(stored),
      revision: 'one',
    },
  ] as PermissionSet[];
  const base = api(roles);
  const calls = vi.fn((request: Parameters<typeof base>[0]) =>
    request.path === 'authorization/permissionSets/options'
      ? { data: filterOptions }
      : base(request),
  );
  await renderWithApp(
    <Routes>
      <Route path='/settings/roles' element={<RolesPage />}>
        <Route path=':key/edit' element={<RoleForm />} />
      </Route>
    </Routes>,
    {
      route: '/settings/roles/pricing/edit',
      namespaces,
      routes,
      authorization: { workspace: selection },
      fetch: answerApi(calls),
    },
  );
  await user.click(
    await screen.findByRole('tab', { name: new RegExp(editor.objectsTab) }),
  );
  const list = screen.getByRole('navigation', { name: editor.objects });
  await user.click(within(list).getByRole('button', { name: /^Shipments/ }));
  // Every filter reads its conditions; the locked one on Stations names its scope rather than its key.
  for (const amount of [100, 50, 20])
    expect(screen.getByText(new RegExp(`Less than ${amount}$`))).toBeVisible();
  const stations = screen.getByRole('combobox', { name: 'Create: Stations' });
  expect(stations).toHaveTextContent('Custom filter');
  expect(stations).toBeDisabled();
  // Only View's filter can be opened. Applying its stored condition as it stands changes nothing and says nothing.
  const open = screen
    .getAllByRole('button', { name: words.permissionFilter.configure })
    .filter((button) => !(button as HTMLButtonElement).disabled);
  expect(open).toHaveLength(1);
  await user.click(open[0]!);
  await user.click(
    await screen.findByRole('button', { name: words.permissionFilter.apply }),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: words.permissionFilter.apply }),
    ).not.toBeInTheDocument(),
  );
  expect(
    screen.queryByText(/now follows the view scope/),
  ).not.toBeInTheDocument();
  expect(screen.queryByText(/unsaved change/)).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: words.rename }));
  await user.type(screen.getByRole('textbox', { name: /Role name/ }), ' 2');
  await user.click(
    within(screen.getByRole('dialog', { name: words.renameTitle })).getByRole(
      'button',
      { name: words.rename },
    ),
  );
  await user.click(
    screen.getByRole('button', { name: words.reviewAndSave, exact: true }),
  );
  await user.click(
    await screen.findByRole('button', { name: words.review.confirm }),
  );
  await waitFor(() => expect(roles[0]?.title).toBe('Pricing 2'));
  expect(roles[0]?.grants).toEqual(stored);
});
