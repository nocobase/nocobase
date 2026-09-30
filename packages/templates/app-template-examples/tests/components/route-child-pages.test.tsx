import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { Breadcrumbs } from '../../client/components/breadcrumbs.js';
import RouteChildPageQuotationPage from '../../client/pages/route-overlays/pages/quotation/index.js';
import RouteOverlaysPage from '../../client/pages/route-overlays/index.js';
import applicationRoutes from '../../client/routes.js';
import { RouteTreeProvider } from '../../client/routing/route-context.js';
import enUS from '../../client/locales/en-US.js';

const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/app-template-examples',
    resources: enUS,
  },
});

// The pages render under their own package's routes, so they are scoped to the application namespace as the host
// scopes them.
function I18n({ children }: { readonly children: ReactNode }) {
  return (
    <TestI18nProvider
      runtime={runtime}
      namespace='@nocobase/app-template-examples'
    >
      {children}
    </TestI18nProvider>
  );
}

// The real registrations, so the trail is exercised against the paths and titles the application actually declares.
const registered = resolveAppClientContributions([
  {
    packageName: '@nocobase/app-template-examples',
    source: 'application',
    routes: applicationRoutes,
  },
]).routes;

const trailAt = (pathname: string) => (
  <MemoryRouter initialEntries={[pathname]}>
    <RouteTreeProvider routes={registered}>
      <Breadcrumbs />
    </RouteTreeProvider>
  </MemoryRouter>
);

describe('nested example pages', () => {
  it('adds a level for each page in the chain', () => {
    render(trailAt('/route-overlays/pages/quotation'), { wrapper: I18n });

    expect(
      screen.getByRole('link', { name: enUS.navigation.routeOverlays }),
    ).toHaveAttribute('href', '/route-overlays');
    expect(
      screen.getByRole('link', { name: enUS.routeOverlays.childPagesTitle }),
    ).toHaveAttribute('href', '/route-overlays/pages');
    expect(screen.getByText(enUS.routeOverlays.topicQuotation)).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('names each sibling page separately', () => {
    render(trailAt('/route-overlays/pages/renewal'), { wrapper: I18n });

    expect(screen.getByText(enUS.routeOverlays.topicRenewal)).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.queryByText(enUS.routeOverlays.topicQuotation),
    ).not.toBeInTheDocument();
  });

  it('leaves the trail alone when an overlay opens over a page', () => {
    render(trailAt('/route-overlays/pages/quotation/dialog'), {
      wrapper: I18n,
    });

    // The deepest level is still the page, because the dialog below it names no destination.
    expect(screen.getByText(enUS.routeOverlays.topicQuotation)).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows no trail while only overlays are open', () => {
    render(trailAt('/route-overlays/dialog/drawer'), { wrapper: I18n });

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('keeps the page beneath rendered when a child page is open', () => {
    render(
      <MemoryRouter initialEntries={['/route-overlays/pages']}>
        <RouteTreeProvider routes={registered}>
          <RouteOverlaysPage />
        </RouteTreeProvider>
      </MemoryRouter>,
      { wrapper: I18n },
    );

    // The child page lays itself over this one rather than replacing it, so a draft typed here would survive.
    expect(
      screen.getByRole('heading', { name: enUS.routeOverlays.title, level: 1 }),
    ).toBeVisible();
  });

  it('heads a child page with the same title its route declares', () => {
    render(
      <MemoryRouter initialEntries={['/route-overlays/pages/quotation']}>
        <RouteTreeProvider routes={registered}>
          <RouteChildPageQuotationPage />
        </RouteTreeProvider>
      </MemoryRouter>,
      { wrapper: I18n },
    );

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: enUS.routeOverlays.topicQuotation,
      }),
    ).toBeVisible();
    expect(
      screen.getByText(enUS.routeOverlays.topicQuotation, { selector: 'span' }),
    ).toHaveAttribute('aria-current', 'page');
  });
});
