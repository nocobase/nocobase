import { describe, expect, it, vi } from 'vitest';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { businessModules } from '../../client/business-modules.js';
import type { FoundationProviderInventory } from '../../shared/foundation.js';

const loader = vi.fn();
function page(
  name: string,
  overrides: Partial<AppClientRegisteredRoute> = {},
): AppClientRegisteredRoute {
  return {
    name,
    id: `app:${name}`,
    packageName: 'app',
    source: 'application',
    path: `/${name}`,
    auth: 'required',
    authz: 'skip',
    componentLoader: loader,
    navigation: { title: `nav.${name}` },
    ...overrides,
  };
}
const inventory: FoundationProviderInventory = {
  complete: true,
  unreadable: [],
  entries: [
    {
      name: '@vendor/pro',
      version: '1',
      installed: true,
      kind: 'plugin',
      origin: 'unverified',
      categories: [],
      registration: 'observed',
      evidence: ['clientContribution'],
    },
    {
      name: '@nocobase/app-plugin-file',
      version: '1',
      installed: true,
      kind: 'plugin',
      origin: 'nocobase',
      categories: ['files'],
      registration: 'observed',
      evidence: ['clientContribution'],
    },
  ],
};

describe('automatic business modules', () => {
  it('groups descendants, preserves translated menu titles and links only evidence present in the current capability list', () => {
    const routes = [
      page('customOrders', {
        authz: {
          resource: { type: 'page', id: 'unrelated-id' },
          action: 'access',
        },
        children: [page('detail', { navigation: undefined })],
      }),
      page('system', {
        componentLoader: undefined,
        children: [page('users'), page('roles')],
      }),
      page('login', { auth: 'guest' }),
      page('foundation', { packageName: '@nocobase/app-plugin-foundation' }),
    ];
    const sources = {
      complete: true,
      routes: [
        {
          packageName: 'app',
          routeName: 'customOrders',
          providers: ['@nocobase/app-plugin-file', '@vendor/pro'],
          complete: true,
        },
      ],
    };
    const modules = businessModules(routes, inventory, sources, [
      'interface',
      'usersAndOrganizations',
      'permissions',
      'files',
      'extension:@vendor/pro',
    ]);
    expect(modules.map((item) => item.id)).toEqual([
      'app:customOrders',
      'app:system',
    ]);
    expect(modules[0]).toMatchObject({
      title: { key: 'nav.customOrders', ns: 'app' },
      pageCount: 2,
      complete: false,
    });
    expect(modules[0]?.links.map((link) => link.capability)).toEqual([
      'interface',
      'usersAndOrganizations',
      'permissions',
      'files',
      'extension:@vendor/pro',
    ]);
    expect(modules[1]?.pageCount).toBe(2);
    expect(loader).not.toHaveBeenCalled();
    expect(businessModules([], inventory, sources, ['files'])).toEqual([]);
    expect(
      businessModules(routes, inventory, sources, ['interface'])[0]?.links.map(
        (link) => link.capability,
      ),
    ).toEqual(['interface']);
  });

  it('does not infer business use from names, installation or another module', () => {
    const modules = businessModules(
      [page('files-workflows-ai', { auth: 'optional' })],
      inventory,
      undefined,
      ['files', 'workflows', 'aiAgents', 'interface'],
    );
    expect(modules[0]?.links).toEqual([
      { capability: 'interface', evidence: ['page'], providers: [] },
    ]);
    expect(modules[0]?.complete).toBe(false);
  });

  it('keeps page evidence separate from broad provider categories and another module use', () => {
    const modules = businessModules(
      [
        page('one'),
        page('two', { source: 'plugin', packageName: '@vendor/broad' }),
      ],
      {
        ...inventory,
        entries: [
          ...inventory.entries,
          {
            name: '@vendor/broad',
            version: '1',
            installed: true,
            kind: 'plugin',
            origin: 'unverified',
            categories: ['files', 'workflows'],
            registration: 'observed',
            evidence: ['clientContribution'],
          },
        ],
      },
      {
        complete: true,
        routes: [
          {
            packageName: 'app',
            routeName: 'one',
            providers: ['@nocobase/app-plugin-file'],
            complete: true,
          },
        ],
      },
      ['interface', 'usersAndOrganizations', 'files', 'workflows'],
    );
    expect(modules[0]?.links.map((link) => link.capability)).toEqual([
      'interface',
      'usersAndOrganizations',
      'files',
    ]);
    expect(modules[1]?.links.map((link) => link.capability)).toEqual([
      'interface',
      'usersAndOrganizations',
    ]);
  });
});
