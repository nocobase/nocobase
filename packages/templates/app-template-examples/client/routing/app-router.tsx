import {
  GuestAuthentication,
  RequiredAuthentication,
} from '@nocobase/app-plugin-authentication/client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { useMemo, type ReactElement } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router';

import { EMPTY_ARRAY } from '#lib/constants';

import { AppLayout } from '../layouts/app-layout.js';
import { renderRouteTree } from './route-tree.js';
import { StandalonePageLayout } from './standalone-page-layout.js';

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
            <Outlet />
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

/** Pure groups can span shells; a page and its descendants always share their shell. */
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
