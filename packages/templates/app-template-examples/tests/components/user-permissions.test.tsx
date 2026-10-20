import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
  type PermissionGrant,
} from '@nocobase/app-plugin-authorization/client';
import { screen, waitFor } from '@testing-library/react';
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
            actions: [{ action: 'read' }, { action: 'disable' }],
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
        words.inviteUsers,
        words.deleteUsers,
        words.resetUserPassword,
      ];
      for (const label of labels) {
        const checkbox = await screen.findByRole('checkbox', { name: label });
        await waitFor(() =>
          expect(checkbox).not.toHaveAttribute('aria-disabled', 'true'),
        );
        expect(checkbox).not.toBeChecked();
        await user.click(checkbox);
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
      expect(screen.getAllByRole('checkbox')).toHaveLength(10);
      const rowIds = screen.getAllByRole('checkbox').map((node) => node.id);
      expect(new Set(rowIds).size).toBe(10);
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
      const all = ['read', 'disable', 'invite', 'delete', 'reset-password'];
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
        screen.getByRole('checkbox', { name: words.deleteUsers }),
      );
      await user.click(
        screen.getByRole('button', { name: words.save, exact: true }),
      );
      await waitFor(() =>
        expect(role.grants[0]?.actions.map((action) => action.action)).toEqual(
          all.filter((action) => action !== 'delete'),
        ),
      );
    },
  );
});
