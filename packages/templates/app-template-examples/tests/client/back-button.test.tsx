import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { RouteTreeProvider } from '../../client/routing/route-context.js';
import { BackButton } from '#components/back-button';

import enUS from '../../client/locales/en-US.js';

const runtime = await createTestI18nRuntime({
  application: { namespace: '@nocobase/app-template-default', resources: enUS },
});

function I18n({ children }: { readonly children: ReactNode }): ReactElement {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

function renderAt(url: string, child: ReactElement) {
  const router = createMemoryRouter(
    [
      {
        path: '/projects',
        element: (
          <>
            <h1>List</h1>
            <Outlet />
          </>
        ),
        // A child page with a two-segment path, like a second route to the same overlay: `..` is still the list.
        children: [
          { path: ':projectId', element: child },
          { path: 'import/:batchId', element: child },
        ],
      },
      { path: '/overview', element: <h1>Overview</h1> },
    ],
    { initialEntries: [url] },
  );
  const registered = ['/projects', '/overview'].map(
    (path) =>
      ({
        path,
        id: path,
        name: path,
        packageName: 'test',
        auth: 'required',
        authz: 'skip',
        componentLoader: async () => ({ default: () => null }),
      }) as AppClientRegisteredRoute,
  );
  // The provider needs to be within the router, so wrap each route's page.
  const routes = router.routes;
  for (const entry of routes) {
    entry.element = (
      <RouteTreeProvider routes={registered}>{entry.element}</RouteTreeProvider>
    );
  }
  render(<RouterProvider router={router} />, { wrapper: I18n });
  return router;
}

describe('BackButton', () => {
  it('uses the default parent list when no source visit exists', async () => {
    const router = renderAt('/projects/12?q=alpha&page=2', <BackButton />);

    const link = screen.getByRole('link', { name: enUS.navigation.back });
    expect(link).toHaveAttribute('href', '/projects');

    await userEvent.click(link);
    expect(router.state.location.pathname).toBe('/projects');
    expect(router.state.location.search).toBe('');
    // Leaving the child page replaces its entry, as closing an overlay does.
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('resolves the parent by route, not by path segment', () => {
    renderAt('/projects/import/7', <BackButton />);

    expect(
      screen.getByRole('link', { name: enUS.navigation.back }),
    ).toHaveAttribute('href', '/projects');
  });

  it('takes a destination and a label of its own', () => {
    renderAt(
      '/projects/12',
      <BackButton to='/overview'>Back to the overview</BackButton>,
    );

    expect(
      screen.getByRole('link', { name: 'Back to the overview' }),
    ).toHaveAttribute('href', '/overview');
  });
  it.each(['https://example.com/overview', '//example.com', '/missing'])(
    'falls back safely for %s without naming the invalid destination',
    (to) => {
      renderAt(
        '/projects/12',
        <BackButton to={to}>Private destination</BackButton>,
      );
      expect(
        screen.getByRole('link', { name: enUS.navigation.back }),
      ).toHaveAttribute('href', '/projects');
      expect(screen.queryByText('Private destination')).not.toBeInTheDocument();
    },
  );
});
