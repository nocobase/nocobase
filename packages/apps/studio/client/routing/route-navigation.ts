import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  useAuthorizationRevision,
  useAuthorizationClient,
  type AuthorizationRequirement,
} from '@nocobase/app-plugin-authorization/client';
import { useEffect, useMemo, useState } from 'react';
import { matchPath, matchRoutes, type RouteObject } from 'react-router';

import { EMPTY_ARRAY } from '@/lib/constants';

export interface RouteNavigationItem {
  readonly route: AppClientRegisteredRoute;
  readonly children: readonly RouteNavigationItem[];
}

export function buildRouteNavigation(
  routes: readonly AppClientRegisteredRoute[],
  denied: ReadonlySet<string>,
): RouteNavigationItem[] {
  return routes.flatMap((route) => {
    if (denied.has(routeKey(route))) return [];
    const children = buildRouteNavigation(
      route.children ?? EMPTY_ARRAY,
      denied,
    );
    return route.navigation && (route.componentLoader || children.length)
      ? [{ route, children }]
      : children;
  });
}

export function selectedNavigationId(
  routes: readonly AppClientRegisteredRoute[],
  pathname: string,
  denied: ReadonlySet<string> = new Set(),
): string | undefined {
  const matches = matchRouteTree(routes, pathname);
  const pages = navigationPages(buildRouteNavigation(routes, denied));
  const visible = new Set(pages.map(routeKey));
  const selected =
    matches
      ?.map(({ route }) => route)
      .reverse()
      .find(
        (route) =>
          route.componentLoader &&
          route.navigation &&
          visible.has(routeKey(route)),
      ) ??
    (matches
      ? undefined
      : pages
          .filter((route) =>
            matchPath({ path: route.path, end: false }, pathname),
          )
          .sort((a, b) => b.path.length - a.path.length)[0]);
  return selected ? routeKey(selected) : undefined;
}

export function navigationPages(
  items: readonly RouteNavigationItem[],
): AppClientRegisteredRoute[] {
  return items.flatMap(({ route, children }) => [
    ...(route.componentLoader ? [route] : []),
    ...navigationPages(children),
  ]);
}

export function useRouteNavigation(
  routes: readonly AppClientRegisteredRoute[],
) {
  const client = useAuthorizationClient();
  // Recheck mounted menus after session or realtime permission invalidation.
  const revision = useAuthorizationRevision();
  const guards = useMemo(() => {
    const collect = (
      nodes: readonly AppClientRegisteredRoute[],
    ): { id: string; check: AuthorizationRequirement }[] =>
      // `unrestricted` pages are checked like any other: hidden unless the snapshot is unrestricted.
      nodes.flatMap((route) => [
        ...(route.componentLoader && route.authz !== 'skip'
          ? [{ id: routeKey(route), check: route.authz }]
          : []),
        ...collect(route.children ?? EMPTY_ARRAY),
      ]);
    return collect(routes);
  }, [routes]);
  const [result, setResult] = useState<{
    client: typeof client;
    guards: typeof guards;
    revision: number;
    denied: ReadonlySet<string>;
  }>();
  useEffect(() => {
    if (!guards.length) return;
    let active = true;
    void Promise.all(
      guards.map(async ({ id, check }) => {
        try {
          return (await client.can(check)) ? undefined : id;
        } catch {
          return id;
        }
      }),
    ).then((ids) => {
      if (active)
        setResult({
          client,
          guards,
          revision,
          denied: new Set(ids.filter((id) => id !== undefined)),
        });
    });
    return () => {
      active = false;
    };
  }, [client, guards, revision]);
  const loading = Boolean(
    guards.length &&
    (result?.client !== client ||
      result.guards !== guards ||
      result.revision !== revision),
  );
  const denied = guards.length
    ? (result?.denied ?? new Set<string>())
    : new Set<string>();
  return {
    loading,
    items: loading ? [] : buildRouteNavigation(routes, denied),
    denied,
  };
}

export function matchRouteTree(
  routes: readonly AppClientRegisteredRoute[],
  pathname: string,
) {
  const toMatch = (nodes: readonly AppClientRegisteredRoute[]): RouteObject[] =>
    nodes.map((route) => ({
      path: route.path,
      handle: route,
      children: toMatch(route.children ?? EMPTY_ARRAY),
    }));
  return matchRoutes(toMatch(routes), pathname)?.map((match) => ({
    ...match,
    route: match.route.handle as AppClientRegisteredRoute,
  }));
}

export function routeKey(route: AppClientRegisteredRoute): string {
  return `${route.packageName}:${route.path}:${route.id}`;
}
