import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  PageBreadcrumbProvider,
  usePageBreadcrumb,
} from '@nocobase/app-client';

import { Breadcrumbs } from '../../client/components/breadcrumbs.js';
import {
  RouteTreeProvider,
  useRouteTrail,
} from '../../client/routing/route-context.js';
import enUS from '../../client/locales/en-US.js';

// Breadcrumb titles here are made-up route data, not keys any namespace owns: the trail translates each through its
// package's namespace with the title itself as `defaultValue`, so the runtime is not strict.
const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/app-template-examples',
    resources: enUS,
  },
  strict: false,
});

function I18n({ children }: { readonly children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

const route = (
  name: string,
  path: string,
  extra: Partial<AppClientRegisteredRoute> = {},
): AppClientRegisteredRoute => ({
  auth: 'required',
  children: [],
  componentLoader: async () => ({ default: () => null }),
  id: name,
  name,
  packageName: 'test',
  path,
  source: 'application',
  ...extra,
});

describe('Breadcrumbs', () => {
  it('renders one level per route that declares a breadcrumb', () => {
    render(
      <MemoryRouter initialEntries={['/orders/archived']}>
        <RouteTreeProvider
          routes={[
            {
              ...route('orders', '/orders', {
                breadcrumb: { title: 'Orders' },
              }),
              children: [
                route('archived', '/orders/archived', {
                  breadcrumb: { title: 'Archived' },
                }),
              ],
            },
          ]}
        >
          <Breadcrumbs />
        </RouteTreeProvider>
      </MemoryRouter>,
      { wrapper: I18n },
    );

    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute(
      'href',
      '/orders',
    );
    expect(screen.getByText('Archived')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('links a parameterised level to where the user is, not to its pattern', () => {
    const orders = route('orders', '/orders', {
      breadcrumb: { title: 'Orders' },
    });
    const detail = route('orderDetail', '/orders/edit/:id', {
      breadcrumb: { title: 'Edit order' },
    });
    const details = route('orderDetailInfo', '/orders/edit/:id/details', {
      breadcrumb: { title: 'Details' },
    });
    const tree = [
      { ...orders, children: [{ ...detail, children: [details] }] },
    ];

    render(
      <MemoryRouter initialEntries={['/orders/edit/42/details']}>
        <RouteTreeProvider routes={tree}>
          <Breadcrumbs />
        </RouteTreeProvider>
      </MemoryRouter>,
      { wrapper: I18n },
    );

    expect(screen.getByRole('link', { name: 'Edit order' })).toHaveAttribute(
      'href',
      '/orders/edit/42',
    );
    expect(screen.getByText('Details')).toHaveAttribute('aria-current', 'page');
  });

  it.each(['a?b#c', 'a%b', 'a/b', 'a%2Fb', '中文'])(
    'preserves the encoded parameter %s when navigating with a basename',
    async (id) => {
      const encoded = encodeURIComponent(id);
      const detail = route('detail', '/orders/:id', {
        breadcrumb: { title: 'Order' },
      });
      const tree = [
        {
          ...detail,
          children: [
            route('info', '/orders/:id/details', {
              breadcrumb: { title: 'Details' },
            }),
          ],
        },
      ];
      function Destination() {
        const location = useLocation();
        const params = useParams();
        return (
          <output>
            {JSON.stringify({
              pathname: location.pathname,
              search: location.search,
              hash: location.hash,
              id: params.id,
            })}
          </output>
        );
      }
      render(
        <MemoryRouter
          basename='/main'
          initialEntries={[`/main/orders/${encoded}/details`]}
        >
          <RouteTreeProvider routes={tree}>
            <Breadcrumbs />
          </RouteTreeProvider>
          <Routes>
            <Route path='/orders/:id' element={<Destination />} />
            <Route path='/orders/:id/details' element={<Destination />} />
          </Routes>
        </MemoryRouter>,
        { wrapper: I18n },
      );
      const initialParams = screen.getByRole('status').textContent!;
      const link = screen.getByRole('link', { name: 'Order' });
      expect(link).toHaveAttribute('href', `/main/orders/${encoded}`);
      await userEvent.click(link);
      expect(JSON.parse(screen.getByRole('status').textContent!)).toEqual({
        pathname: `/orders/${encoded}`,
        search: '',
        hash: '',
        id: (JSON.parse(initialParams) as { id: string }).id,
      });
    },
  );

  it.each([
    ['/orders/:locale?/:id', '/orders/a%3Fb', '/orders/a%3Fb'],
    ['/orders/:locale?/:id', '/orders/en/a%3Fb', '/orders/en/a%3Fb'],
    ['/files/*', '/files/folder/a%23b', '/files/folder/a%23b'],
    ['/files/*', '/files', '/files'],
    ['/orders/:id', '/orders/a%3Fb/', '/orders/a%3Fb/'],
  ])('preserves matched depth for %s at %s', (pattern, pathname, expected) => {
    function Trail() {
      return (
        <output>
          {JSON.stringify(useRouteTrail().map((entry) => entry.pathname))}
        </output>
      );
    }
    render(
      <MemoryRouter initialEntries={[pathname]}>
        <RouteTreeProvider
          routes={[
            { ...route('root', '/'), children: [route('child', pattern)] },
          ]}
        >
          <Trail />
        </RouteTreeProvider>
      </MemoryRouter>,
      { wrapper: I18n },
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      JSON.stringify(['/', expected]),
    );
  });

  it('skips levels that are structure rather than a destination', () => {
    const orders = route('orders', '/orders', {
      breadcrumb: { title: 'Orders' },
    });
    // A tab and an overlay own a path segment but name no destination.
    const tab = route('ordersOpenTab', '/orders/open');
    const overlay = route('orderPreview', '/orders/open/preview');
    const tree = [{ ...orders, children: [{ ...tab, children: [overlay] }] }];

    render(
      <MemoryRouter initialEntries={['/orders/open/preview']}>
        <RouteTreeProvider routes={tree}>
          <Breadcrumbs />
        </RouteTreeProvider>
      </MemoryRouter>,
      { wrapper: I18n },
    );

    // Only Orders is titled: the tab and the overlay add no level, and Orders is where the user is.
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(trail).toHaveTextContent(/^Orders$/u);
    expect(screen.getByText('Orders')).toHaveAttribute('aria-current', 'page');
  });

  it('renders a group as plain text because no page sits behind it', () => {
    render(
      <MemoryRouter initialEntries={['/settings/automation/workflows']}>
        <RouteTreeProvider
          routes={[
            {
              ...route('automation', '/settings/automation', {
                breadcrumb: { title: 'Automation' },
                componentLoader: undefined,
              }),
              children: [
                route('workflows', '/settings/automation/workflows', {
                  breadcrumb: { title: 'Workflows' },
                }),
              ],
            },
          ]}
        >
          <Breadcrumbs />
        </RouteTreeProvider>
      </MemoryRouter>,
      { wrapper: I18n },
    );

    expect(
      screen.queryByRole('link', { name: 'Automation' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Automation')).toBeVisible();
    expect(screen.getByText('Workflows')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('counts the root route as a level when a page sits under it', () => {
    render(
      <MemoryRouter initialEntries={['/detail']}>
        <RouteTreeProvider
          routes={[
            {
              ...route('home', '/', { breadcrumb: { title: 'Home' } }),
              children: [
                route('detail', '/detail', { breadcrumb: { title: 'Detail' } }),
              ],
            },
          ]}
        >
          <Breadcrumbs />
        </RouteTreeProvider>
      </MemoryRouter>,
      { wrapper: I18n },
    );

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByText('Detail')).toHaveAttribute('aria-current', 'page');
  });

  it('names a top-level page, the header carrying it in place of a tagline', () => {
    render(
      <MemoryRouter initialEntries={['/articles']}>
        <RouteTreeProvider
          routes={[
            route('articles', '/articles', {
              navigation: { title: 'Articles' },
            }),
          ]}
        >
          <Breadcrumbs />
        </RouteTreeProvider>
      </MemoryRouter>,
      { wrapper: I18n },
    );

    // A menu page needs no `breadcrumb` of its own: its menu title names it.
    expect(screen.getByText('Articles')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows the trail a page declares, record names included, in place of the route trail', () => {
    function OrderPage() {
      usePageBreadcrumb([
        { label: 'Customers', to: '/customers?q=acme' },
        { label: 'Acme', to: '/customers/1' },
        { label: 'Order #42' },
      ]);
      return null;
    }
    render(
      <MemoryRouter initialEntries={['/orders/42']}>
        <RouteTreeProvider
          routes={[
            route('order', '/orders/:id', { breadcrumb: { title: 'Order' } }),
          ]}
        >
          <PageBreadcrumbProvider>
            <Breadcrumbs />
            <OrderPage />
          </PageBreadcrumbProvider>
        </RouteTreeProvider>
      </MemoryRouter>,
      { wrapper: I18n },
    );

    expect(screen.getByRole('link', { name: 'Customers' })).toHaveAttribute(
      'href',
      '/customers?q=acme',
    );
    expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute(
      'href',
      '/customers/1',
    );
    expect(screen.getByText('Order #42')).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.queryByText('Order')).not.toBeInTheDocument();
    // On a medium screen the levels in between fold into a menu.
    expect(
      screen.getByRole('button', { name: 'Show the levels in between' }),
    ).toBeInTheDocument();
  });
});
