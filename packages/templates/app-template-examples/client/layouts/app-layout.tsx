import { useSyncServerLocale } from '@nocobase/app-plugin-i18n/client';
import { useMemo, type ReactElement } from 'react';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { Navigate, Outlet, useLocation } from 'react-router';

import { BrandWatermark } from '#components/brand-watermark';
import { Breadcrumbs } from '#components/breadcrumbs';

import { OnlineAgentProvider } from '#components/online-agent/provider';
import { OnlineAgentPanelHost } from '#components/online-agent/panel-host';
import { RouteTreeProvider } from '../routing/route-context.js';
import { RouteLeaveBoundary } from '../routing/route-leave-boundary.js';

import { PageBreadcrumbProvider } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { LayoutHeader } from './components/layout-header.js';
import {
  AppSidebar,
  AppSidebarProvider,
  AppSidebarToggle,
} from './components/app-sidebar.js';
import { NavigationMenu } from './components/navigation-menu.js';
import { HeaderActions } from './components/header-actions.js';
import { AppSidebarFooter } from './components/sidebar-footer.js';
import {
  useRouteNavigation,
  firstAccessiblePage,
  routeKey,
  selectedNavigationId,
} from '../routing/route-navigation.js';

export interface AppLayoutProps {
  readonly routes: readonly AppClientRegisteredRoute[];
}

export function AppLayout({ routes }: AppLayoutProps): ReactElement {
  return (
    <OnlineAgentProvider>
      <AuthenticatedLayout routes={routes} />
    </OnlineAgentProvider>
  );
}

function AuthenticatedLayout({ routes }: AppLayoutProps): ReactElement {
  // The browser decides what it renders; this tells the server the same language so its messages match.
  useSyncServerLocale();

  const { t } = useTranslation();
  const { items: menuItems, denied, loading } = useRouteNavigation(routes);
  const access = useMemo(() => ({ denied, loading }), [denied, loading]);
  const location = useLocation();
  const home = routes.find(
    (route) => route.path === '/' && route.componentLoader,
  );
  const landing =
    !loading && location.pathname === '/' && home && denied.has(routeKey(home))
      ? firstAccessiblePage(menuItems)
      : undefined;
  const selectedKey = selectedNavigationId(routes, location.pathname, denied);
  const navigationLabel = t('navigation.label', {
    defaultValue: 'Application navigation',
  });

  return (
    // The shell owns the business route tree used by its pages and navigation.
    <RouteTreeProvider routes={routes} access={access}>
      <PageBreadcrumbProvider>
        <AppSidebarProvider>
          <AppSidebar label={navigationLabel} footer={<AppSidebarFooter />}>
            <NavigationMenu
              items={menuItems}
              label={navigationLabel}
              selectedKey={selectedKey}
            />
          </AppSidebar>
          <div className='flex min-w-0 flex-1 flex-col'>
            <LayoutHeader className='sticky top-0 z-40 justify-between'>
              <div className='flex min-w-0 items-center gap-3'>
                <AppSidebarToggle />
                <div className='h-5 w-px shrink-0 bg-border' />
                {/* The current page's trail: the route tree's, or the one the page declares (`usePageBreadcrumb`). */}
                <Breadcrumbs denied={denied} />
              </div>
              <HeaderActions />
            </LayoutHeader>
            {/* Examples-only integration: the temporary chat docks beside any demo without replacing the route. */}
            <div className='relative flex min-h-0 flex-1'>
              <main className='app-brand-surface relative isolate min-h-0 min-w-0 flex-1 overflow-hidden'>
                <BrandWatermark className='-z-10' />
                {/* main only positions; the page scrolls in here, so a child page layer laid over main is neither
            moved by the page's scrolling nor stretched by its height. */}
                <div className='h-full overflow-y-auto'>
                  <RouteLeaveBoundary hidden={loading}>
                    {landing ? <Navigate to={landing} replace /> : <Outlet />}
                  </RouteLeaveBoundary>
                </div>
              </main>
              <OnlineAgentPanelHost />
            </div>
          </div>
        </AppSidebarProvider>
      </PageBreadcrumbProvider>
    </RouteTreeProvider>
  );
}
