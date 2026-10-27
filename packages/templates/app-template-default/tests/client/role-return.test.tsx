import { renderSettingsClient as renderWithApp } from '../helpers/settings-client.js';
import { answerApi } from '@nocobase/app-testing/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Outlet, Routes, Route, useLocation } from 'react-router';
import { expect, it, vi } from 'vitest';
import RoleForm from '../../client/pages/settings/role-form.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const namespace = '@nocobase/role-return-test';
function Parent() {
  return <Outlet context={{ reload: () => undefined }} />;
}
function Location() {
  const { pathname, search } = useLocation();
  return (
    <output data-testid='location'>
      {pathname}
      {search}
    </output>
  );
}
it.each(
  ['/roles', '/administration/roles'].flatMap((parent) =>
    ['back', 'cancel', 'save'].map((action) => ({ parent, action })),
  ),
)('returns to $parent on $action', async ({ parent, action }) => {
  const calls = vi.fn(({ path }: { path: string }) => {
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
    return {
      data: { key: 'sales', title: 'Sales', grants: [], revision: 'one' },
    };
  });
  const result = await renderWithApp(
    <>
      <Routes>
        <Route path={parent} element={<Parent />}>
          <Route index element={<h1>Role list</h1>} />
          <Route path=':key/edit' element={<RoleForm />} />
        </Route>
      </Routes>
      <Location />
    </>,
    {
      route: `${parent}/sales/edit?q=Sales&page=2`,
      namespace,
      namespaces: {
        [namespace]: {
          'en-US': async () => ({ default: enUS }),
          'zh-CN': async () => ({ default: zhCN }),
        },
      },
      services: (app: ClientApplication) =>
        app.container.instance(
          authorizationClientToken,
          new AuthorizationClient(app.container.resolve(apiClientToken)),
        ),
      fetch: answerApi(calls),
    },
  );
  expect(
    await screen.findByRole('link', { name: enUS.settings.roles }),
  ).toHaveAttribute('href', `${parent}?q=Sales&page=2`);
  if (action === 'back') {
    await userEvent.click(
      screen.getByRole('link', { name: enUS.settings.roles }),
    );
  } else if (action === 'save') {
    const name = await screen.findByRole('textbox', { name: /Role name/ });
    await userEvent.type(name, ' updated');
    await userEvent.click(
      screen.getByRole('button', { name: 'Save', exact: true }),
    );
    await waitFor(() =>
      expect(calls).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'PATCH' }),
      ),
    );
  } else {
    await userEvent.click(
      await screen.findByRole('button', { name: 'Cancel' }),
    );
  }
  await screen.findByRole('heading', { name: 'Role list' });
  expect(screen.getByTestId('location')).toHaveTextContent(
    `${parent}?q=Sales&page=2`,
  );
  result.unmount();
});
