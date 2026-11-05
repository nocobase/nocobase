import { resolveAppRuntime } from '@nocobase/app-client/runtime';
import { describe, expect, it } from 'vitest';

import appRuntime from '../../client/runtime.js';
import {
  buildRouteNavigation,
  buildSettingsCatalog,
  type RouteNavigationItem,
} from '../../client/routing/route-navigation.js';
import packageMetadata from '../../package.json' with { type: 'json' };

function pages(items: readonly RouteNavigationItem[]): RouteNavigationItem[] {
  return items.flatMap((item) => [item, ...pages(item.children)]);
}

describe('Examples Foundation integration', () => {
  it('ships the plugin as a deployment dependency', () => {
    expect(packageMetadata.dependencies).toHaveProperty(
      '@nocobase/app-plugin-foundation',
    );
  });

  it('exposes one protected Foundation card in System settings and hides it when unrestricted access is denied', async () => {
    const runtime = await resolveAppRuntime(appRuntime);
    const menu = buildRouteNavigation(runtime.routes, new Set());
    // One System settings entry; Foundation is a card on its home, never a sidebar entry.
    expect(pages(menu).some(({ route }) => route.name === 'foundation')).toBe(
      false,
    );
    expect(
      menu.filter(({ route }) => route.name === 'settingsHome'),
    ).toHaveLength(1);
    const catalog = buildSettingsCatalog(runtime.routes, new Set());
    const owners = catalog.flatMap((category) =>
      category.modules
        .filter(({ route }) => route.name === 'foundation')
        .map(() => category.route.name),
    );
    expect(owners).toEqual(['settingsSystem']);
    const page = catalog
      .flatMap((category) => category.modules)
      .find(({ route }) => route.name === 'foundation')!.route;
    expect(page).toMatchObject({
      path: '/foundation',
      auth: 'required',
      authz: 'unrestricted',
    });
    await expect(page.componentLoader!()).resolves.toMatchObject({
      default: expect.any(Function),
    });
    const denied = new Set([`${page.packageName}:${page.path}:${page.id}`]);
    expect(
      buildSettingsCatalog(runtime.routes, denied)
        .flatMap((category) => category.modules)
        .map(({ route }) => route.name),
    ).toEqual(
      catalog
        .flatMap((category) => category.modules)
        .map(({ route }) => route.name)
        .filter((name) => name !== 'foundation'),
    );
  });
});
