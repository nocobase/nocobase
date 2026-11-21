// @vitest-environment jsdom
import { renderSettingsClient as renderWithApp } from '../../helpers/settings-client.js';
import { answerApi } from '@nocobase/app-testing/client';
import { type PermissionGrant } from '../../../client/index.js';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import {
  appNamespaces,
  appWords,
  settingsRoutes,
} from '../../helpers/settings-fixture.js';
import RoleForm from '../../../client/settings/role-form.js';
import RolesPage from '../../../client/settings/roles.js';
import enUS from '../../../client/locales/en-US.js';
import zhCN from '../../../client/locales/zh-CN.js';

const namespaces = appNamespaces;

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
            namespaces,
            locale,
            routes: settingsRoutes,
            fetch: answerApi(calls),
          },
        );
      // User management is a settings page, set on the System settings tab.
      const openUsers = async () => {
        await user.click(
          await screen.findByRole('tab', {
            name: new RegExp(words.permissionEditor.settingsTab),
          }),
        );
        await screen.findByRole('heading', {
          name: appWords[locale].settings.users,
        });
      };
      const first = await mount();
      await openUsers();
      const labels = [
        words.createUsers,
        words.updateUsers,
        words.revokeSessions,
      ];
      for (const label of labels) {
        const toggle = await screen.findByRole('switch', { name: label });
        await waitFor(() => expect(toggle).not.toBeDisabled());
        expect(toggle).not.toBeChecked();
        await user.click(toggle);
      }
      // The Users pages implement exactly these operations; changing a user's roles is marked high risk.
      const permissionNames = [
        words.readUsers,
        words.createUsers,
        words.updateUsers,
        words.disable,
        words.enable,
        words.revokeSessions,
        words.assignRole,
      ];
      for (const name of permissionNames)
        expect(screen.getByRole('switch', { name })).toBeVisible();
      expect(
        // Inviting is not an operation the Users pages implement, so it is never offered.
        screen.queryByRole('switch', {
          name: locale === 'zh-CN' ? '邀请用户' : 'Invite users',
        }),
      ).not.toBeInTheDocument();
      expect(screen.getByText(words.escalation.users)).toBeVisible();
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
      await openUsers();
      for (const label of labels)
        expect(
          await screen.findByRole('switch', { name: label }),
        ).toBeChecked();
      await user.click(screen.getByRole('switch', { name: words.updateUsers }));
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
