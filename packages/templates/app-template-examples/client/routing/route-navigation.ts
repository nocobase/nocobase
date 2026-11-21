import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  useAuthorizationRevision,
  useAuthorizationClient,
  type AuthorizationRequirement,
} from '@nocobase/app-plugin-authorization/client';
import { useEffect, useMemo, useState } from 'react';
import { matchPath, matchRoutes, type RouteObject } from 'react-router';

import { EMPTY_ARRAY } from '#lib/constants';
import {
  isPersonalSettingsShell,
  withSettingsShell,
} from './settings-shell.js';
import {
  organizeNavigation,
  settingsCatalog,
  settingsNavigation,
  type SettingsCategory,
  type SettingsModule,
} from '#lib/navigation-transform';

export interface RouteNavigationItem {
  /** Begin a separate sidebar group before this entry. */
  readonly startGroup?: boolean;
  /** Route keys represented by a single sidebar entry whose content uses tabs. */
  readonly activeRouteKeys?: readonly string[];
  readonly section?: boolean;
  readonly route: AppClientRegisteredRoute;
  readonly children: readonly RouteNavigationItem[];
}

/**
 * Navigation helpers take the registered routes as they are or already gathered (`withSettingsShell`): settings pages
 * always appear under the application's Settings group.
 */
export function buildRouteNavigation(
  registered: readonly AppClientRegisteredRoute[],
  denied: ReadonlySet<string>,
): RouteNavigationItem[] {
  const routes = withSettingsShell(registered);
  // Personal settings open from the account menu, never from the application's menu.
  return organizeNavigation(
    visibleRouteNavigation(routes, denied).filter(
      (item) => !isPersonalSettingsShell(item.route),
    ),
  );
}

/** The settings home's categories and modules the viewer may open (`settingsCatalog`). */
export function buildSettingsCatalog(
  registered: readonly AppClientRegisteredRoute[],
  denied: ReadonlySet<string>,
): SettingsCategory[] {
  const routes = withSettingsShell(registered);
  return settingsCatalog(visibleRouteNavigation(routes, denied));
}

/** The settings navigation (`settingsNavigation`) the viewer may open. */
export function buildSettingsNavigation(
  registered: readonly AppClientRegisteredRoute[],
  denied: ReadonlySet<string>,
): RouteNavigationItem[] {
  const routes = withSettingsShell(registered);
  return settingsNavigation(buildSettingsCatalog(routes, denied), routes);
}

/**
 * The personal settings navigation the viewer may open: each category under the application's personal settings group a
 * headed section, each page or module one entry, laid out like the system settings navigation.
 */
export function buildPersonalSettingsNavigation(
  registered: readonly AppClientRegisteredRoute[],
  denied: ReadonlySet<string>,
): RouteNavigationItem[] {
  const routes = withSettingsShell(registered);
  const personal = visibleRouteNavigation(routes, denied).find((item) =>
    isPersonalSettingsShell(item.route),
  );
  if (!personal) return [];
  const catalog: SettingsCategory[] = [];
  const loose: SettingsModule[] = [];
  for (const child of personal.children) {
    if (child.route.componentLoader) loose.push(...toModules(child));
    else
      catalog.push({
        route: child.route,
        modules: child.children.flatMap(toModules),
      });
  }
  if (loose.length) catalog.push({ route: personal.route, modules: loose });
  return settingsNavigation(
    catalog.filter((category) => category.modules.length > 0),
    routes,
  );
}

function toModules(item: RouteNavigationItem): SettingsModule[] {
  if (item.route.componentLoader)
    return [{ route: item.route, target: item.route }];
  const target = firstNavigationPage(item.children);
  return target ? [{ route: item.route, target }] : [];
}

/** The first page in a navigation, such as where a settings area's root leads. */
export function firstNavigationPage(
  items: readonly RouteNavigationItem[],
): AppClientRegisteredRoute | undefined {
  for (const item of items) {
    if (item.route.componentLoader) return item.route;
    const nested = firstNavigationPage(item.children);
    if (nested) return nested;
  }
  return undefined;
}

