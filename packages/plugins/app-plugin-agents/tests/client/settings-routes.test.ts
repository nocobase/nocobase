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
    ...(route.componentLoader ? [route] : []),
    ...pages(route.children ?? []),
  ]);

describe('what registering the plugin brings', () => {
  it('mounts the five pages under System settings › AI, each behind reading its settings item', () => {
    const routes = resolve(agents());
    const ai = routes.find((route) => route.name === 'systemSettings.ai');
    expect(ai).toBeDefined();
    const mounted = pages(ai!.children ?? []).filter(
      (route) => route.navigation,
    );
    expect(
      mounted.map((route) => [
        route.path,
        route.navigation?.title,
        route.authz,
      ]),
    ).toEqual(
      [
        ['/settings/agents', 'agents.title', 'agents.agents'],
        ['/settings/models', 'models.title', 'agents.services'],
        ['/settings/runtimes', 'runtimes.title', 'agents.runners'],
        ['/settings/skills', 'skills.title', 'agents.skills'],
        ['/settings/usage', 'usage.title', 'agents.prices'],
      ].map(([path, title, id]) => [
        path,
        title,
        { resource: { type: 'settings', id }, action: 'read' },
      ]),
    );
  });

  it('adds Personal settings › Preferences › Agent and the conversation page, for anyone signed in', () => {
    const names = pages(resolve(agents())).map((page) => page.name);
    expect(names).not.toContain('agentChat');
    expect(names).not.toContain('agentConversations');
    const routes = pages(resolve(agents({ chatRoutes: true })));
    const conversations = routes.find(
      (route) => route.name === 'agentConversations',
    );
    expect(conversations).toMatchObject({
      path: '/chat',
      auth: 'required',
      authz: 'skip',
    });
    expect(conversations?.navigation).toBeUndefined();
    const personal = routes.find((route) => route.name === 'agentPreferences');
    expect(personal).toMatchObject({ path: '/me/agent', auth: 'required' });
    expect(personal?.authz).toBe('skip');
    expect(routes.find((route) => route.name === 'agentChat')).toMatchObject({
      path: '/chat/:conversationId',
      auth: 'required',
      authz: 'skip',
    });
    expect(
      pages(resolve(agents({ chatRoutes: true, chatPath: 'assistant/' }))).find(
        (route) => route.name === 'agentChat',
      )?.path,
    ).toBe('/assistant/:conversationId');
  });

  it('puts ✦ in the header with its badge, and the panel beside the content, as the options say', () => {
    const plain = agents();
    expect(plain.headerActions).toMatchObject([{ name: 'agent', order: 900 }]);
    expect(typeof plain.headerActions[0]?.badge).toBe('function');
    expect(plain.layoutExtensions).toHaveLength(1);
    expect(plain.layoutExtensions[0]).toMatchObject({ name: 'agents' });
    expect(plain.layoutExtensions[0]?.aside).toBeTypeOf('function');

    expect(agents({ headerAction: false }).headerActions).toEqual([]);
    // Without the plugin's panel the provider stays, for an application's own copy of the panel.
    const copied = agents({ headerAction: false, panel: false });
    expect(copied.layoutExtensions[0]?.provider).toBeTypeOf('function');
    expect(copied.layoutExtensions[0]?.aside).toBeUndefined();
    expect(() => agents({ chatPath: '/' })).toThrow(/chatPath/u);
  });

  it('carries the extension points on the registration factory', () => {
    expect(agents.toolRenderers.add).toBeTypeOf('function');
    expect(agents.slots.composerActions.add).toBeTypeOf('function');
    expect(agents.components.replace).toBeTypeOf('function');
    expect(agents.preferenceSections.add).toBeTypeOf('function');
  });
});
