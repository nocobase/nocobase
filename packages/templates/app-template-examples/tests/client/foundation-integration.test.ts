import { resolveAppRuntime } from '@nocobase/app-client/runtime';
import { describe, expect, it } from 'vitest';

import appRuntime from '../../client/runtime.js';
import {
  buildRouteNavigation,
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

  it('exposes one protected Foundation entry and hides it when unrestricted access is denied', async () => {
    const runtime = await resolveAppRuntime(appRuntime);
    const menu = buildRouteNavigation(runtime.routes, new Set());
    const entries = pages(menu).filter(
      ({ route }) => route.name === 'foundation',
    );
    expect(entries).toHaveLength(1);
    const settings = menu.find(
      (item) => item.route.name === 'systemManagement',
    );
    expect(settings?.children.at(-1)?.route.name).toBe('foundation');
    expect(menu.some((item) => item.route.name === 'foundation')).toBe(false);
    const page = entries[0]!.route;
    expect(page).toMatchObject({
      path: '/foundation',
      auth: 'required',
      authz: 'unrestricted',
    });
    await expect(page.componentLoader!()).resolves.toMatchObject({
      default: expect.any(Function),
    });
    const denied = buildRouteNavigation(
      runtime.routes,
      new Set([`${page.packageName}:${page.path}:${page.id}`]),
    );
    expect(pages(denied).some(({ route }) => route.name === 'foundation')).toBe(
      false,
    );
    expect(pages(denied).map(({ route }) => route.id)).toEqual(
      pages(menu)
        .filter(({ route }) => route.id !== page.id)
        .map(({ route }) => route.id),
    );
  });
});
