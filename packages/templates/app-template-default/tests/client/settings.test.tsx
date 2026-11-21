import { renderSettingsClient as renderWithApp } from '../helpers/settings-client.js';
import { answerApi } from '@nocobase/app-testing/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import {
  defineAppRoutes,
  defineClientPlugin,
} from '@nocobase/app-client/plugins';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import RoleForm from '../../client/pages/settings/role-form.js';
import RolesPage from '../../client/pages/settings/roles.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
const settingsNamespace = '@nocobase/settings-test';
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

describe('template system settings', () => {
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
        namespace: settingsNamespace,
        namespaces,
        services,
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
    const calls = vi.fn(
      ({ path, method }: { path: string; method: string }) => {
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
        if (path === 'authorization/permissionSets')
          return {
            data: [
              {
                key: 'sales',
                title: 'Sales',
                grants: [],
                revision: 'version-1',
              },
            ],
          };
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
        return {
          data: {
            key: 'sales',
            title: 'Sales',
            grants: [],
            revision: 'version-1',
          },
        };
      },
    );
    await renderWithApp(
      <Routes>
        <Route path='/settings/roles' element={<RolesPage />}>
          <Route path=':key/edit' element={<RoleForm />} />
        </Route>
      </Routes>,
      {
        route: '/settings/roles/sales/edit',
        plugins: [
          defineClientPlugin({
            packageName: settingsNamespace,
            routes: defineAppRoutes([
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
          })(),
        ],
        namespace: settingsNamespace,
        namespaces,
        services,
        fetch: answerApi(calls),
      },
    );
    const toggle = await screen.findByRole('checkbox', {
      name: enUS.navigation.home,
    });
    await waitFor(() =>
      expect(toggle).not.toHaveAttribute('aria-disabled', 'true'),
    );
    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
    expect(await screen.findByText(enUS.settings.conflict)).toBeVisible();
    expect(
      screen.getByRole('checkbox', { name: enUS.navigation.home }),
    ).toBeChecked();
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
});
