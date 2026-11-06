import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  PageBreadcrumbProvider,
  usePageBreadcrumb,
} from '@nocobase/app-client';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Breadcrumbs } from '../../client/components/breadcrumbs.js';
import { RouteTreeProvider } from '../../client/routing/route-context.js';
import { navigationDestination } from '../../client/routing/navigation-destination.js';
import { routeKey } from '../../client/routing/route-navigation.js';
import enUS from '../../client/locales/en-US.js';

const runtime = await createTestI18nRuntime({
  application: { namespace: 'test', resources: enUS },
  strict: false,
});
const page = (
  id: string,
  path: string,
  children: AppClientRegisteredRoute[] = [],
): AppClientRegisteredRoute => ({
  id,
  name: id,
  path,
  packageName: 'test',
  source: 'application',
  auth: 'required',
  authz: 'skip',
  children,
  componentLoader: async () => ({ default: () => null }),
});
const detail = page('detail', '/records/:id');
const parent = page('parent', '/orders');
const source = page('source', '/orders/completed');
const routes = [parent, source, detail];
const allowed = { denied: new Set<string>(), loading: false };

function Record() {
  usePageBreadcrumb([
    { label: 'Orders', to: '/orders' },
    {
      label: 'Completed',
      to: '/orders/completed?q=alpha&page=2&pageSize=20&sort=name&order=desc',
    },
    { label: 'A very long record name / 长记录名称' },
  ]);
  return null;
}
function trailView(access = allowed) {
  return (
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter basename='/main' initialEntries={['/main/records/42']}>
        <RouteTreeProvider routes={routes} access={access}>
          <PageBreadcrumbProvider>
            <Breadcrumbs />
            <Record />
          </PageBreadcrumbProvider>
        </RouteTreeProvider>
      </MemoryRouter>
    </TestI18nProvider>
  );
}
function renderTrail(access = allowed) {
  return render(trailView(access));
}

describe('navigation destinations', () => {
  it.each([
    'https://example.com/orders',
    '//example.com/orders',
    '/\\example.com',
    '/orders/../orders',
    '/orders/%2e%2e/orders',
    '/orders/%ZZ',
    '/missing',
    '/main/orders',
    'orders',
    'javascript:alert(1)',
  ])('rejects %s', (to) => {
    expect(navigationDestination(to, routes, allowed)).toBeUndefined();
  });
  it('requires a page and access to all its ancestors, and fails closed during permission refresh', () => {
    const tree = [
      { ...parent, componentLoader: undefined, children: [source] },
    ];
    expect(navigationDestination('/orders', tree, allowed)).toBeUndefined();
    expect(
      navigationDestination('/orders/completed', tree, {
        ...allowed,
        denied: new Set([routeKey(parent)]),
      }),
    ).toBeUndefined();
    expect(
      navigationDestination('/orders/completed', tree, {
        ...allowed,
        loading: true,
      }),
    ).toBeUndefined();
  });
  it('preserves an encoded dynamic record and list query without adding the deployment base', () => {
    expect(
      navigationDestination('/records/a%2Fb?q=alpha&page=2', routes, allowed),
    ).toEqual({
      pathname: '/records/a%2Fb',
      search: '?q=alpha&page=2',
      hash: '',
    });
  });
});

describe('parent navigation', () => {
  it('uses the same source and state for the desktop breadcrumb and mobile parent link', () => {
    renderTrail();
    const desktop = screen.getByRole('link', { name: 'Completed' });
    const mobile = screen.getByRole('link', { name: 'Back to Completed' });
    expect(mobile).toHaveAttribute('href', desktop.getAttribute('href'));
    expect(mobile).toHaveAttribute(
      'href',
      '/main/orders/completed?q=alpha&page=2&pageSize=20&sort=name&order=desc',
    );
    expect(
      screen.getByText('A very long record name / 长记录名称'),
    ).toHaveAttribute('aria-current', 'page');
  });
  it('removes a denied parent name and falls back to the next declared accessible parent', () => {
    renderTrail({ ...allowed, denied: new Set([routeKey(source)]) });
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to Orders' }),
    ).toHaveAttribute('href', '/main/orders');
  });
  it('keeps the current title but exposes no parents while permissions are pending', () => {
    renderTrail({ ...allowed, loading: true });
    expect(screen.queryByText('Orders')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /^Back to/u }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('A very long record name / 长记录名称'),
    ).toHaveAttribute('aria-current', 'page');
  });
  it('removes parent links immediately on recheck or revocation and restores them after access returns', () => {
    const view = renderTrail();
    expect(
      screen.getByRole('link', { name: 'Back to Completed' }),
    ).toBeInTheDocument();
    view.rerender(trailView({ ...allowed, loading: true }));
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    view.rerender(
      trailView({
        ...allowed,
        denied: new Set([routeKey(parent), routeKey(source)]),
      }),
    );
    expect(
      screen.queryByRole('link', { name: /^Back to/u }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('A very long record name / 长记录名称'),
    ).toHaveAttribute('aria-current', 'page');
    view.rerender(trailView(allowed));
    expect(
      screen.getByRole('link', { name: 'Back to Completed' }),
    ).toBeInTheDocument();
  });
});
