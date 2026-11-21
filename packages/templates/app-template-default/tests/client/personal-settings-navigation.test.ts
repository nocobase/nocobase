import {
  definePersonalSettingsRoutes,
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';
import personal from '../../client/pages/me/routes.js';
import settings from '../../client/pages/settings/routes.js';
import shell from '../../client/pages/settings/shell-routes.js';
import {
  buildPersonalSettingsNavigation,
  buildRouteNavigation,
  firstNavigationPage,
  routeKey,
  selectedNavigationId,
} from '../../client/routing/route-navigation.js';
import {
  isAnySettingsPath,
  isPersonalSettingsPath,
  isSettingsPath,
} from '../../client/routing/settings-shell.js';

const componentLoader = async () => ({ default: () => null });
const app = '@nocobase/app-template-default';

function resolve(...plugins: AppClientRouteContribution[]) {
  return resolveAppClientContributions([
    {
      packageName: app,
      source: 'application',
      routes: [shell, settings, personal],
    },
    ...plugins.map((routes) => ({ packageName: '@example/plugin', routes })),
  ]).routes;
}

function find(
  routes: readonly AppClientRegisteredRoute[],
  name: string,
): AppClientRegisteredRoute | undefined {
  for (const route of routes) {
    if (route.name === name) return route;
    const nested = route.children && find(route.children, name);
    if (nested) return nested;
  }
  return undefined;
}

const outline = (items: ReturnType<typeof buildPersonalSettingsNavigation>) =>
  items.map(({ route, children }) => [
    route.name,
    children.map((child) => child.route.path),
  ]);

describe('Personal settings navigation', () => {
  it('mounts personal settings under /me, open to every signed-in person', () => {
    const routes = resolve();
    expect(find(routes, 'personalSettingsHome')).toMatchObject({
      path: '/me',
      surface: 'personalSettings',
      auth: 'required',
      authz: 'skip',
    });
    expect(find(routes, 'personalAppearance')).toMatchObject({
      path: '/me/preferences',
      authz: 'skip',
    });
  });

  it('keeps personal settings out of the application menu, leaving the single System settings entry', () => {
    const menu = buildRouteNavigation(resolve(), new Set());
    expect(menu.map(({ route }) => route.name)).toEqual(['settingsHome']);
  });

  it('lists personal settings by category, hides empty categories and opens the first page from /me', () => {
    const routes = resolve();
    const menu = buildPersonalSettingsNavigation(routes, new Set());
    expect(outline(menu)).toEqual([
      ['personalPreferences', ['/me/preferences']],
    ]);
    expect(firstNavigationPage(menu)?.path).toBe('/me/preferences');
    expect(
      selectedNavigationId(routes, '/me/preferences', new Set(), menu),
    ).toBe(routeKey(menu[0]!.children[0]!.route));
  });

  it('adds a plugin page to its category', () => {
    const routes = resolve(
      definePersonalSettingsRoutes([
        {
          parent: 'personalAccount',
          name: 'apiKeys',
          path: '/api-keys',
          navigation: { title: 'API keys' },
          componentLoader,
        },
      ]),
    );
    const menu = buildPersonalSettingsNavigation(routes, new Set());
    expect(outline(menu)).toEqual([
      ['personalAccount', ['/me/api-keys']],
      ['personalPreferences', ['/me/preferences']],
    ]);
    expect(firstNavigationPage(menu)?.path).toBe('/me/api-keys');
  });

  it('tells system and personal settings locations apart', () => {
    expect(isSettingsPath('/settings/users')).toBe(true);
    expect(isPersonalSettingsPath('/settings/users')).toBe(false);
    expect(isPersonalSettingsPath('/me')).toBe(true);
    expect(isPersonalSettingsPath('/me/preferences')).toBe(true);
    expect(isPersonalSettingsPath('/members')).toBe(false);
    expect(isAnySettingsPath('/me/preferences')).toBe(true);
    expect(isAnySettingsPath('/orders')).toBe(false);
  });
});
