import { resolveAppRuntime } from '@nocobase/app-client/runtime';
import { describe, expect, it } from 'vitest';

import appRuntime from '../../client/runtime.js';
import {
  buildRouteNavigation,
  buildSettingsCatalog,
  type RouteNavigationItem,
} from '../../client/routing/route-navigation.js';
import packageMetadata from '../../package.json' with { type: 'json' };
import {
  createCapabilityCatalog,
  type DependencyManifest,
} from '@nocobase/app-plugin-foundation/capability-guide';

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

  it('lists the capability guide, and every demo it offers opens a page this application registers', async () => {
    const runtime = await resolveAppRuntime(appRuntime);
    expect(
      runtime.routes.find((route) => route.name === 'capabilityGuide'),
    ).toMatchObject({ path: '/capabilities', auth: 'required', authz: 'skip' });
    type Node = { readonly path?: string; readonly children?: readonly Node[] };
    const walk = (nodes: readonly Node[]): string[] =>
      nodes.flatMap((node) => [
        ...(node.path ? [node.path] : []),
        ...walk(node.children ?? []),
      ]);
    const paths = new Set(walk(runtime.routes as readonly Node[]));
    const demos = createCapabilityCatalog(packageMetadata)
      .entries.filter((entry) => entry.demo)
      .map((entry) => [entry.id, entry.demo]);
    expect(demos.length).toBeGreaterThan(0);
    expect(demos.filter(([, demo]) => !paths.has(demo!))).toEqual([]);
  });

  it('lists every plugin this application declares in the capability guide, with the seven core modules introduced on their own', () => {
    const manifest = packageMetadata as DependencyManifest;
    const { entries } = createCapabilityCatalog(manifest);
    const declared = Object.keys({
      ...manifest.dependencies,
      ...manifest.devDependencies,
    })
      .filter((name) => name.includes('app-plugin-'))
      .sort();
    expect(
      entries
        .filter((entry) => entry.source === 'plugin')
        .map((entry) => entry.packageName)
        .sort(),
    ).toEqual(declared);
    expect(
      entries
        .filter((entry) => entry.source === 'kernel')
        .map((entry) => entry.name),
    ).toEqual([
      'concurrency',
      'db',
      'i18n',
      'jobs',
      'lifecycle',
      'queue',
      'realtime',
    ]);
    // Every entry has its own wording; none falls back to the generic text.
    expect(entries.filter((entry) => !entry.known)).toEqual([]);
    expect(
      entries.filter((entry) => entry.role === 'example').length,
    ).toBeGreaterThan(0);
  });
});
