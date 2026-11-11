import {
  GuestAuthentication,
  RequiredAuthentication,
} from '@nocobase/app-plugin-authentication/client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { useMemo, type ReactElement } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router';

import { AppLayout } from '../layouts/app-layout.js';
import { filterRouteTree } from './route-navigation.js';
import { renderRouteTree } from './route-tree.js';
import { StandalonePageLayout } from './standalone-page-layout.js';
import { SessionPreparation } from './session-preparation.js';

export interface AppRouterProps {
  readonly clientRoutes: readonly AppClientRegisteredRoute[];
}

export function AppRouter({ clientRoutes }: AppRouterProps): ReactElement {
  const routeGroups = useMemo(
    () => ({
      guest: clientRoutes.filter((route) => route.auth === 'guest'),
      optional: clientRoutes.filter((route) => route.auth === 'optional'),
      required: filterRouteTree(
        clientRoutes,
        (route) => route.auth === 'required',
      ),
    }),
    [clientRoutes],
  );

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

      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}
