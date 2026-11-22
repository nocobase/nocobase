import {
  PageBreadcrumbProvider,
  PersonalSettingsDialogRoutes,
  usePersonalSettingsNavigation,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo } from 'react';
import { Route, Routes, useLocation } from 'react-router';

import { Dialog, DialogContent, DialogTitle } from '#components/ui/dialog';
import PersonalSettingsHomePage from '../pages/me/personal-settings-home.js';
import { NavigationMenu } from '../layouts/components/navigation-menu.js';
import {
  useRouteAccess,
  useRouteTree,
  RouteTreeProvider,
} from './route-context.js';
import { RouteLeaveBoundary } from './route-leave-boundary.js';
import {
  buildPersonalSettingsNavigation,
  selectedNavigationId,
} from './route-navigation.js';
import { renderRouteTree } from './route-tree.js';
import { isPersonalSettingsShell } from './settings-shell.js';

export function PersonalSettingsDialog() {
  const { isOpen, close } = usePersonalSettingsNavigation();
  const { t } = useTranslation();
  if (!isOpen) return null;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className='flex h-dvh max-h-dvh w-full max-w-full flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-[min(44rem,85dvh)] sm:max-w-[min(64rem,95vw)] sm:flex-row sm:rounded-xl'>
        <PersonalSettingsDialogRoutes>
          <DialogBody title={t('settings.personal.title')} />
        </PersonalSettingsDialogRoutes>
      </DialogContent>
    </Dialog>
  );
}

function DialogBody({ title }: { readonly title: string }) {
  const routes = useRouteTree();
  const access = useRouteAccess();
  const { pathname } = useLocation();
  const items = useMemo(
    () =>
      access.loading
        ? []
        : buildPersonalSettingsNavigation(routes, access.denied),
    [access, routes],
  );
  const personalRoutes = useMemo(
    () => renderRouteTree(routes.filter(isPersonalSettingsShell)),
    [routes],
  );
  return (
    <RouteTreeProvider routes={routes} access={access}>
      <PageBreadcrumbProvider>
        <div className='max-h-[35dvh] shrink-0 overflow-y-auto border-b p-2 sm:max-h-full sm:w-52 sm:border-r sm:border-b-0'>
          <DialogTitle className='px-2 pt-3 pb-4'>{title}</DialogTitle>
          <NavigationMenu
            items={items}
            label={title}
            selectedKey={selectedNavigationId(
              routes,
              pathname,
              access.denied,
              items,
            )}
          />
        </div>
        <section className='relative isolate min-h-0 min-w-0 flex-1 overflow-hidden'>
          <div className='h-full overflow-y-auto pt-6'>
            <RouteLeaveBoundary hidden={access.loading}>
              <Routes>
                {personalRoutes}
                <Route path='*' element={<PersonalSettingsHomePage />} />
              </Routes>
            </RouteLeaveBoundary>
          </div>
        </section>
      </PageBreadcrumbProvider>
    </RouteTreeProvider>
  );
}
