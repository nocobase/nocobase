import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMemoryRouter,
  Link,
  Navigate,
  Outlet,
  RouterProvider,
  useLocation,
} from 'react-router';
import { expect, it } from 'vitest';
import { useListTabs } from '../../client/hooks/use-list-tabs.js';
import { RouteTreeProvider } from '../../client/routing/route-context.js';

const tabs = [
  { path: 'active', label: 'Active', dataset: 'active' },
  { path: 'archived', label: 'Archived', dataset: 'archived' },
  { path: 'cards', label: 'Cards', dataset: 'active' },
];
function Layout() {
  const state = useListTabs({
    tabs,
    parameterKeys: ['q', 'page', 'pageSize', 'sort', 'order'],
  });
  const location = useLocation();
  if (state.fallback) return <Navigate to={state.fallback} replace />;
  return (
    <>
      <output data-testid='tab'>{state.active?.label}</output>
      <output data-testid='url'>
        {location.pathname}
        {location.search}
      </output>
      <output data-testid='source'>{JSON.stringify(state.source)}</output>
      {tabs.map((tab) => (
        <Link key={tab.path} to={state.destination(tab)}>
          {tab.label}
        </Link>
      ))}
      <Outlet />
    </>
  );
}
function setup(url: string) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <RouteTreeProvider routes={[] as AppClientRegisteredRoute[]}>
            <Outlet />
          </RouteTreeProvider>
        ),
        children: [
          {
            path: '/assets',
            element: <Layout />,
            children: [
              ...tabs.map((tab) => ({
                path: tab.path,
                element: <Outlet />,
                children: [
                  { index: true, element: <p>Content</p> },
                  { path: ':id', element: <p>Detail</p> },
                ],
              })),
              {
                path: ':unavailableTab',
                element: null,
                children: [{ path: ':id', element: null }],
              },
            ],
          },
        ],
      },
    ],
    { initialEntries: [url] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

it('isolates different datasets and retains compatible display tabs and enclosing context', async () => {
  const router = setup(
    '/assets/active?q=drill&page=3&pageSize=20&sort=name&order=desc&parentFilter=kept',
  );
  await userEvent.click(screen.getByRole('link', { name: 'Cards' }));
  expect(router.state.location.search).toContain('page=3');
  await userEvent.click(screen.getByRole('link', { name: 'Archived' }));
  expect(router.state.location.search).toBe('?parentFilter=kept');
  await act(() => router.navigate(-1));
  expect(screen.getByTestId('tab')).toHaveTextContent('Cards');
  expect(router.state.location.search).toContain('q=drill');
});

it('retains the source tab and its query when a real detail route writes its own query', async () => {
  const router = setup('/assets/archived?q=drill&page=2&sort=name&order=desc');
  await act(() => router.navigate('/assets/archived/42?detailPage=7'));
  expect(screen.getByTestId('tab')).toHaveTextContent('Archived');
  expect(screen.getByTestId('source')).toHaveTextContent(
    '"pathname":"/assets/archived","search":"?q=drill&page=2&sort=name&order=desc"',
  );
});

it('replaces a removed tab with the first accessible tab without stale dataset parameters', async () => {
  const router = setup(
    '/assets/deleted?page=99&sort=deleted&parentFilter=kept',
  );
  expect(router.state.location.pathname).toBe('/assets/active');
  expect(router.state.location.search).toBe('?parentFilter=kept');
  expect(router.state.historyAction).toBe('REPLACE');
});

// Match the declared detail shape even after its source tab is removed.
it('returns a removed tab detail to the group default without retaining its page', async () => {
  const router = setup('/assets/deleted/42?page=3&sort=name&order=desc');
  await screen.findByText('Content');
  expect(router.state.location.pathname).toBe('/assets/active');
  expect(router.state.location.search).toBe('');
  expect(screen.getByTestId('tab')).toHaveTextContent('Active');
});
