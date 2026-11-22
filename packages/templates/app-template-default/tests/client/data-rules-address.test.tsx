import {
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router';
import { expect, it } from 'vitest';

import { ClientRoute } from '../../client/routing/client-route.js';
import { createAuthenticatedClientRenderer } from '../helpers/authenticated-client.js';
import { authorizationPages } from '../helpers/plugin-routes.js';

const renderAuthenticatedClient = createAuthenticatedClientRenderer();

function find(
  routes: readonly AppClientRegisteredRoute[],
  name: string,
): AppClientRegisteredRoute | undefined {
  for (const route of routes) {
    if (route.name === name) return route;
    const child = find(route.children ?? [], name);
    if (child) return child;
  }
  return undefined;
}

const { routes } = resolveAppClientContributions([authorizationPages()]);
const defaultAccess = find(routes, 'settingsDefaultAccess')!;

function Where() {
  const location = useLocation();
  return <output aria-label='Route'>{location.pathname}</output>;
}

/** The stored Data rules address behind the real route guard, and a stand-in for wherever the person lands. */
function mount(options: Parameters<typeof renderAuthenticatedClient>[1]) {
  return renderAuthenticatedClient(
    <Routes>
      <Route
        path='/settings/default-access'
        element={<ClientRoute route={defaultAccess} />}
      />
      <Route path='*' element={<Where />} />
    </Routes>,
    { route: '/settings/default-access', member: true, ...options },
  );
}

const readRoles = {
  resource: { type: 'settings', id: 'authorization.permission-sets' },
  actions: [{ action: 'read' }],
};

it('takes a member who may read roles from a stored Data rules link to Roles once no rule plugin is registered', async () => {
  await mount({ rulePlugins: false, grants: [readRoles] });
  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
      '/settings/roles',
    ),
  );
  expect(screen.queryByText('Access denied')).not.toBeInTheDocument();
});

it('takes a member who may open no page of Roles and permissions to the System settings home', async () => {
  await mount({ rulePlugins: false });
  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
      /^\/settings$/,
    ),
  );
});

it('keeps the address and its own read permission while the rule plugin is registered', async () => {
  await mount({ grants: [readRoles] });
  expect(await screen.findByText('Access denied')).toBeVisible();
  expect(screen.queryByRole('status', { name: 'Route' })).toBeNull();
});
