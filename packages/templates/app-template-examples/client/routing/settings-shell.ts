import {
  isPersonalSettingsRoute,
  isSystemSettingsRoute,
  PERSONAL_SETTINGS_ROUTE_PATH,
  SYSTEM_SETTINGS_ROUTE_PATH,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import { Settings, UserRound } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation } from 'react-router';

/** The application's own group holding every system settings route, named like the navigation helpers expect. */
export const SETTINGS_SHELL_GROUP = 'settings';

/** The application's own group holding every personal settings route. */
export const PERSONAL_SETTINGS_SHELL_GROUP = 'personalSettings';

interface ShellSpec {
  readonly name: string;
  readonly path: string;
  readonly title: string;
  readonly icon: typeof Settings;
  readonly authz: AppClientRegisteredRoute['authz'];
  readonly order: number;
  readonly belongs: (
    route: Pick<AppClientRegisteredRoute, 'surface'>,
  ) => boolean;
  readonly surface: NonNullable<AppClientRegisteredRoute['surface']>;
}

const SHELLS: readonly ShellSpec[] = [
  {
    name: SETTINGS_SHELL_GROUP,
    path: SYSTEM_SETTINGS_ROUTE_PATH,
    title: 'settings.title',
    icon: Settings,
    authz: 'unrestricted',
    order: 100,
    belongs: isSystemSettingsRoute,
    surface: 'systemSettings',
  },
  {
    name: PERSONAL_SETTINGS_SHELL_GROUP,
    path: PERSONAL_SETTINGS_ROUTE_PATH,
    title: 'settings.personal.title',
    icon: UserRound,
    authz: 'skip',
    order: 110,
    belongs: isPersonalSettingsRoute,
    surface: 'personalSettings',
  },
];

/**
 * Gathers the system settings routes into one application-owned group at `/settings`, and the personal settings routes
 * into another at `/me`. Each group carries its title, icon and breadcrumb in the application's own locale namespace
 * (that of its routes). The registered routes stay as they are; only the tree the router, menus and breadcrumbs read
 * gains these parents.
 */
export function withSettingsShell(
  routes: readonly AppClientRegisteredRoute[],
): readonly AppClientRegisteredRoute[] {
  // The application's own namespace holds the entries' titles; every application declares routes of its own.
  const packageName = routes.find(
    (route) => route.source === 'application',
  )?.packageName;
  if (!packageName) return routes;
  let result = routes;
  for (const spec of SHELLS) {
    // Already gathered: the shell is the only route of its surface left at the root.
    if (result.some((route) => isShell(route, spec))) continue;
    const members = result.filter(spec.belongs);
    if (!members.length) continue;
    const shell: AppClientRegisteredRoute = Object.freeze({
      id: `${packageName}:${spec.name}`,
      name: spec.name,
      path: spec.path,
      auth: 'required',
      authz: spec.authz,
      packageName,
      source: 'application',
      surface: spec.surface,
      navigation: Object.freeze({
        title: spec.title,
        icon: spec.icon,
        order: spec.order,
      }),
      breadcrumb: Object.freeze({ title: spec.title }),
      children: Object.freeze(members),
    });
    result = Object.freeze([
      ...result.filter((route) => !spec.belongs(route)),
      shell,
    ]);
  }
  return result;
}

function isShell(route: AppClientRegisteredRoute, spec: ShellSpec): boolean {
  return (
    spec.belongs(route) &&
    route.source === 'application' &&
    route.name === spec.name &&
    !route.componentLoader
  );
}

/** Whether a route is the application's personal settings group (`withSettingsShell`). */
export function isPersonalSettingsShell(
  route: AppClientRegisteredRoute,
): boolean {
  return isShell(route, SHELLS[1]);
}

const RETURN_KEY = 'nocobase:settings-return-to';

function isUnder(pathname: string, base: string): boolean {
  const lower = pathname.toLowerCase();
  return lower === base || lower.startsWith(`${base}/`);
}

/** Whether a location is a system settings page: everything under `/settings`. */
export function isSettingsPath(pathname: string): boolean {
  return isUnder(pathname, SYSTEM_SETTINGS_ROUTE_PATH);
}

/** Whether a location is a personal settings page: everything under `/me`. */
export function isPersonalSettingsPath(pathname: string): boolean {
  return isUnder(pathname, PERSONAL_SETTINGS_ROUTE_PATH);
}

/** Whether a location is any settings page, system or personal. */
export function isAnySettingsPath(pathname: string): boolean {
  return isSettingsPath(pathname) || isPersonalSettingsPath(pathname);
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
 * Remembers the last application page outside settings, in this tab, so leaving settings returns to it. Moving between
 * system and personal settings keeps it. A settings page opened directly has nothing to return to and leads to the
 * home page.
 */
export function useRememberSettingsReturn(): void {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    if (isAnySettingsPath(pathname)) return;
    try {
      sessionStorage.setItem(RETURN_KEY, `${pathname}${search}${hash}`);
    } catch {
      // Storage can be unavailable, as in a private window; Back then leads home.
    }
  }, [pathname, search, hash]);
}
