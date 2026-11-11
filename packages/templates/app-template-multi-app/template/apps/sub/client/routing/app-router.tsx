import {
  GuestAuthentication,
  useAuthentication,
} from '@nocobase/app-plugin-authentication/client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { useMemo, type ReactElement, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router';

import { filterRouteTree } from './route-navigation.js';

import { AppLayout } from '../layouts/app-layout.js';
import { renderRouteTree } from './route-tree.js';
import { StandalonePageLayout } from './standalone-page-layout.js';
import { SessionPreparation } from './session-preparation.js';

// Keep the requested page and signed OIDC query when asking a guest to sign in.
function RequiredAuthentication({
  children,
}: {
  children: ReactNode;
}): ReactElement | null {
  const { session, isPending } = useAuthentication(),
    location = useLocation();
  if (isPending) return null;
  if (!session)
    return (
      <Navigate
        replace
        to={
          '/login?' +
          new URLSearchParams({
            redirect: location.pathname + location.search + location.hash,
          }).toString()
        }
      />
    );
  return <>{children}</>;
}

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
