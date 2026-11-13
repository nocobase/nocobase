import { CAPABILITY_GUIDE_ACCESS } from '@nocobase/app-plugin-foundation/client';
import {
  pagePermissionResources,
  permissionNavigationSections,
} from '../../client/pages/settings/page-permissions.js';
import { permissionRowId } from '../../client/pages/settings/permissions-model.js';
import { resolveAppRuntime } from '@nocobase/app-client/runtime';
import { describe, expect, it } from 'vitest';

import appRuntime from '../../client/runtime.js';
import {
  routeKey,
  buildSettingsCatalog,
} from '../../client/routing/route-navigation.js';
import packageMetadata from '../../package.json' with { type: 'json' };
import {
  createCapabilityCatalog,
  entryContent,
  guideContent,
  type DependencyManifest,
} from '@nocobase/app-plugin-foundation/capability-guide';

describe('Examples Foundation integration', () => {
  it('ships the plugin as a deployment dependency', () => {
    expect(packageMetadata.dependencies).toHaveProperty(
      '@nocobase/app-plugin-foundation',
    );
  });

  it('removes the application usage route and its settings group', async () => {
    const runtime = await resolveAppRuntime(appRuntime);
    expect(runtime.routes.some((route) => route.path === '/foundation')).toBe(
      false,
    );
    expect(
      runtime.routes.some((route) =>
        ['foundation', 'foundationSettings'].includes(route.name),
      ),
    ).toBe(false);
  });

  it('provides Features and extensions in System settings with its existing route', async () => {
    const runtime = await resolveAppRuntime(appRuntime);
    const category = buildSettingsCatalog(runtime.routes, new Set()).find(
      ({ route }) => route.name === 'settingsSystem',
    );
    const guide = category?.modules.find(
      ({ route }) => route.name === 'capabilityGuide',
    );
    expect(guide?.target.path).toBe('/settings/capabilities');
    expect(guide?.route.auth).toBe('required');
    expect(guide?.route.authz).toEqual(CAPABILITY_GUIDE_ACCESS);
    expect(
      buildSettingsCatalog(runtime.routes, new Set([routeKey(guide!.route)]))
        .flatMap((item) => item.modules)
        .some((item) => item.route.name === 'capabilityGuide'),
    ).toBe(false);
  });

  it('lists the capability guide, and every demo it offers opens a page this application registers', async () => {
    const runtime = await resolveAppRuntime(appRuntime);
    expect(
      runtime.routes.find((route) => route.name === 'capabilityGuide'),
    ).toMatchObject({
      path: '/settings/capabilities',
      auth: 'required',
      authz: CAPABILITY_GUIDE_ACCESS,
    });
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

  it('lists every plugin this application declares in the capability guide, with the standalone core modules', () => {
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
    ).toEqual(['db', 'jobs', 'lifecycle', 'queue', 'realtime']);
    // Installed extensions may use the guide's generic introduction.
    for (const entry of entries) {
      for (const locale of ['en-US', 'zh-CN']) {
        const text = entryContent(guideContent(locale), entry);
        expect(text.title.trim()).not.toBe('');
        expect(text.summary.trim()).not.toBe('');
      }
    }
    expect(
      entries.filter((entry) => entry.role === 'example').length,
    ).toBeGreaterThan(0);
  });

  it('keeps an additional plugin discoverable without built-in wording', () => {
    const packageName = '@example/app-plugin-business-extension';
    const catalog = createCapabilityCatalog({
      ...packageMetadata,
      dependencies: {
        ...packageMetadata.dependencies,
        [packageName]: '1.0.0',
      },
    });
    const entry = catalog.entries.find(
      (item) => item.packageName === packageName,
    )!;
    expect(entry).toMatchObject({ source: 'plugin', known: false });
    expect(catalog.find(entry.id)).toBe(entry);
    for (const locale of ['en-US', 'zh-CN']) {
      const text = entryContent(guideContent(locale), entry);
      expect(text.title).toContain(packageName);
      expect(text.summary.trim()).not.toBe('');
      expect(text.prompts.main?.template).toContain(packageName);
    }
  });
});

it('offers one Features and extensions access control under system configuration', async () => {
  const { routes } = await resolveAppRuntime(appRuntime);
  const pages = pagePermissionResources(routes, {}, (path) => path);
  const controls = pages.filter(
    ({ id }) => id === CAPABILITY_GUIDE_ACCESS.resource.id,
  );
  expect(controls).toHaveLength(1);
  expect(controls[0]).toMatchObject({
    title: {
      key: 'nav.capabilityGuide',
      ns: '@nocobase/app-plugin-foundation',
    },
    actions: [{ name: 'access' }],
  });
  const row = {
    id: permissionRowId(CAPABILITY_GUIDE_ACCESS.resource, 'access'),
    label: 'Access',
    enabled: false,
  };
  const sections = permissionNavigationSections(
    [{ id: 'pages', title: 'Pages', groups: [{ id: 'guide', rows: [row] }] }],
    routes,
    {},
    (path) => path,
    (value) => (typeof value === 'string' ? value : value.key),
  );
  expect(sections).toHaveLength(1);
  expect(sections[0]?.id).toBe('configuration');
  expect(sections[0]?.groups.flatMap(({ rows }) => rows)).toEqual([row]);
  expect(
    routes.find(({ name }) => name === 'capabilityGuideEntry')?.authz,
  ).toEqual(CAPABILITY_GUIDE_ACCESS);
});
