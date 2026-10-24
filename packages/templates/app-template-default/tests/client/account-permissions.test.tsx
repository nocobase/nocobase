import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { authorizationClientToken } from '@nocobase/app-plugin-authorization/client';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { DEFAULT_ADMIN_CREDENTIALS } from '@nocobase/app-plugin-authentication/testing';
import { act, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ClientRoute } from '../../client/routing/client-route.js';
import { useRouteNavigation } from '../../client/routing/route-navigation.js';
import { renderAuthenticatedClient } from '../helpers/authenticated-client.js';

const member = {
  email: 'member@example.test',
  password: 'test-member-password',
};
const routes: AppClientRegisteredRoute[] = ['apps', 'users'].map((name) => ({
  id: name,
  name,
  path: `/${name}`,
  auth: 'required',
  authz: { resource: { type: 'page', id: name }, action: 'access' },
  packageName: 'test',
  source: 'application',
  navigation: { title: name },
  componentLoader: async () => ({ default: () => <div>{name} content</div> }),
}));
const grants = (full: boolean) =>
  (full ? ['apps', 'users'] : ['apps']).map((id) => ({
    resource: { type: 'page', id },
    actions: [{ action: 'access' }],
  }));
function Menu() {
  const { items, loading } = useRouteNavigation(routes);
  return (
    <nav aria-label='Pages'>
      {loading
        ? 'Checking'
        : items.map(({ route }) => <span key={route.id}>{route.name}</span>)}
    </nav>
  );
}
function setup(options: Parameters<typeof renderAuthenticatedClient>[1] = {}) {
  return renderAuthenticatedClient(
    <>
      <Menu />
      <ClientRoute route={routes[1]} />
    </>,
    {
      member: true,
      grants: grants(true),
      namespaces: { test: { apps: 'apps', users: 'users' } },
      ...options,
    },
  );
}
async function expectMenu(full: boolean) {
  // Realtime permission events may invalidate the snapshot again during a refresh.
  // Read and assert both surfaces together, rather than retaining a detached node from findByText().
  await waitFor(() => {
    expect(screen.getByRole('navigation', { name: 'Pages' }).textContent).toBe(
      full ? 'appsusers' : 'apps',
    );
    if (full) expect(screen.getByText('users content')).toBeVisible();
    else {
      expect(screen.getByText('Access denied')).toBeVisible();
      expect(screen.queryByText('users content')).not.toBeInTheDocument();
    }
  });
}
async function changePermissions(
  view: Awaited<ReturnType<typeof setup>>,
  full: boolean,
) {
  await view.server.application.container
    .resolve(authorizationToken)
    .permissionSets.update('test-access', {
      key: 'test-access',
      grants: grants(full),
    });
}
function invalidate(view: Awaited<ReturnType<typeof setup>>) {
  act(() => view.app.container.resolve(authorizationClientToken).invalidate());
}

describe('account permission changes without a browser reload', () => {
  it('updates menus and route guards when signing in as admin, member and admin again', async () => {
    const view = await setup({ grants: grants(false) });
    await expectMenu(false);
    await view.signInAs(DEFAULT_ADMIN_CREDENTIALS);
    await expectMenu(true);
    await view.signInAs(member);
    await expectMenu(false);
    await view.signInAs(DEFAULT_ADMIN_CREDENTIALS);
    await expectMenu(true);
  });
  it('clears permissions on logout and same-user re-login with a new session', async () => {
    const view = await setup();
    await expectMenu(true);
    const firstSession = view.identity().session!.session.id;
    await act(async () => {
      await view.identity().client.signOut();
      await view.identity().refresh();
    });
    await waitFor(() => expect(view.identity().session).toBeNull());
    expect(await screen.findByText('Access denied')).toBeVisible();
    expect(
      screen.getByRole('navigation', { name: 'Pages' }),
    ).toBeEmptyDOMElement();
    await changePermissions(view, false);
    await view.signInAs(member);
    expect(view.identity().session!.session.id).not.toBe(firstSession);
    await expectMenu(false);
  });
  it('revokes and restores a mounted menu and page after persisted permission changes', async () => {
    const view = await setup();
    await expectMenu(true);
    await changePermissions(view, false);
    invalidate(view);
    expect(screen.queryByText('users content')).not.toBeInTheDocument();
    await expectMenu(false);
    await changePermissions(view, true);
    invalidate(view);
    await expectMenu(true);
  });
  it('hides previously allowed pages on network failure and recovers on retry', async () => {
    let offline = false;
    const view = await setup({
      beforeRequest(request) {
        if (offline && request.url.endsWith('/authorization/permissions'))
          throw new TypeError('Failed to fetch');
      },
    });
    await expectMenu(true);
    offline = true;
    invalidate(view);
    await waitFor(() =>
      expect(
        screen.getByRole('navigation', { name: 'Pages' }),
      ).toBeEmptyDOMElement(),
    );
    expect(await screen.findByText('Access denied')).toBeVisible();
    expect(screen.queryByText('users content')).not.toBeInTheDocument();
    offline = false;
    invalidate(view);
    await expectMenu(true);
  });
  it('ignores an old permissive response after a new session has fewer permissions', async () => {
    const old = Promise.withResolvers<void>();
    const received = Promise.withResolvers<void>();
    let held = false;
    const view = await setup({
      afterResponse(request) {
        // Only delay delivery: the response itself is produced by the real permission service.
        if (!held && request.url.endsWith('/authorization/permissions')) {
          held = true;
          received.resolve();
          return old.promise;
        }
      },
    });
    try {
      await received.promise;
      await changePermissions(view, false);
      await view.signInAs(member);
      await expectMenu(false);
      await act(async () => {
        old.resolve();
        await old.promise;
      });
      await expectMenu(false);
    } finally {
      old.resolve();
    }
  });
});
