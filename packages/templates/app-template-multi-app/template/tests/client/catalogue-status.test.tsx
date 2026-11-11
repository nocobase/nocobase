import { renderWithApp, answerApi } from '@nocobase/app-testing/client';
import { apiClientToken } from '@nocobase/app-client';
import {
  AuthenticationProvider,
  authenticationClientToken,
} from '@nocobase/app-plugin-authentication/client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { Catalogue } from '../../client/pages/template-portal/views.js';
import enUS from '../../client/locales/en-US.js';
import installedPlugin from '@nocobase/app-plugin-multi-app/client';
import { pluginEnglish } from './plugin-locales.js';
const multiApp = await pluginEnglish(installedPlugin);
import metadata from '../../package.json' with { type: 'json' };
it.each([
  ['templates', 'retired', 'Retired'],
  ['instances', 'archived', 'Archived'],
] as const)(
  'defaults %s to active and retains access to history',
  async (kind, inactive, label) => {
    const states: unknown[] = [];
    await renderWithApp(
      <AuthenticationProvider>
        <Catalogue kind={kind} />
      </AuthenticationProvider>,
      {
        namespace: metadata.name,
        namespaces: {
          [metadata.name]: enUS,
          '@nocobase/app-plugin-multi-app': multiApp,
        },
        services: (app) => {
          app.container.instance(authenticationClientToken, {
            getSession: async () => ({ data: null }),
          });
          app.container.singleton(
            authorizationClientToken,
            (resolver) =>
              new AuthorizationClient(resolver.resolve(apiClientToken)),
          );
        },
        fetch: answerApi(({ path, query }) => {
          if (path === 'authorization/permissions')
            return { data: { unrestricted: true, permissions: [] } };
          if (path === `multiApp/${kind}` && query?.status)
            states.push(query.status);
          return { data: [], meta: { total: 0 } };
        }),
      },
    );
    await waitFor(() => expect(states).toContain('active'));
    await userEvent.click(
      await screen.findByRole('combobox', { name: 'Status' }),
    );
    await userEvent.click(await screen.findByRole('option', { name: label }));
    await waitFor(() => expect(states.at(-1)).toBe(inactive));
    await userEvent.click(screen.getByRole('combobox', { name: 'Status' }));
    await userEvent.click(
      await screen.findByRole('option', { name: 'Active', exact: true }),
    );
    await waitFor(() => expect(states.at(-1)).toBe('active'));
  },
);