function visibleRouteNavigation(
  routes: readonly AppClientRegisteredRoute[],
  denied: ReadonlySet<string>,
): RouteNavigationItem[] {
  return routes.flatMap((route) => {
    if (denied.has(routeKey(route))) return [];
    const children = visibleRouteNavigation(
      route.children ?? EMPTY_ARRAY,
      denied,
    );
    return route.navigation && (route.componentLoader || children.length)
      ? [{ route, children }]
      : children;
  });
}

export function selectedNavigationId(
  registered: readonly AppClientRegisteredRoute[],
  pathname: string,
  denied: ReadonlySet<string> = new Set(),
  /** The menu the selection is for; defaults to the application's navigation. */
  items: readonly RouteNavigationItem[] = buildRouteNavigation(
    registered,
    denied,
  ),
): string | undefined {
  const routes = withSettingsShell(registered);
  const matches = matchRouteTree(routes, pathname);
  const represented = (
    nodes: readonly RouteNavigationItem[],
  ): AppClientRegisteredRoute | undefined => {
    for (const item of nodes) {
      if (
        item.activeRouteKeys?.some((key) =>
          matches?.some(({ route }) => routeKey(route) === key),
        )
      )
        return item.route;
      const child = represented(item.children);
      if (child) return child;
    }
    return undefined;
  };
  const active = represented(items);
  if (active) return routeKey(active);
  const pages = navigationPages(items);
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

function navigationPages(
  items: readonly RouteNavigationItem[],
): AppClientRegisteredRoute[] {
  return items.flatMap(({ route, children }) => [
    ...(route.componentLoader ? [route] : []),
    ...navigationPages(children),
  ]);
}

const NONE_DENIED: ReadonlySet<string> = new Set();

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
  // A stable empty set keeps consumers that memoize on `denied` from recomputing on every render.
  const denied = (guards.length && result?.denied) || NONE_DENIED;
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
  const toMatch = (
    nodes: readonly AppClientRegisteredRoute[],
    parentPath = '',
  ): RouteObject[] =>
    nodes.map((route) => ({
      path: relativeRoutePath(route, parentPath),
      handle: route,
      children: toMatch(
        route.children ?? EMPTY_ARRAY,
        childRouteParentPath(route, parentPath),
      ),
    }));
  return matchRoutes(toMatch(routes), pathname)?.map((match) => ({
    ...match,
    route: match.route.handle as AppClientRegisteredRoute,
  }));
}

/**
 * A registered route's path relative to its parent's, as the router nests it. Registered paths are absolute; a route at
 * its parent's own path (a group's home page, a pathless group) nests with an empty path.
 */
export function relativeRoutePath(
  route: AppClientRegisteredRoute,
  parentPath: string,
): string {
  if (!parentPath) return route.path;
  if (
    route.path === parentPath ||
    parentPath.startsWith(`${route.path.replace(/\/$/, '')}/`)
  )
    return '';
  return route.path.slice(parentPath === '/' ? 1 : parentPath.length + 1);
}

/** The path a route's children are relative to. */
export function childRouteParentPath(
  route: AppClientRegisteredRoute,
  parentPath: string,
): string {
  return parentPath.startsWith(`${route.path.replace(/\/$/, '')}/`)
    ? parentPath
    : route.path;
}

export function routeKey(route: AppClientRegisteredRoute): string {
  return `${route.packageName}:${route.path}:${route.id}`;
}

/** Pure groups can span shells; a page and its descendants always share their shell. */
export function filterRouteTree(
  routes: readonly AppClientRegisteredRoute[],
  predicate: (route: AppClientRegisteredRoute) => boolean,
): AppClientRegisteredRoute[] {
  return routes.flatMap((route) => {
    if (route.componentLoader) return predicate(route) ? [route] : [];
    const children = filterRouteTree(route.children ?? EMPTY_ARRAY, predicate);
    // A group declared empty, such as a settings category waiting for modules, stays so its title is still known.
    return children.length || !route.children?.length
      ? [{ ...route, children }]
      : [];
  });
}
