import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMemoryRouter,
  Link,
  Outlet,
  RouterProvider,
  useLocation,
  useSearchParams,
} from 'react-router';
import { describe, expect, it } from 'vitest';
import { Breadcrumbs } from '../../client/components/breadcrumbs.js';
import { BackButton } from '../../client/components/back-button.js';
import { RouteTreeProvider } from '../../client/routing/route-context.js';
import enUS from '../../client/locales/en-US.js';

const runtime = await createTestI18nRuntime({
  application: { namespace: '@nocobase/navigation-test', resources: enUS },
  strict: false,
});
const route = (
  path: string,
  title: string,
  children: AppClientRegisteredRoute[] = [],
): AppClientRegisteredRoute => ({
  id: path,
  name: path,
  path,
  auth: 'required',
  packageName: 'test',
  source: 'application',
  breadcrumb: { title },
  componentLoader: async () => ({ default: () => null }),
  children,
});
const routes = [
  route('/orders', 'Orders', [
    route('/orders/:id', 'Order', [route('/orders/:id/lines', 'Lines')]),
  ]),
  route('/other', 'Other', [route('/other/:id', 'Other detail')]),
];
const initial = '/orders?q=Acme&status=open&page=2';
function List() {
  const [query, setQuery] = useSearchParams();
  const { pathname } = useLocation();
  return (
    <>
      <input
        aria-label='Search'
        value={query.get('q') ?? ''}
        onChange={(event) => {
          const next = new URLSearchParams(query);
          next.set('q', event.target.value);
          next.delete('page');
          setQuery(next);
        }}
      />
      <output data-testid='page'>{query.get('page') ?? '1'}</output>
      <output data-testid='record'>
        {query.get('q') || 'All'}-{query.get('page') ?? '1'}
      </output>
      <Link to={`${pathname}/42?detailPage=7&q=child`}>Open detail</Link>
      <button onClick={() => setQuery({})}>Clear</button>
    </>
  );
}
function Detail() {
  return (
    <>
      <BackButton />
      <Link to='lines?linePage=9'>Open lines</Link>
    </>
  );
}
function setup(url = initial) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <TestI18nProvider runtime={runtime}>
            <RouteTreeProvider routes={routes}>
              <Breadcrumbs />
              <Outlet />
            </RouteTreeProvider>
          </TestI18nProvider>
        ),
        children: [
          {
            path: '/orders',
            children: [
              { index: true, element: <List /> },
              {
                path: ':id',
                children: [
                  { index: true, element: <Detail /> },
                  { path: 'lines', element: <h1>Lines</h1> },
                ],
              },
            ],
          },
          {
            path: '/other',
            children: [
              { index: true, element: <List /> },
              { path: ':id', element: <Detail /> },
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

describe('returning to a list', () => {
  it('restores the actual list query through breadcrumbs across repeated visits', async () => {
    const router = setup();
    for (let i = 0; i < 3; i++) {
      await userEvent.click(screen.getByRole('link', { name: 'Open detail' }));
      expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute(
        'href',
        initial,
      );
      await userEvent.click(screen.getByRole('link', { name: 'Orders' }));
      expect(router.state.location.search).toBe('?q=Acme&status=open&page=2');
      expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue(
        'Acme',
      );
      expect(screen.getByTestId('page')).toHaveTextContent('2');
      expect(screen.getByTestId('record')).toHaveTextContent('Acme-2');
    }
  });
  it('restores list state through browser back and the standard BackButton', async () => {
    const router = setup();
    await userEvent.click(screen.getByRole('link', { name: 'Open detail' }));
    await act(() => router.navigate(-1));
    expect(screen.getByTestId('record')).toHaveTextContent('Acme-2');
    await userEvent.click(screen.getByRole('link', { name: 'Open detail' }));
    await userEvent.click(screen.getByRole('link', { name: 'Back' }));
    expect(router.state.location.pathname).toBe('/orders');
    expect(screen.getByTestId('record')).toHaveTextContent('Acme-2');
  });
  it('keeps each visited ancestor separate from a nested list query', async () => {
    setup();
    await userEvent.click(screen.getByRole('link', { name: 'Open detail' }));
    await userEvent.click(screen.getByRole('link', { name: 'Open lines' }));
    expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute(
      'href',
      initial,
    );
    // Middle levels appear in both the desktop trail and the collapsed menu.
    expect(screen.getByRole('link', { name: 'Order' })).toHaveAttribute(
      'href',
      '/orders/42?detailPage=7&q=child',
    );
  });
  it('does not revive cleared filters or leak one list into another', async () => {
    const router = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await userEvent.click(screen.getByRole('link', { name: 'Open detail' }));
    expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute(
      'href',
      '/orders',
    );
    await act(() => router.navigate('/other?q=Beta&page=3'));
    await userEvent.click(screen.getByRole('link', { name: 'Open detail' }));
    expect(screen.getByRole('link', { name: 'Other' })).toHaveAttribute(
      'href',
      '/other?q=Beta&page=3',
    );
    await act(() => router.navigate('/orders/42?detailPage=8'));
    expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute(
      'href',
      '/orders',
    );
  });
  it('does not apply a deep-linked detail query to an unvisited ancestor', () => {
    setup('/orders/42?detailPage=7');
    expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute(
      'href',
      '/orders',
    );
  });
  it('uses the latest search after changing conditions and resetting the page', async () => {
    setup();
    await userEvent.clear(screen.getByRole('textbox', { name: 'Search' }));
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Search' }),
      'Beta',
    );
    await userEvent.click(screen.getByRole('link', { name: 'Open detail' }));
    await userEvent.click(screen.getByRole('link', { name: 'Orders' }));
    expect(screen.getByTestId('record')).toHaveTextContent('Beta-1');
  });
});
