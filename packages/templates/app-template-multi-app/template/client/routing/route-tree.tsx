import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import type { ReactElement } from 'react';
import { Outlet, Route } from 'react-router';

import { EMPTY_ARRAY } from '#lib/constants';

import {
  childRouteParentPath,
  relativeRoutePath,
  routeKey,
} from './route-navigation.js';
import { ClientRoute } from './client-route.js';

/** Groups pass children through; pages deliberately own their Outlet placement. */
export function renderRouteTree(
  routes: readonly AppClientRegisteredRoute[],
  parentPath = '',
): ReactElement[] {
  return routes.map((route) => (
    <Route
      key={routeKey(route)}
      path={relativeRoutePath(route, parentPath)}
      element={
        route.componentLoader ? (
          <ClientRoute key={routeKey(route)} route={route} />
        ) : (
          <Outlet />
        )
      }
    >
      {renderRouteTree(
        route.children ?? EMPTY_ARRAY,
        childRouteParentPath(route, parentPath),
      )}
    </Route>
  ));
}
