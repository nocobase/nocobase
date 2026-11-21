import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';
import routes from '../../client/routes.js';
import {
  buildPersonalSettingsNavigation,
  buildRouteNavigation,
  firstNavigationPage,
} from '../../client/routing/route-navigation.js';
import { isPersonalSettingsShell } from '../../client/routing/settings-shell.js';

function resolve() {
  return resolveAppClientContributions([
    {
      packageName: '@nocobase/app-template-examples',
      source: 'application',
      routes,
    },
  ]).routes;
}

describe('Personal settings navigation', () => {
  it('keeps personal settings out of the application menu', () => {
    const menu = buildRouteNavigation(resolve(), new Set());
    expect(menu.some((item) => isPersonalSettingsShell(item.route))).toBe(
      false,
    );
  });

  it('lists the built-in Language and appearance page and opens it from /me', () => {
    const menu = buildPersonalSettingsNavigation(resolve(), new Set());
    expect(
      menu.map(({ route, children }) => [
        route.name,
        children.map((child) => child.route.path),
      ]),
    ).toEqual([['personalPreferences', ['/me/preferences', '/me/agents']]]);
    expect(firstNavigationPage(menu)?.path).toBe('/me/preferences');
  });
});
