import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';

import { groupFoundationNavigation } from '../../client/navigation.js';
import { foundationDefinition } from '../../client/routes.js';

interface Item {
  readonly route: AppClientRegisteredRoute;
  readonly children: readonly Item[];
}
function page(name: string, packageName = 'app'): Item {
  return {
    route: {
      ...foundationDefinition(),
      name,
      id: `${packageName}:${name}`,
      path: `/${name}`,
      packageName,
      source: packageName === 'app' ? 'application' : 'plugin',
    },
    children: [],
  };
}
const foundation = page('foundation', '@nocobase/app-plugin-foundation');
const permissions = page('permissions');
const settings: Item = {
  ...page('settings'),
  route: { ...page('settings').route, componentLoader: undefined },
  children: [permissions],
};

describe('Foundation navigation grouping', () => {
  it('appends Foundation to settings without changing its route, URL or unrestricted guard', () => {
    const home = page('home');
    const input = [home, settings, foundation];
    const result = groupFoundationNavigation(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(home);
    expect(result[1]?.children).toEqual([permissions, foundation]);
    expect(result[1]?.children[1]?.route).toBe(foundation.route);
    expect(foundation.route).toMatchObject({
      path: '/foundation',
      authz: 'unrestricted',
    });
    expect(settings.children).toEqual([permissions]);
    expect(groupFoundationNavigation(result)).toEqual(result);
  });

  it('keeps the bare settings group and merges it once business settings exist', () => {
    const initial: Item = {
      route: {
        ...foundation.route,
        name: 'foundationSettings',
        componentLoader: undefined,
      },
      children: [foundation],
    };
    expect(groupFoundationNavigation([initial])).toEqual([initial]);
    const merged = groupFoundationNavigation([settings, initial]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.children).toEqual([permissions, foundation]);
    expect(groupFoundationNavigation(merged)).toEqual(merged);
  });

  it('never adds a Foundation entry removed by the permission filter', () => {
    expect(groupFoundationNavigation([settings])).toEqual([settings]);
  });

  it('keeps the standalone entry when the host has no settings group, including an empty app', () => {
    expect(groupFoundationNavigation([foundation])).toEqual([foundation]);
    const settingsPage = page('settings');
    expect(groupFoundationNavigation([settingsPage, foundation])).toEqual([
      settingsPage,
      foundation,
    ]);
  });

  it('supports the host group name and does not move an unrelated page with the same name', () => {
    const group = {
      ...settings,
      route: { ...settings.route, name: 'administration' },
    };
    const unrelated = page('foundation');
    const result = groupFoundationNavigation(
      [group, unrelated, foundation],
      'administration',
    );
    expect(result[1]).toBe(unrelated);
    expect(result[0]?.children).toEqual([permissions, foundation]);
  });
});
