import { useSyncServerLocale } from '@nocobase/app-plugin-i18n/client';
import { useMemo, type ReactElement } from 'react';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { Outlet, useLocation } from 'react-router';

import { BrandWatermark } from '#components/brand-watermark';
import { Breadcrumbs } from '#components/breadcrumbs';

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
import { SettingsBack } from './components/settings-back.js';
import {
  buildSettingsNavigation,
  useRouteNavigation,
  selectedNavigationId,
} from '../routing/route-navigation.js';
import { SETTINGS_HOME } from '#lib/navigation-transform';
import {
  isSettingsPath,
  useRememberSettingsReturn,
  withSettingsShell,
} from '../routing/settings-shell.js';

export interface AppLayoutProps {
  readonly routes: readonly AppClientRegisteredRoute[];
}

export function AppLayout({
  routes: registered,
}: AppLayoutProps): ReactElement {
  // The browser decides what it renders; this tells the server the same language so its messages match.
  useSyncServerLocale();

  const { t } = useTranslation();
  const { pathname } = useLocation();
  // The router already gathers settings pages under the Settings group; a layout given the registered routes does too.
  const routes = useMemo(() => withSettingsShell(registered), [registered]);
  const { items, denied, loading } = useRouteNavigation(routes);
  const access = useMemo(() => ({ denied, loading }), [denied, loading]);
  useRememberSettingsReturn();
  // Settings pages replace the application's menu with their own, the way back first; elsewhere the single Settings
  // entry stands apart at the bottom of the menu.
  const inSettings = isSettingsPath(pathname);
  const settingsItems = useMemo(
    () =>
      inSettings && !loading ? buildSettingsNavigation(routes, denied) : [],
    [inSettings, loading, routes, denied],
  );
  const settingsEntry = items.filter(
    (item) => item.route.name === SETTINGS_HOME,
  );
  const menuItems = inSettings
    ? settingsItems
    : items.filter((item) => item.route.name !== SETTINGS_HOME);
  const selectedKey = selectedNavigationId(
    routes,
    pathname,
    denied,
    inSettings ? settingsItems : undefined,
  );
  const navigationLabel = inSettings
    ? t('settings.navigation', { defaultValue: 'Settings navigation' })
    : t('navigation.label', { defaultValue: 'Application navigation' });

  return (
    // The shell owns the business route tree used by its pages and navigation.
    <RouteTreeProvider routes={routes} access={access}>
      <PageBreadcrumbProvider>
        <AppSidebarProvider>
          <AppSidebar label={navigationLabel} footer={<AppSidebarFooter />}>
            {inSettings ? <SettingsBack /> : null}
            <NavigationMenu
              items={menuItems}
              label={navigationLabel}
              selectedKey={selectedKey}
            />
            {!inSettings && settingsEntry.length ? (
              <div className='mt-auto'>
                <NavigationMenu
                  items={settingsEntry}
                  label={t('settings.title')}
                  selectedKey={undefined}
                />
              </div>
            ) : null}
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
            <main className='app-brand-surface relative isolate min-w-0 flex-1 overflow-hidden'>
              <BrandWatermark className='-z-10' />
              {/* main only positions; the page scrolls in here, so a child page layer laid over main is neither
            moved by the page's scrolling nor stretched by its height. */}
              <div className='h-full overflow-y-auto'>
                <RouteLeaveBoundary hidden={loading}>
                  <Outlet />
                </RouteLeaveBoundary>
              </div>
            </main>
          </div>
        </AppSidebarProvider>
      </PageBreadcrumbProvider>
    </RouteTreeProvider>
  );
}
