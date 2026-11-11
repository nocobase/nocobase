import {
  AuthenticationProvider,
  authenticationClientToken,
} from '@nocobase/app-plugin-authentication/client';
import { renderWithApp, answerApi } from '@nocobase/app-testing/client';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { InstanceDeploymentHistory } from '@nocobase/app-plugin-multi-app/client';
import installedPlugin from '@nocobase/app-plugin-multi-app/client';
import { pluginEnglish } from './plugin-locales.js';
const enUS = await pluginEnglish(installedPlugin);
const namespace = '@nocobase/app-plugin-multi-app';
it('shows versions, pages through deployments and refreshes the current page', async () => {
  const paths: string[] = [];
  await renderWithApp(
    <AuthenticationProvider>
      <InstanceDeploymentHistory instanceId='lab' />
    </AuthenticationProvider>,
    {
      services: (app) => {
        app.container.instance(authenticationClientToken, {
          getSession: async () => ({ data: null }),
        });
      },
      namespace,
      namespaces: { [namespace]: enUS },
      fetch: answerApi(({ path, query }) => {
        const page = query?.page === '2' ? 2 : 1;
        paths.push(`${path}?page=${page}`);
        return {
          data: [
            {
              id: `d${page}`,
              version: `1.0.${page}`,
              status: 'succeeded',
              createdAt: '2026-11-01T00:00:00Z',
              finishedAt: null,
            },
          ],
          meta: { page, pageSize: 10, total: 11 },
        };
      }),
    },
  );
  expect(await screen.findByText('1.0.1')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(await screen.findByText('1.0.2')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await screen.findByText('1.0.2');
  expect(
    paths.filter(
      (path) => path === 'multiApp/instances/lab/deployments?page=2',
    ),
  ).toHaveLength(2);
});
it('clears previously loaded history after access is revoked', async () => {
  let denied = false;
  await renderWithApp(
    <AuthenticationProvider>
      <InstanceDeploymentHistory instanceId='lab' />
    </AuthenticationProvider>,
    {
      services: (app) => {
        app.container.instance(authenticationClientToken, {
          getSession: async () => ({ data: null }),
        });
      },
      namespace,
      namespaces: { [namespace]: enUS },
      fetch: answerApi(() =>
        denied
          ? new Response(null, { status: 403 })
          : {
              data: [
                {
                  id: 'd',
                  version: '1.0.1',
                  status: 'deploying',
                  createdAt: '2026-11-01T00:00:00Z',
                  finishedAt: null,
                },
              ],
              meta: { page: 1, pageSize: 10, total: 1 },
            },
      ),
    },
  );
  expect(await screen.findByText('1.0.1')).toBeVisible();
  denied = true;
  await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load');
  expect(screen.queryByText('1.0.1')).toBeNull();
});
