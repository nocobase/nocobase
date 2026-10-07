import { useTranslation } from '@nocobase/i18n/client';
import {
  GuestAuthentication,
  RequiredAuthentication,
} from '@nocobase/app-plugin-authentication/client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { lazy, Suspense, useMemo, type ReactElement } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router';

import { Loading } from '@/components/loading';
import { EMPTY_ARRAY } from '@/lib/constants';

import { AppLayout } from '../layouts/app-layout.js';
import { renderRouteTree } from './route-tree.js';
import { StandalonePageLayout } from './standalone-page-layout.js';

// The settings centre brings its own chrome and navigation, none of which the application needs until someone opens
// it. Loading it lazily keeps it out of the entry chunk, the same way every page it hosts stays out.
const SettingsLayout = lazy(async () => ({
  default: (await import('../layouts/settings-layout.js')).SettingsLayout,
}));

export interface AppRouterProps {
  readonly settingsRouteTree: readonly AppClientRegisteredRoute[];
  readonly devRouteTree: readonly AppClientRegisteredRoute[];
  readonly clientRoutes: readonly AppClientRegisteredRoute[];
}

export function AppRouter(inputProps: AppRouterProps): ReactElement {
  const { t } = useTranslation();
  const { settingsRouteTree, devRouteTree, clientRoutes } = inputProps;

  const settingsRoutes = useMemo(
    () =>
      filterRouteTree(
        clientRoutes,
        (route) =>
          route.auth === 'required' && route.path.startsWith('/settings/'),
      ),
    [clientRoutes],
  );
  const routeGroups = useMemo(
    () => ({
      guest: clientRoutes.filter((route) => route.auth === 'guest'),
      optional: clientRoutes.filter((route) => route.auth === 'optional'),
      required: filterRouteTree(
        clientRoutes,
        (route) =>
          route.auth === 'required' && !route.path.startsWith('/settings/'),
      ),
    }),
    [clientRoutes],
  );

  return (
    <Routes>
      <Route
        element={
          <RequiredAuthentication>
            <Outlet />
          </RequiredAuthentication>
        }
      >
        <Route
          element={
            <AppLayout routes={routeGroups.required} devRoutes={devRouteTree} />
          }
        >
          {renderRouteTree(routeGroups.required)}
          {/* Pages plugins declare with `defineDevRoutes()` keep their `/dev/...` paths inside the application shell.
            A production build resolves no dev routes, so nothing is rendered here. */}
          {renderRouteTree(devRouteTree)}
        </Route>
        <Route
          path='/settings/*'
          element={
            <Suspense
              fallback={
                <Loading
                  className='min-h-svh'
                  label={t('status.loadingSettings', {
                    defaultValue: 'Loading settings',
                  })}
                />
              }
            >
              <SettingsLayout
                routeTree={settingsRouteTree}
                routes={settingsRoutes}
              />
            </Suspense>
          }
        />
      </Route>

      <Route
        element={
          <GuestAuthentication>
            <Outlet />
          </GuestAuthentication>
        }
      >
        <Route element={<StandalonePageLayout />}>
          {renderRouteTree(routeGroups.guest)}
        </Route>
      </Route>

      <Route element={<StandalonePageLayout />}>
        {renderRouteTree(routeGroups.optional)}
      </Route>

      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

/** Pure groups can span surfaces; a page and its descendants always share their shell. */
function filterRouteTree(
  routes: readonly AppClientRegisteredRoute[],
  predicate: (route: AppClientRegisteredRoute) => boolean,
): AppClientRegisteredRoute[] {
  return routes.flatMap((route) => {
    if (route.componentLoader) return predicate(route) ? [route] : [];
    const children = filterRouteTree(route.children ?? EMPTY_ARRAY, predicate);
    return children.length ? [{ ...route, children }] : [];
  });
}
