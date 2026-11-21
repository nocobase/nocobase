// @vitest-environment jsdom
import { answerApi } from '@nocobase/app-testing/client';
import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { renderSettingsClient as renderWithApp } from '../../helpers/settings-client.js';
import { appNamespaces, appWords } from '../../helpers/settings-fixture.js';
import RoleForm from '../../../client/settings/role-form.js';
import RolesPage from '../../../client/settings/roles.js';
import enUS from '../../../client/locales/en-US.js';
import zhCN from '../../../client/locales/zh-CN.js';

const list = (
  <Routes>
    <Route path='/settings/roles' element={<RolesPage />} />
  </Routes>
);

describe.each([
  ['en-US', enUS],
  ['zh-CN', zhCN],
] as const)('%s', (language, copy) => {
  it('keeps the compact empty status and hides creation for a read-only role list', async () => {
    await renderWithApp(list, {
      route: '/settings/roles',
      locale: language,
      namespaces: appNamespaces,
      fetch: answerApi(({ path }) => {
        if (path === 'authorization/permissions')
          return { data: { unrestricted: false, permissions: [] } };
        return { data: [], meta: { total: 0 } };
      }),
    });
    expect((await screen.findByRole('status')).textContent).toBe(
      copy.listFeedback.empty,
    );
    expect(
      screen.queryByRole('button', { name: copy.settings.newRole }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(copy.listFeedback.noResults),
    ).not.toBeInTheDocument();
  });

  it('keeps a single creation entry for an authorized empty role list', async () => {
    await renderWithApp(list, {
      route: '/settings/roles',
      locale: language,
      namespaces: appNamespaces,
      fetch: answerApi(({ path }) => {
        if (path === 'authorization/permissions')
          return { data: { unrestricted: true, permissions: [] } };
        return { data: [], meta: { total: 0 } };
      }),
    });
    expect(
      await screen.findByRole('button', { name: copy.settings.newRole }),
    ).toHaveAttribute('href', '/settings/roles/create');
    expect(
      screen.getAllByRole('button', { name: copy.settings.newRole }),
    ).toHaveLength(1);
    expect(screen.getByRole('status').textContent).toBe(
      copy.listFeedback.empty,
    );
  });
});

it('shows failed role options with retry and prevents incomplete saves', async () => {
  const calls = vi.fn(({ path }: { path: string }) => {
    if (path === 'authorization/permissions')
      return { data: { unrestricted: true, permissions: [] } };
    if (path.endsWith('/options'))
      return Response.json(
        { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unavailable' } },
        { status: 500 },
      );
    return { data: [{ key: 'sales', title: 'Sales', grants: [] }] };
  });
  await renderWithApp(
    <Routes>
      <Route path='/settings/roles' element={<RolesPage />}>
        <Route path='create' element={<RoleForm />} />
      </Route>
    </Routes>,
    {
      route: '/settings/roles/create',
      namespaces: appNamespaces,
      fetch: answerApi(calls),
    },
  );
  expect((await screen.findAllByText(enUS.settings.failed))[0]).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Save', exact: true }),
  ).not.toBeInTheDocument();
  expect(
    screen.getAllByRole('button', { name: 'Retry' }).length,
  ).toBeGreaterThan(0);
  expect(
    calls.mock.calls.some(([call]) => Reflect.get(call, 'method') === 'POST'),
  ).toBe(false);
});

it('preserves the role draft on a conditional save conflict and submits the original revision', async () => {
  const user = userEvent.setup();
  const role = {
    key: 'sales',
    title: 'Sales',
    grants: [],
    revision: 'version-1',
  };
  const calls = vi.fn(({ path, method }: { path: string; method: string }) => {
    if (path === 'authorization/permissions')
      return { data: { unrestricted: true, permissions: [] } };
    if (path.endsWith('/options'))
      return {
        data: {
          sections: [
            {
              name: 'administration',
              title: 'Business operations',
              order: 0,
              subsections: [
                {
                  name: 'settings',
                  title: 'Settings',
                  resources: [
                    {
                      type: 'settings',
                      id: 'authorization.permission-sets',
                      title: 'Roles',
                      actions: [{ name: 'read', title: 'Read roles' }],
                    },
                  ],
                },
              ],
            },
          ],
          recordAccess: [],
          subjectTypes: [],
          collections: [],
        },
      };
    if (path === 'authorization/permissionSets') return { data: [role] };
    if (method === 'PATCH')
      return Response.json(
        {
          error: {
            code: 'ALREADY_EXISTS',
            message: 'Conflict',
            reason: 'PERMISSION_SET_CONFLICT',
          },
        },
        { status: 409 },
      );
    return { data: role };
  });
  await renderWithApp(
    <Routes>
      <Route path='/settings/roles' element={<RolesPage />}>
        <Route path=':key/edit' element={<RoleForm />} />
      </Route>
    </Routes>,
    {
      route: '/settings/roles/sales/edit',
      routes: [
        defineAppRoutes([
          {
            name: 'contracts',
            path: '/contracts',
            navigation: { title: 'navigation.home' },
            componentLoader: async () => ({ default: () => null }),
            authz: {
              resource: { type: 'page', id: 'contracts' },
              action: 'access',
            },
          },
        ]),
      ],
      namespaces: appNamespaces,
      fetch: answerApi(calls),
    },
  );
  const home = appWords['en-US'].navigation.home;
  const toggle = await screen.findByRole('checkbox', { name: home });
  await waitFor(() =>
    expect(toggle).not.toHaveAttribute('aria-disabled', 'true'),
  );
  await user.click(toggle);
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
  expect(await screen.findByText(enUS.settings.conflict)).toBeVisible();
  expect(screen.getByRole('checkbox', { name: home })).toBeChecked();
  expect(calls).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'PATCH',
      json: expect.objectContaining({
        expectedRevision: 'version-1',
        grants: [
          {
            resource: { type: 'page', id: 'contracts' },
            actions: [{ action: 'access' }],
          },
        ],
      }),
    }),
  );
});
