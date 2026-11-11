import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import notification from '@nocobase/app-plugin-notification/client';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, useLocation, useNavigate } from 'react-router';
import { describe, expect, it } from 'vitest';

import { createApplicationRoutes } from '../../client/routes.ts';
import { renderRouteTree } from '../../client/routing/route-tree.tsx';
import enUS from '../../client/locales/en-US.js';
import packageMetadata from '../../package.json' with { type: 'json' };

// Loading lazy routes can exceed Testing Library's one-second default on a loaded CI runner.
const LOAD = { timeout: 10_000 };
const LIST = '/settings/notifications/templates';

const template = (id: string, name: string) => ({
  id,
  name,
  category: 'Accounts',
  contributor: '@nocobase/app-plugin-users',
  trigger: 'Invitation sent',
  recipients: 'Invited person',
  businessRule: 'Always',
  locales: ['en-US'],
  localeMode: 'combined',
  languagePolicy: 'All languages in one message',
  variables: [],
  channels: [],
});
const templates = [
  template('users.invitation', 'User invitation'),
  template('users.reminder', 'Invitation reminder'),
];

function Location() {
  const location = useLocation();
  return (
    <output data-testid='location'>
      {location.pathname}
      {location.search}
    </output>
  );
}

function Back() {
  const navigate = useNavigate();
  return (
    <button type='button' onClick={() => void navigate(-1)}>
      Go back
    </button>
  );
}

/** The application's real route tree with the built-in invitation configured, rendered the way the router renders it. */
async function renderAt(route: string) {
  const user = userEvent.setup();
  const built = resolveAppClientContributions([
    {
      packageName: packageMetadata.name,
      source: 'application',
      routes: createApplicationRoutes({
        notificationTemplates: { invitationConfigured: true },
      }),
    },
  ]);
  await renderWithApp(
    <>
      <Routes>{renderRouteTree(built.routes)}</Routes>
      <Location />
      <Back />
    </>,
    {
      plugins: [notification()],
      namespace: packageMetadata.name,
      namespaces: { [packageMetadata.name]: enUS },
      route,
      services(app: ClientApplication) {
        app.container.singleton(
          authorizationClientToken,
          (resolver) =>
            new AuthorizationClient(resolver.resolve(apiClientToken)),
        );
      },
      fetch: answerApi(({ path }) => {
        if (path === 'authorization/permissions')
          return { data: { unrestricted: true, permissions: [] } };
        if (path === 'notifications/templates') return { data: templates };
        for (const item of templates) {
          if (path === `notifications/templates/${item.id}`)
            return { data: item };
          if (path === `notifications/templates/${item.id}/preview`)
            return {
              data: {
                synthetic: true,
                requestedLocale: 'en-US',
                effectiveLocale: 'en-US',
                definition: { title: 'Invitation', body: 'Body' },
                content: { title: `${item.name} preview`, body: 'Body' },
              },
            };
        }
        return new Response(null, { status: 404 });
      }),
    },
  );
  return user;
}

const location = () => screen.getByTestId('location');

describe('notification template address', () => {
  it('moves an earlier ?template= link to the template address', async () => {
    await renderAt(`${LIST}?template=users.invitation`);
    const drawer = await screen.findByRole('dialog', {}, LOAD);
    expect(
      await within(drawer).findByText('User invitation preview', {}, LOAD),
    ).toBeVisible();
    expect(location().textContent).toBe(`${LIST}/users.invitation`);
  });

  it('opens a template from its own address and closes back to the list', async () => {
    const user = await renderAt(`${LIST}/users.reminder`);
    const drawer = await screen.findByRole('dialog', {}, LOAD);
    expect(
      await within(drawer).findByText('Invitation reminder preview', {}, LOAD),
    ).toBeVisible();
    // The list stays under the drawer.
    expect(
      screen.getByRole('button', { name: /User invitation/u, hidden: true }),
    ).toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(location().textContent).toBe(LIST);
  });

  it('gives each opened card an address and goes back to the list', async () => {
    const user = await renderAt(LIST);
    await user.click(
      await screen.findByRole('button', { name: /User invitation/u }, LOAD),
    );
    const drawer = await screen.findByRole('dialog', {}, LOAD);
    await within(drawer).findByText('User invitation preview', {}, LOAD);
    expect(location().textContent).toBe(`${LIST}/users.invitation`);
    await user.click(
      screen.getByRole('button', { name: 'Go back', hidden: true }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(location().textContent).toBe(LIST);
    expect(
      screen.getByRole('button', { name: /User invitation/u }),
    ).toBeVisible();
  });
});
