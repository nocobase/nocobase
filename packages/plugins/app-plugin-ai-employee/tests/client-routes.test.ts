import type { AppClientSettingsRouteDefinition } from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';

import routes from '../client/routes.ts';

function flattenPages(
  pages: readonly AppClientSettingsRouteDefinition[],
): AppClientSettingsRouteDefinition[] {
  return pages.flatMap((page) => [page, ...flattenPages(page.children ?? [])]);
}

const expectedDemoRoutes = [
  ['ai-chat-window', '/chat', 'demo.navigation.chat'],
  ['ai-floating-chat', '/floating', 'demo.navigation.floating'],
  ['ai-employee-tasks', '/tasks', 'demo.navigation.tasks'],
  ['ai-page-context', '/context', 'demo.navigation.context'],
  ['ai-tool-cards', '/tools', 'demo.navigation.tools'],
] as const;

describe('AI Employee client routes', () => {
  // Loading a page module transforms its whole import graph on first use, which can outlast the default 5 s timeout
  // when a release runner runs every package's tests at once.
  it('contributes settings and one development-only AI Components group', async () => {
    const [settingsContribution, devContribution] = routes;

    expect(settingsContribution).toMatchObject({
      parent: 'settings',
      routes: [
        {
          name: 'aiGroup',
          navigation: { title: 'AI' },
          children: [
            { name: 'ai', path: '/ai' },
            { name: 'aiSkills', path: '/ai/skills' },
            { name: 'aiTools', path: '/ai/tools' },
            { name: 'aiLLMServices', path: '/ai/llm-services' },
            { name: 'aiMCPServices', path: '/ai/mcp-services' },
            { name: 'aiConversations', path: '/ai/conversations' },
            { name: 'aiSettings', path: '/ai/settings' },
          ],
        },
      ],
    });
    expect(devContribution).toMatchObject({
      parent: 'dev',
      routes: [
        {
          name: 'ai-components',
          path: '/ai-components',
          navigation: { title: 'demo.navigation.group' },
          children: expectedDemoRoutes.map(([name, path, title]) => ({
            name,
            path,
            navigation: { title },
            componentLoader: expect.any(Function),
          })),
        },
      ],
    });

    if (settingsContribution?.parent !== 'settings') {
      throw new Error('Missing AI Employee Settings Route contribution.');
    }
    const settingsRoutes = flattenPages(
      settingsContribution.routes[0]?.children ?? [],
    );
    expect(settingsRoutes.map(({ name }) => name)).toEqual([
      'ai',
      'aiEmployeeProfile',
      'aiEmployeeRole',
      'aiEmployeeModels',
      'aiEmployeeSkills',
      'aiEmployeeTools',
      'aiEmployeeKnowledge',
      'aiEmployeeUnknownTab',
      'aiSkills',
      'aiSkillDetails',
      'aiSkillInstructions',
      'aiSkillTools',
      'aiTools',
      'aiToolDetails',
      'aiLLMServices',
      'aiLLMServiceModels',
      'aiMCPServices',
      'aiMCPServiceTools',
      'aiConversations',
      'aiConversationDetails',
      'aiSettings',
    ]);
    const settingsPages = await Promise.all(
      settingsRoutes.map((route) => {
        if (!route.componentLoader) {
          throw new Error(`Missing settings page loader: ${route.name}`);
        }
        return route.componentLoader();
      }),
    );
    expect(settingsPages).toHaveLength(21);
    for (const page of settingsPages) {
      expect(page.default).toEqual(expect.any(Function));
    }

    if (devContribution?.parent !== 'dev') {
      throw new Error('Missing AI Employee Dev Route contribution.');
    }
    const [demoGroup] = devContribution.routes;
    if (!demoGroup?.children) {
      throw new Error('Missing grouped AI Employee demo routes.');
    }

    const loadedPages = await Promise.all(
      demoGroup.children.map((route) => {
        if (!route.componentLoader) {
          throw new Error(`Missing demo page loader: ${route.name}`);
        }
        return route.componentLoader();
      }),
    );
    expect(loadedPages).toHaveLength(expectedDemoRoutes.length);
    for (const page of loadedPages) {
      expect(page.default).toEqual(expect.any(Function));
    }
  }, 30_000);
});
