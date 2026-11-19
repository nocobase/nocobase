import { answerApi } from '@nocobase/app-testing/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import {
  defineAppRoutes,
  defineClientPlugin,
} from '@nocobase/app-client/plugins';
import {
  AuthorizationClient,
  authorizationClientToken,
  type PermissionGrant,
  type PermissionSet,
} from '@nocobase/app-plugin-authorization/client';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { expect, it, vi } from 'vitest';
import { renderSettingsClient as renderWithApp } from '../helpers/settings-client.js';
import RolesPage from '../../client/pages/settings/roles.js';
import RoleForm from '../../client/pages/settings/role-form.js';
import systemSettingsRoutes from '../../client/pages/settings/routes.js';
import type { PermissionWorkspaceSelection } from '../../client/pages/settings/permission-workspace.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

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

vi.mock(
  '../../client/pages/settings/permission-workspace.js',
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import('../../client/pages/settings/permission-workspace.js')
      >();
    return {
      ...original,
      permissionWorkspace: (
        ...args: Parameters<typeof original.permissionWorkspace>
      ) =>
        original.permissionWorkspace(
          args[0],
          args[1],
          args[2],
          args[3],
          args[4] ?? selection,
        ),
    };
  },
);

const settingsNamespace = '@nocobase/role-cross-object-test';
const words = enUS.settings;
const editor = words.permissionEditor;
const services = (app: ClientApplication) =>
  app.container.instance(
    authorizationClientToken,
    new AuthorizationClient(app.container.resolve(apiClientToken)),
  );
const namespaces = {
  [settingsNamespace]: {
    'en-US': async () => ({ default: enUS }),
    'zh-CN': async () => ({ default: zhCN }),
  },
};
const plugins = [
  defineClientPlugin({
    packageName: settingsNamespace,
    routes: [
      defineAppRoutes([
        {
          name: 'systemManagement',
          navigation: { title: 'settings.title' },
          children: [
            {
              name: 'settingsHome',
              path: '/settings',
              auth: 'required',
              authz: 'skip',
              componentLoader: async () => ({ default: () => null }),
            },
            {
              name: 'settingsAccount',
              navigation: { title: 'settings.categories.account', order: 10 },
              children: [],
            },
          ],
        },
      ]),
      systemSettingsRoutes,
    ],
  })(),
];
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
      namespace: settingsNamespace,
      namespaces,
      plugins,
      services,
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
  expect(screen.queryByText(words.unsaved)).not.toBeInTheDocument();
  // Only the name changes.
  await user.type(screen.getByRole('textbox', { name: /Role name/ }), ' 2');
  await user.click(
    screen.getByRole('button', { name: words.save, exact: true }),
  );
  await waitFor(() =>
    expect(calls).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'PATCH' }),
    ),
  );
  expect(roles[0]?.title).toBe('Dispatcher 2');
  expect(roles[0]?.grants).toEqual(seeded);
});
