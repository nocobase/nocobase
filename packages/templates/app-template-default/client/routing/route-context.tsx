import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { useLocation } from 'react-router';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import { EMPTY_ARRAY } from '#lib/constants';

import { matchRouteTree } from './route-navigation.js';

/* eslint-disable react-refresh/only-export-components -- provider and hooks are intentionally colocated */

/**
 * One level of the trail leading to the current page.
 *
 * `pathname` is the resolved URL rather than the registered pattern, so a level such as `/orders/:id` links to
 * where the user actually is. The route names itself: a level with no `breadcrumb` is structure rather than a
 * destination — a tab, an overlay, or a layer that exists only to share a layout — and consumers skip it.
 */
export interface RouteTrailEntry {
  readonly route: AppClientRegisteredRoute;
  readonly pathname: string;
}

const RouteSearchContext = createContext<ReadonlyMap<string, string>>(
  new Map(),
);

/** Queries belong to the page that was visited, never to a child currently covering it. */
export function useRouteSearches(): ReadonlyMap<string, string> {
  return useContext(RouteSearchContext);
}

const RouteTreeContext = createContext<readonly AppClientRegisteredRoute[]>([]);
export interface RouteTreeProviderProps extends PropsWithChildren {
  readonly routes: readonly AppClientRegisteredRoute[];
}

/**
 * Publishes the routes a page may be reached through, so anything below can work out where it is.
 *
 * It carries the tree rather than a trail derived from it: deriving is `useRouteTrail`'s job, which keeps the
 * derivation and the memo that guards it in one place. `routes` still has to keep its identity between renders,
 * since a new array re-renders every consumer; callers pass a memoised one.
 */
export function RouteTreeProvider({
  children,
  routes,
}: RouteTreeProviderProps): ReactElement {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/u, '') || '/';
  const search = location.search;
  const [visited, setVisited] = useState(() => ({
    pathname,
    search,
    queries: new Map([[pathname, search]]),
  }));
  let queries = visited.queries;
  if (visited.pathname !== pathname || visited.search !== search) {
    // Keep only the active ancestry. A fresh visit (including an empty query) replaces its old state.
    // Derive before rendering children so a detail never records its parameters against the parent.
    queries = new Map(
      [...queries].filter(([path]) =>
        pathname.startsWith(`${path.replace(/\/$/u, '')}/`),
      ),
    );
    queries.set(pathname, search);
    setVisited({ pathname, search, queries });
  }
  return (
    <RouteTreeContext.Provider value={routes}>
      <RouteSearchContext.Provider value={queries}>
        {children}
      </RouteSearchContext.Provider>
    </RouteTreeContext.Provider>
  );
}

/**
 * The trail of route levels leading to the current location.
 *
 * Every level the location matches is returned, structure included; whether a level is named, and what it is
 * called, is its route's own `breadcrumb`, which a consumer reads. A breadcrumb title states what kind of page a
 * level is rather than which record it is showing, so it is known before the page loads anything and the trail
 * never changes while the user waits.
 */
export function useRouteTrail(): readonly RouteTrailEntry[] {
  const routes = useContext(RouteTreeContext);
  const { pathname } = useLocation();

  return useMemo(
    () =>
      matchRouteTree(routes, pathname)?.map(
        ({ route, pathname: resolvedPathname }) => ({
          route,
          // matchRoutes decodes path segments (but keeps encoded slashes). Use only
          // its matched depth, taking the actual segments from the original URL.
          pathname:
            pathname
              .split('/')
              .slice(
                0,
                resolvedPathname === '/'
                  ? 1
                  : resolvedPathname.split('/').length,
              )
              .join('/') || '/',
        }),
      ) ?? EMPTY_ARRAY,
    [pathname, routes],
  );
}
