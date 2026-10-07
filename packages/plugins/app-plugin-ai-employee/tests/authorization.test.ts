import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createAppAuthorization } from '@nocobase/app-plugin-authorization/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it } from 'vitest';

import clientEnUS from '../client/locales/en-US.js';
import clientZhCN from '../client/locales/zh-CN.js';
import {
  AIEmployeeAuthorizationProvider,
  AI_SETTINGS_SECTION,
} from '../server/provider/authorization.js';
import serverEnUS from '../server/locales/en-US.js';
import serverZhCN from '../server/locales/zh-CN.js';
import {
  AI_SETTINGS,
  AI_SETTINGS_ACTIONS,
  aiSettingsCheck,
  type AISettingsKey,
} from '../shared/authorization.js';

const ns = '@nocobase/app-plugin-ai-employee';
const keys = Object.keys(AI_SETTINGS) as AISettingsKey[];

async function boot() {
  const authz = createAppAuthorization({});
  const container = new ServiceContainer();
  container.instance(authorizationToken, authz);
  await new AIEmployeeAuthorizationProvider({
    container,
  } as AppPluginApplication).boot();
  return authz;
}

describe('AI settings permissions', () => {
  it('lists one item per settings page under System management → AI', async () => {
    const authz = await boot();
    expect(authz.ui.sections.get(AI_SETTINGS_SECTION)).toEqual({
      name: AI_SETTINGS_SECTION,
      title: { key: 'authorization.section', ns },
      parent: 'administration',
    });
    const items = authz.resourceTypes.get('settings').items;
    for (const [order, key] of keys.entries()) {
      const id = AI_SETTINGS[key];
      expect(items?.get(id)).toMatchObject({
        title: { key: `authorization.items.${key}`, ns },
        actions: AI_SETTINGS_ACTIONS[key].map((name) =>
          expect.objectContaining({
            name,
            title: { key: `authorization.actions.${name}`, ns },
          }),
        ),
      });
      expect(authz.ui.placementOf({ type: 'settings', id })).toEqual({
        section: AI_SETTINGS_SECTION,
        order,
      });
    }
    const report = authz.ui.validate(authz);
    expect(report.errors).toEqual([]);
    expect(
      report.warnings.filter((warning) => warning.includes('ai.')),
    ).toEqual([]);
  });

  it('offers manage only where a page changes something', async () => {
    const authz = await boot();
    expect(AI_SETTINGS_ACTIONS).toEqual({
      employees: ['read', 'manage'],
      skills: ['read'],
      tools: ['read'],
      llmServices: ['read', 'manage'],
      mcpServers: ['read', 'manage'],
      usage: ['read'],
      conversations: ['read'],
    });
    expect(() => authz.settings.grant('ai.skills', ['manage'])).toThrow();
    expect(() => aiSettingsCheck('usage', 'manage')).toThrow(TypeError);
    expect(authz.settings.grant('ai.llmServices', ['read', 'manage'])).toEqual({
      resource: { type: 'settings', id: 'ai.llmServices' },
      actions: [{ action: 'read' }, { action: 'manage' }],
    });
  });

  it.each([
    ['client en-US', clientEnUS],
    ['client zh-CN', clientZhCN],
    ['server en-US', serverEnUS],
    ['server zh-CN', serverZhCN],
  ])('titles every item and action in %s', (_name, locale) => {
    const { authorization } = locale as unknown as {
      authorization: {
        section: string;
        items: Record<string, string>;
        actions: Record<string, string>;
      };
    };
    expect(authorization.section).toEqual(expect.any(String));
    expect(Object.keys(authorization.items).sort()).toEqual([...keys].sort());
    expect(Object.keys(authorization.actions).sort()).toEqual([
      'manage',
      'read',
    ]);
  });
});
