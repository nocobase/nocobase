import { useSyncServerLocale } from '@nocobase/app-plugin-i18n/client';
import { useMemo, type ReactElement } from 'react';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { Outlet, useLocation } from 'react-router';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { EMPTY_ARRAY } from '@/lib/constants';

import { RouteTreeProvider } from '../routing/route-context.js';

import {
  PageBreadcrumbProvider,
  useClientApplication,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { LayoutHeader } from './components/layout-header.js';
import {
  AppSidebar,
  AppSidebarProvider,
  AppSidebarToggle,
} from './components/app-sidebar.js';
import { NavigationMenu } from './components/navigation-menu.js';
import { AppBrand } from './components/app-brand.js';
import { HeaderActions } from './components/header-actions.js';
import { AppSidebarFooter } from './components/sidebar-footer.js';
import {
  useRouteNavigation,
  selectedNavigationId,
  navigationPages,
} from '../routing/route-navigation.js';

export interface AppLayoutProps {
  readonly routes: readonly AppClientRegisteredRoute[];
  /** Pages plugins declare with `defineDevRoutes()`: rendered in this shell at `/dev/...`, never in its navigation. */
  readonly devRoutes?: readonly AppClientRegisteredRoute[];
}

export function AppLayout({
  routes,
  devRoutes = EMPTY_ARRAY,
}: AppLayoutProps): ReactElement {
  // The browser decides what it renders; this tells the server the same language so its messages match.
  useSyncServerLocale();

  const { t } = useTranslation();
  const { items: menuItems, denied } = useRouteNavigation(routes);
  const selectedKey = selectedNavigationId(
    routes,
    useLocation().pathname,
    denied,
  );
  const settingsNavigation = useRouteNavigation(
    useClientApplication().runtime.settingsRouteTree,
  );
  // Pages read their trail from this tree, so it keeps its identity between renders.
  const routeTree = useMemo(
    () => (devRoutes.length ? [...routes, ...devRoutes] : routes),
    [routes, devRoutes],
  );
  const navigationLabel = t('navigation.label', {
    defaultValue: 'Application navigation',
  });

  return (
    // The shell owns the business route tree used by its pages and navigation.
    <RouteTreeProvider routes={routeTree}>
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
                <div className='md:hidden'>
                  <AppBrand />
                </div>
                <div className='h-5 w-px shrink-0 bg-border' />
                {/* The current page's trail: the route tree's, or the one the page declares (`usePageBreadcrumb`). */}
                <Breadcrumbs denied={denied} />
              </div>
              <HeaderActions
                showSettings={
                  navigationPages(settingsNavigation.items).length > 0
                }
              />
            </LayoutHeader>
            <main className='relative min-w-0 flex-1 overflow-hidden'>
              {/* main only positions; the page scrolls in here, so a child page layer laid over main is neither
            moved by the page's scrolling nor stretched by its height. */}
              <div className='h-full overflow-y-auto'>
                <Outlet />
              </div>
            </main>
          </div>
        </AppSidebarProvider>
      </PageBreadcrumbProvider>
    </RouteTreeProvider>
  );
}
