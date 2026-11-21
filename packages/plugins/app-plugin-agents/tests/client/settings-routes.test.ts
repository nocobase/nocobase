import {
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';

import agents from '../../client/plugin.js';

const resolve = (registration: ReturnType<typeof agents>) =>
  resolveAppClientContributions([
    {
      packageName: registration.packageName,
      source: 'plugin',
      routes: registration.routes,
    },
  ]).routes;

const pages = (
  routes: readonly AppClientRegisteredRoute[],
): AppClientRegisteredRoute[] =>
  routes.flatMap((route) => [
    ...(route.componentLoader && route.navigation ? [route] : []),
    ...pages(route.children ?? []),
  ]);

describe('agent management as System settings pages', () => {
  it('registers no routes unless the application asks for them', () => {
    expect(agents().routes).toEqual([]);
  });

  it('mounts the pages under /settings in the built-in AI category, titled in the plugin namespace', () => {
    const routes = resolve(agents({ settingsRoutes: true }));
    const ai = routes.find((route) => route.name === 'systemSettings.ai');
    expect(ai).toBeDefined();
    const mounted = pages(ai!.children ?? []);
    expect(
      mounted.map((route) => [
        route.path,
        route.navigation?.title,
        route.packageName,
      ]),
    ).toEqual([
      ['/settings/agents', 'agents.title', '@nocobase/app-plugin-agents'],
      ['/settings/runtimes', 'runtimes.title', '@nocobase/app-plugin-agents'],
      ['/settings/skills', 'skills.title', '@nocobase/app-plugin-agents'],
      ['/settings/models', 'models.title', '@nocobase/app-plugin-agents'],
      ['/settings/usage', 'usage.title', '@nocobase/app-plugin-agents'],
    ]);
    // Each page keeps its own grant rather than the administrators-only default.
    expect(mounted.find((route) => route.name === 'agents')?.authz).toEqual({
      resource: { type: 'page', id: 'agents' },
      action: 'access',
    });
  });
});
