import { renderSettingsClient as renderWithApp } from '../helpers/settings-client.js';
import { answerApi } from '@nocobase/app-testing/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
  type PermissionGrant,
} from '@nocobase/app-plugin-authorization/client';
import {
  defineAppRoutes,
  defineClientPlugin,
} from '@nocobase/app-client/plugins';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import RoleForm from '../../client/pages/settings/role-form.js';
import RolesPage from '../../client/pages/settings/roles.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const namespace = '@nocobase/user-permissions-test';
const namespaces = {
  [namespace]: {
    'en-US': async () => ({ default: enUS }),
    'zh-CN': async () => ({ default: zhCN }),
  },
};

describe('user permission configuration', () => {
  it.each(['en-US', 'zh-CN'] as const)(
    'saves, reloads and revokes the missing actions in %s without replacing existing grants',
    async (locale) => {
      const user = userEvent.setup();
      const words = locale === 'zh-CN' ? zhCN.settings : enUS.settings;
      const role = {
        key: 'operators',
        title: 'Operators',
        revision: 'original',
        grants: [
          {
            resource: { type: 'user', id: '*' },
            actions: [
              { action: 'read' },
              { action: 'disable' },
              { action: 'invite' },
            ],
          },
        ] as readonly PermissionGrant[],
      };
      const calls = vi.fn(
        ({
          path,
          method,
          json,
        }: {
          path: string;
          method: string;
          json?: {
            grants: readonly PermissionGrant[];
            expectedRevision?: string;
          };
        }) => {
          if (path === 'authorization/permissions')
            return { data: { unrestricted: true, permissions: [] } };
          if (path.endsWith('/options'))
            return {
              data: {
                sections: [],
                recordAccess: [],
                subjectTypes: [],
                collections: [],
              },
            };
          if (path === 'authorization/permissionSets') return { data: [role] };
          if (method === 'PATCH' && json) {
            role.grants = json.grants;
            role.revision = 'updated';
          }
          return { data: role };
        },
      );
      const mount = () =>
        renderWithApp(
          <Routes>
            <Route path='/settings/roles' element={<RolesPage />}>
              <Route path=':key/edit' element={<RoleForm />} />
            </Route>
          </Routes>,
          {
            route: '/settings/roles/operators/edit',
            namespace,
            namespaces,
            locale,
            plugins: [
              defineClientPlugin({
                packageName: namespace,
                routes: defineAppRoutes([
                  {
                    name: 'users',
                    path: '/users',
                    authz: {
                      resource: { type: 'user', id: '*' },
                      action: 'read',
                    },
                    componentLoader: async () => ({ default: () => null }),
                  },
                ]),
              })(),
            ],
            services: (app: ClientApplication) =>
              app.container.instance(
                authorizationClientToken,
                new AuthorizationClient(app.container.resolve(apiClientToken)),
              ),
            fetch: answerApi(calls),
          },
        );
      const first = await mount();
      const labels = [
        words.createUsers,
        words.updateUsers,
        words.revokeSessions,
      ];
      for (const label of labels) {
        const toggle = await screen.findByRole('checkbox', { name: label });
        await waitFor(() =>
          expect(toggle).not.toHaveAttribute('aria-disabled', 'true'),
        );
        expect(toggle).not.toBeChecked();
        await user.click(toggle);
      }
      expect(
        screen.getByRole('heading', { name: words.userInformation }),
      ).toBeVisible();
      expect(
        screen.getByRole('heading', { name: words.accountSecurity }),
      ).toBeVisible();
      expect(
        screen.getByRole('heading', { name: words.roleAssignment }),
      ).toBeVisible();
      const permissionNames = [
        words.readUsers,
        words.createUsers,
        words.updateUsers,
        words.disable,
        words.enable,
        words.revokeSessions,
        words.assignRole,
      ];
      const permissionCheckboxes = permissionNames.map((name) =>
        screen.getByRole('checkbox', { name, exact: true }),
      );
      expect(screen.getAllByRole('checkbox')).toHaveLength(
        permissionNames.length,
      );
      expect(
        screen.queryByRole('checkbox', { name: words.inviteUsers }),
      ).not.toBeInTheDocument();
      const rowIds = permissionCheckboxes.map((node) => node.id);
      expect(rowIds).not.toContain('');
      expect(new Set(rowIds).size).toBe(permissionNames.length);
      const status = within(
        screen.getByRole('tablist', { name: words.permissionStatus }),
      );
      expect(status.getAllByRole('tab')).toHaveLength(3);
      expect(
        status.getByRole('tab', { name: words.permissionAll, exact: true }),
      ).toHaveAttribute('aria-selected', 'true');
      for (const name of [words.permissionGranted, words.permissionUngranted])
        expect(status.getByRole('tab', { name, exact: true })).toBeVisible();
      await user.click(
        screen.getByRole('button', { name: words.save, exact: true }),
      );
      await waitFor(() =>
        expect(calls).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'PATCH',
            json: expect.objectContaining({ expectedRevision: 'original' }),
          }),
        ),
      );
      const all = [
        'read',
        'disable',
        'invite',
        'create',
        'update',
        'revoke-sessions',
      ];
      expect(role.grants[0]?.actions.map((action) => action.action)).toEqual(
        all,
      );
      first.unmount();
      await mount();
      for (const label of labels)
        expect(
          await screen.findByRole('checkbox', { name: label }),
        ).toBeChecked();
      await user.click(
        screen.getByRole('checkbox', { name: words.updateUsers }),
      );
      await user.click(
        screen.getByRole('button', { name: words.save, exact: true }),
      );
      await waitFor(() =>
        expect(role.grants[0]?.actions.map((action) => action.action)).toEqual(
          all.filter((action) => action !== 'update'),
        ),
      );
    },
  );
});
