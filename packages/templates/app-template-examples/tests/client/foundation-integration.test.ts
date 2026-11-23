import { PLUGINS_ACCESS } from '@nocobase/app-plugin-foundation/client';
import { resolveAppRuntime } from '@nocobase/app-client/runtime';
import { describe, expect, it } from 'vitest';

import appRuntime from '../../client/runtime.js';
import { permissionPageCatalog } from '../../client/pages/settings/permission-catalog.js';
import packageMetadata from '../../package.json' with { type: 'json' };
import cliPlugins from '../../cli/plugins.js';
import {
  buildRouteNavigation,
  buildSettingsCatalog,
} from '../../client/routing/route-navigation.js';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';

function flatten(
  routes: readonly AppClientRegisteredRoute[],
): AppClientRegisteredRoute[] {
  return routes.flatMap((route) => [route, ...flatten(route.children ?? [])]);
}

describe('plugins page integration', () => {
  it('ships the plugin as a deployment dependency', () => {
    expect(packageMetadata.dependencies).toHaveProperty(
      '@nocobase/app-plugin-foundation',
    );
  });

  it('lists Plugins in System settings behind «Plugins · View»', async () => {
    const runtime = await resolveAppRuntime(appRuntime);
    const system = buildSettingsCatalog(runtime.routes, new Set()).find(
      ({ route }) => route.name === 'systemSettings.system',
    );
    const plugins = system?.modules.find(
      ({ route }) => route.name === 'plugins',
    );
    expect(plugins?.target.path).toBe('/settings/plugins');
    expect(plugins?.route).toMatchObject({
      id: '@nocobase/app-plugin-foundation:plugins',
      auth: 'required',
      authz: PLUGINS_ACCESS,
    });
    // A settings page, not a business menu entry.
    expect(
      buildRouteNavigation(runtime.routes, new Set()).some(
        ({ route }) => route.name === 'plugins',
      ),
    ).toBe(false);
  });

  it('lists Plugins in the role editor’s System category, not among the menus', async () => {
    const { routes } = await resolveAppRuntime(appRuntime);
    const catalog = permissionPageCatalog(routes);
    const owners = catalog.settings.flatMap((category) =>
      category.modules
        .filter(({ route }) => route.name === 'plugins')
        .map(() => category.route.name),
    );
    expect(owners).toEqual(['systemSettings.system']);
    const menu = (items: typeof catalog.navigation): readonly string[] =>
      items.flatMap((item) => [item.route.name, ...menu(item.children)]);
    expect(menu(catalog.navigation)).not.toContain('plugins');
  });

  it('sends the earlier Foundation and capability guide addresses to the plugins page', async () => {
    const runtime = await resolveAppRuntime(appRuntime);
    const paths = flatten(runtime.routes)
      .filter(
        (route) =>
          route.packageName === '@nocobase/app-plugin-foundation' &&
          route.name !== 'plugins',
      )
      .map((route) => [route.path, route.navigation]);
    expect(paths).toEqual([
      ['/settings/foundation', undefined],
      ['/settings/capabilities', undefined],
      ['/settings/capabilities/:entryId', undefined],
    ]);
  });

  it('adds no build step: the plugin contributes no commands', () => {
    expect(
      cliPlugins.plugins.map((plugin) => plugin.packageName),
    ).not.toContain('@nocobase/app-plugin-foundation');
  });
});
