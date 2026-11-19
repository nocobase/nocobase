import {
  GuestAuthentication,
  RequiredAuthentication,
} from '@nocobase/app-plugin-authentication/client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { useMemo, type ReactElement } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router';

import { AppLayout } from '../layouts/app-layout.js';
import { withSettingsShell } from './settings-shell.js';
import { filterRouteTree } from './route-navigation.js';
import { renderRouteTree } from './route-tree.js';
import { StandalonePageLayout } from './standalone-page-layout.js';
import { SessionPreparation } from './session-preparation.js';
import { SettingsRedirect } from './settings-redirect.js';
import { SETTINGS_REDIRECTS } from '#lib/settings-redirects';

export interface AppRouterProps {
  readonly clientRoutes: readonly AppClientRegisteredRoute[];
}

export function AppRouter({ clientRoutes }: AppRouterProps): ReactElement {
  const routeGroups = useMemo(() => {
    // Settings pages render in the same shell, under the application's own Settings group.
    const routes = withSettingsShell(clientRoutes);
    return {
      guest: routes.filter((route) => route.auth === 'guest'),
      optional: routes.filter((route) => route.auth === 'optional'),
      required: filterRouteTree(routes, (route) => route.auth === 'required'),
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
        <Route element={<AppLayout routes={routeGroups.required} />}>
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
      {SETTINGS_REDIRECTS.map(([from]) => (
        // `/users/*` also matches `/users` itself.
        <Route key={from} path={`${from}/*`} element={<SettingsRedirect />} />
      ))}

      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}
