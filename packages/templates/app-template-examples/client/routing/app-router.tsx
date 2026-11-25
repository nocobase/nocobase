import {
  GuestAuthentication,
  RequiredAuthentication,
} from '@nocobase/app-plugin-authentication/client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { useMemo, type ReactElement } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router';

import { AppLayout } from '../layouts/app-layout.js';
import { withSettingsShell } from './settings-shell.js';
import { filterRouteTree, matchRouteTree } from './route-navigation.js';
import { renderRouteTree } from './route-tree.js';
import { StandalonePageLayout } from './standalone-page-layout.js';
import { SessionPreparation } from './session-preparation.js';
import { SettingsRedirect } from './settings-redirect.js';
import { SETTINGS_REDIRECTS } from '#lib/settings-redirects';

export interface AppRouterProps {
  readonly clientRoutes: readonly AppClientRegisteredRoute[];
}

function hasStandaloneRoutes(
  routes: readonly AppClientRegisteredRoute[],
): boolean {
  return routes.some(
    (route) =>
      route.layout === 'none' ||
      (route.children && hasStandaloneRoutes(route.children)),
  );
}

function RequiredPageLayout({
  routes,
}: {
  readonly routes: readonly AppClientRegisteredRoute[];
}): ReactElement {
  const { pathname } = useLocation();
  // Select the layout from the same route tree that renders the pages, preserving match priority across layouts.
  const standalone = matchRouteTree(routes, pathname)?.some(
    ({ route }) => route.componentLoader && route.layout === 'none',
  );
  return standalone ? <StandalonePageLayout /> : <AppLayout routes={routes} />;
}

export function AppRouter({ clientRoutes }: AppRouterProps): ReactElement {
  const routeGroups = useMemo(() => {
    // Settings pages render in the same shell, under the application's own Settings group.
    const routes = withSettingsShell(clientRoutes);
    const required = filterRouteTree(
      routes,
      (route) => route.auth === 'required',
    );
    return {
      guest: routes.filter((route) => route.auth === 'guest'),
      optional: routes.filter((route) => route.auth === 'optional'),
      required,
      hasStandalone: hasStandaloneRoutes(required),
    };
  }, [clientRoutes]);

  return (
    <Routes>
      <Route
        element={
          <RequiredAuthentication>
            <SessionPreparation>
              <Outlet />
            </SessionPreparation>
          </RequiredAuthentication>
        }
      >
        <Route
          element={
            routeGroups.hasStandalone ? (
              <RequiredPageLayout routes={routeGroups.required} />
            ) : (
              <AppLayout routes={routeGroups.required} />
            )
          }
        >
          {renderRouteTree(routeGroups.required)}
        </Route>
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

      {/* Settings pages moved under `/settings` keep their former URLs (`#lib/settings-redirects`). */}
      {clientRoutes.some((route) => route.surface === 'systemSettings') &&
        SETTINGS_REDIRECTS.map(([from]) => (
          // `/users/*` also matches `/users` itself.
          <Route key={from} path={`${from}/*`} element={<SettingsRedirect />} />
        ))}

      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}
