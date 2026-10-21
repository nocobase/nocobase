import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { expect, it } from 'vitest';
import RolesPage from '../../client/pages/settings/roles.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
const settingsNamespace = '@nocobase/compact-role-test';
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

it('keeps the standard role table sorted, searchable and linked to the current query', async () => {
  const user = userEvent.setup();
  await renderWithApp(
    <Routes>
      <Route path='/settings/roles' element={<RolesPage />} />
    </Routes>,
    {
      route: '/settings/roles',
      namespace: settingsNamespace,
      namespaces,
      services,
      fetch: answerApi(({ path }) =>
        path === 'authorization/permissions'
          ? { data: { unrestricted: false, permissions: [] } }
          : {
              data: [
                { key: 'team', title: 'NocoBase team', grants: [] },
                { key: 'cp-customer', title: 'Customer', grants: [] },
                {
                  key: 'member',
                  title: 'Member',
                  grants: [],
                  protection: { allow: ['update'] },
                },
              ],
            },
      ),
    },
  );
  await screen.findByTitle('Customer');
  const region = screen.getByRole('region', {
    name: 'Roles and permissions',
  });
  const table = within(region).getByRole('table');
  expect(within(table).getAllByRole('columnheader')).toHaveLength(3);
  expect(
    within(table)
      .getAllByRole('link')
      .map((link) => link.textContent),
  ).toEqual(['Customer', 'Member', 'NocoBase team']);
  expect(
    screen.queryByRole('heading', { name: 'Customer' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'New role' }),
  ).not.toBeInTheDocument();
  await user.type(
    screen.getByRole('textbox', { name: 'Search role names' }),
    'Customer',
  );
  await waitFor(() => {
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    expect(within(table).getAllByRole('link')).toHaveLength(1);
  });
  expect(screen.getByTitle('Customer').closest('a')).toHaveAttribute(
    'href',
    '/settings/roles/cp-customer/edit?q=Customer',
  );
});
