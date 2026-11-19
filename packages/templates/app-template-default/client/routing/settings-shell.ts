import {
  isSettingsRoute,
  SETTINGS_ROUTE_PATH,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import { Settings } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation } from 'react-router';

/** The application's own group holding every settings route, named like the navigation helpers expect. */
export const SETTINGS_SHELL_GROUP = 'settings';

/**
 * Gathers the settings routes into one application-owned group at `/settings`, which carries the entry's title, icon
 * and breadcrumb in the application's own locale namespace (that of its routes). The registered routes stay as they are; only the tree the
 * router, menus and breadcrumbs read gains this parent.
 */
export function withSettingsShell(
  routes: readonly AppClientRegisteredRoute[],
): readonly AppClientRegisteredRoute[] {
  // Already gathered: the shell is the only settings route left at the root.
  if (routes.some(isShell)) return routes;
  const settings = routes.filter(isSettingsRoute);
  // The application's own namespace holds the entry's title; every application declares routes of its own.
  const packageName = routes.find(
    (route) => route.source === 'application',
  )?.packageName;
  if (!settings.length || !packageName) return routes;
  const shell: AppClientRegisteredRoute = Object.freeze({
    id: `${packageName}:${SETTINGS_SHELL_GROUP}`,
    name: SETTINGS_SHELL_GROUP,
    path: SETTINGS_ROUTE_PATH,
    auth: 'required',
    authz: 'unrestricted',
    packageName,
    source: 'application',
    surface: 'settings',
    navigation: Object.freeze({
      title: 'settings.title',
      icon: Settings,
      order: 100,
    }),
    breadcrumb: Object.freeze({ title: 'settings.title' }),
    children: Object.freeze(settings),
  });
  return Object.freeze([
    ...routes.filter((route) => !isSettingsRoute(route)),
    shell,
  ]);
}

function isShell(route: AppClientRegisteredRoute): boolean {
  return (
    isSettingsRoute(route) &&
    route.source === 'application' &&
    route.name === SETTINGS_SHELL_GROUP &&
    !route.componentLoader
  );
}

const RETURN_KEY = 'nocobase:settings-return-to';

/** Whether a location is a settings page: everything under `/settings`. */
export function isSettingsPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return (
    lower === SETTINGS_ROUTE_PATH || lower.startsWith(`${SETTINGS_ROUTE_PATH}/`)
  );
}

/** Where leaving settings leads: the remembered page, or the home page. */
export function readSettingsReturn(): string {
  try {
    const value = sessionStorage.getItem(RETURN_KEY);
    // Only an in-application path, never another origin.
    return value?.startsWith('/') && !value.startsWith('//') ? value : '/';
  } catch {
    return '/';
  }
}

/**
 * Remembers the last application page outside settings, in this tab, so leaving settings returns to it. A settings
 * page opened directly has nothing to return to and leads to the home page.
 */
export function useRememberSettingsReturn(): void {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    if (isSettingsPath(pathname)) return;
    try {
      sessionStorage.setItem(RETURN_KEY, `${pathname}${search}${hash}`);
    } catch {
      // Storage can be unavailable, as in a private window; Back then leads home.
    }
  }, [pathname, search, hash]);
}
