import {
  resolveAppClientContributions,
  type AppClientSettingsRouteDefinition,
} from '@nocobase/app-client/plugins';
import { Bot } from 'lucide-react';
import { expect, test } from 'vitest';
import settings from '../client/settings.ts';

const settingsAccess = {
  resource: { type: 'page', id: 'ai.settings' },
  action: 'access',
} as const;

const expectedPages = [
  ['ai', '/ai', 'AI Employees'],
  ['aiSkills', '/ai/skills', 'Skills'],
  ['aiTools', '/ai/tools', 'tools.title'],
  ['aiLLMServices', '/ai/llm-services', 'LLM services'],
  ['aiMCPServices', '/ai/mcp-services', 'MCP services'],
  ['aiUsage', '/ai/usage', 'Usage statistics'],
  ['aiConversations', '/ai/conversations', 'Conversations'],
  ['aiSettings', '/ai/settings', undefined],
] as const;

const expectedChildren = [
  [
    'ai',
    'aiEmployeeProfile',
    'employees/:username/profile',
    '/ai/employees/:username/profile',
  ],
  [
    'ai',
    'aiEmployeeRole',
    'employees/:username/role',
    '/ai/employees/:username/role',
  ],
  [
    'ai',
    'aiEmployeeModels',
    'employees/:username/models',
    '/ai/employees/:username/models',
  ],
  [
    'ai',
    'aiEmployeeSkills',
    'employees/:username/skills',
    '/ai/employees/:username/skills',
  ],
  [
    'ai',
    'aiEmployeeTools',
    'employees/:username/tools',
    '/ai/employees/:username/tools',
  ],
  [
    'ai',
    'aiEmployeeKnowledge',
    'employees/:username/knowledge',
    '/ai/employees/:username/knowledge',
  ],
  [
    'ai',
    'aiEmployeeUnknownTab',
    'employees/:username/:tab',
    '/ai/employees/:username/:tab',
  ],
  ['aiSkills', 'aiSkillDetails', ':skillName', '/ai/skills/:skillName'],
  [
    'aiSkillDetails',
    'aiSkillInstructions',
    'instructions',
    '/ai/skills/:skillName/instructions',
  ],
  ['aiSkillDetails', 'aiSkillTools', 'tools', '/ai/skills/:skillName/tools'],
  ['aiTools', 'aiToolDetails', ':toolName', '/ai/tools/:toolName'],
  [
    'aiLLMServices',
    'aiLLMServiceModels',
    ':serviceName/models',
    '/ai/llm-services/:serviceName/models',
  ],
  [
    'aiMCPServices',
    'aiMCPServiceTools',
    ':serverName/tools',
    '/ai/mcp-services/:serverName/tools',
  ],
  [
    'aiConversations',
    'aiConversationDetails',
    ':sessionId',
    '/ai/conversations/:sessionId',
  ],
] as const;

function flattenRoutes(
  routes: readonly AppClientSettingsRouteDefinition[],
): AppClientSettingsRouteDefinition[] {
  return routes.flatMap((route) => [
    route,
    ...flattenRoutes(route.children ?? []),
  ]);
}

test('groups employees, skills, tools, standalone services, conversations, and usage statistics as sibling pages', () => {
  expect(settings).toMatchObject({
    parent: 'settings',
    routes: [
      {
        name: 'aiGroup',
        navigation: { title: 'AI', icon: Bot },
        children: expectedPages.map(([name, path, title]) => ({
          name,
          path,
          ...(title ? { navigation: { title } } : {}),
          authz: settingsAccess,
          componentLoader: expect.any(Function),
        })),
      },
    ],
  });
  expect(settings.routes).toHaveLength(1);
  const [group] = settings.routes;
  expect(group).not.toHaveProperty('path');
  expect(group).not.toHaveProperty('componentLoader');
  expect(group?.children).toHaveLength(expectedPages.length);
  const legacyPage = group?.children?.find(({ name }) => name === 'aiSettings');
  expect(legacyPage).not.toHaveProperty('navigation');
  expect(legacyPage).not.toHaveProperty('children');
  expect(flattenRoutes(settings.routes)).toHaveLength(
    1 + expectedPages.length + expectedChildren.length,
  );
});

test.each(expectedChildren)(
  '%s declares the %s child with an inherited permission and no menu entry',
  (parentName, name, path, resolvedPath) => {
    const parent = flattenRoutes(settings.routes).find(
      (route) => route.name === parentName,
    );
    const child = parent?.children?.find((route) => route.name === name);
    expect(child).toMatchObject({
      name,
      path,
      componentLoader: expect.any(Function),
    });
    expect(child).not.toHaveProperty('authz');
    expect(child).not.toHaveProperty('navigation');
    expect(child).not.toHaveProperty('breadcrumb');

    const resolved = resolveAppClientContributions([
      { packageName: '@nocobase/app-plugin-ai-employee', routes: settings },
    ]);
    expect(resolved.settings.find(({ id }) => id === name)).toMatchObject({
      id: name,
      path: `/settings${resolvedPath}`,
      navigation: false,
      authz: settingsAccess,
    });
  },
);

test('resolves the AI navigation group without changing page URLs or identities', () => {
  const resolved = resolveAppClientContributions([
    { packageName: '@nocobase/app-plugin-ai-employee', routes: settings },
  ]);
  expect(resolved.settingsRouteTree).toMatchObject([
    {
      id: 'aiGroup',
      navigation: { title: 'AI', icon: Bot },
      children: expectedPages.map(([id, path]) => ({
        id,
        path: `/settings${path}`,
      })),
    },
  ]);
  expect(
    resolved.settings
      .filter(({ id }) => expectedPages.some(([name]) => name === id))
      .map(({ id, path, title, navigation, authz }) => ({
        id,
        path,
        title,
        navigation,
        authz,
      })),
  ).toEqual(
    expectedPages.map(([id, path, title]) => ({
      id,
      path: `/settings${path}`,
      title: title ?? id,
      navigation: title !== undefined,
      authz: settingsAccess,
    })),
  );
  expect(resolved.settings).toHaveLength(
    expectedPages.length + expectedChildren.length,
  );
  expect(
    resolved.settings
      .filter(({ navigation }) => navigation)
      .map(({ id }) => id),
  ).toEqual([
    'ai',
    'aiSkills',
    'aiTools',
    'aiLLMServices',
    'aiMCPServices',
    'aiUsage',
    'aiConversations',
  ]);

  for (const page of resolved.settingsRouteTree[0]?.children ?? []) {
    expect(page).toMatchObject({ auth: 'required', authz: settingsAccess });
    for (const child of page.children ?? []) {
      expect(child).toMatchObject({ auth: 'required', authz: settingsAccess });
      expect(child.navigation).toBeUndefined();
      for (const tab of child.children ?? []) {
        expect(tab).toMatchObject({ auth: 'required', authz: settingsAccess });
        expect(tab.navigation).toBeUndefined();
      }
    }
  }
});
