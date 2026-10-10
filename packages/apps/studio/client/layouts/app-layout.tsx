import { PageBreadcrumbProvider } from '@nocobase/app-client';
import { useSyncServerLocale } from '@nocobase/app-plugin-i18n/client';
import type { ReactElement } from 'react';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { Outlet, useLocation } from 'react-router';

import { AccountSettingsDialog } from '../account/account-dialog.js';
import { useUserPreferencesSync } from '../account/preferences-sync.js';
import { isSettingsPath } from '../pages/config/sections.js';
import { StudioChat } from '../agents/chat.js';
import { RouteTreeProvider } from '../routing/route-context.js';
import { ChatPanel } from '@/extensions/nocobase-agent-chat/chat-panel';
import { ChatFloatingButton } from '@/extensions/nocobase-agent-chat/launchers';
import { Breadcrumbs } from '@/components/breadcrumbs';

import { useTranslation } from '@nocobase/i18n/client';
import { LayoutHeader } from './components/layout-header.js';
import {
  AppSidebar,
  AppSidebarFooter,
  AppSidebarProvider,
  AppSidebarToggle,
} from './components/app-sidebar.js';
import { NavigationMenu } from './components/navigation-menu.js';
import { AppBrand } from './components/app-brand.js';
import { HeaderActions } from './components/header-actions.js';
import { SettingsNavigation } from './components/settings-navigation.js';
import {
  ReturnLocationsContext,
  useTrackReturnLocations,
} from './return-locations.js';
import {
  useRouteNavigation,
  selectedNavigationId,
} from '../routing/route-navigation.js';

export interface AppLayoutProps {
  readonly routes: readonly AppClientRegisteredRoute[];
}

export function AppLayout({ routes }: AppLayoutProps): ReactElement {
  // The browser decides what it renders; this tells the server the same language so its messages match.
  useSyncServerLocale();
  // The person's language and theme follow them from the server (`account/preferences-sync.ts`).
  useUserPreferencesSync();

  const { t } = useTranslation();
  const { items: menuItems, denied } = useRouteNavigation(routes);
  const location = useLocation();
  const { pathname } = location;
  const returnLocations = useTrackReturnLocations(location);
  // Inside the workspace settings the sidebar shows their navigation instead of the app's.
  const inSettings = isSettingsPath(pathname);
  const selectedKey = selectedNavigationId(routes, pathname, denied);
  // The home page's composer and a full-page conversation are where the person talks to an agent already; the
  // floating launcher would only sit on their send button.
  const conversationPage = pathname === '/' || pathname.startsWith('/chat/');

  return (
    // The shell owns the business route tree used by its pages and navigation.
    <RouteTreeProvider routes={routes}>
      <PageBreadcrumbProvider>
        <ReturnLocationsContext.Provider value={returnLocations}>
          {/* The agents' chat panel (the UI Library's agent-chat block, in extensions/nocobase-agent-chat): its provider
          spans the routes so it survives page changes (agents/chat.tsx). */}
          <StudioChat>
            <AppSidebarProvider>
              <AppSidebar footer={<AppSidebarFooter />}>
                {inSettings ? (
                  <SettingsNavigation />
                ) : (
                  // Top-level groups render as labelled, always-open sections (navigation-menu.tsx).
                  <NavigationMenu
                    items={menuItems}
                    label={t('navigation.label', {
                      defaultValue: 'Application navigation',
                    })}
                    sections
                    selectedKey={selectedKey}
                  />
                )}
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
                  <HeaderActions />
                </LayoutHeader>
                {/* The chat panel docks beside main on wide screens and floats over it (or covers it) otherwise, so main
          and the panel share a positioned row. */}
                <div className='relative flex min-h-0 min-w-0 flex-1'>
                  <main className='relative min-w-0 flex-1 overflow-hidden'>
                    {/* main only positions; the page scrolls in here, so a child page layer laid over main is neither
              moved by the page's scrolling nor stretched by its height. */}
                    <div className='h-full overflow-y-auto'>
                      <Outlet />
                    </div>
                  </main>
                  <ChatPanel />
                </div>
              </div>
            </AppSidebarProvider>
            {conversationPage ? null : <ChatFloatingButton />}
            {/* The person's own settings open over any page (`?account=<category>`). */}
            <AccountSettingsDialog />
          </StudioChat>
        </ReturnLocationsContext.Provider>
      </PageBreadcrumbProvider>
    </RouteTreeProvider>
  );
}
