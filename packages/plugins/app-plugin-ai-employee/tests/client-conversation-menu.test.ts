import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import { expect, it } from 'vitest';
import { createAISettings } from '../client/ai-settings.js';
import settings from '../client/settings.js';

it('does not register a conversation route or sidebar entry', () => {
  expect(createAISettings().children).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'aiConversations' }),
    ]),
  );

  const resolved = resolveAppClientContributions([
    { packageName: '@nocobase/app-plugin-ai-employee', routes: settings },
  ]);
  expect(
    resolved.settings.some(
      ({ id, path }) =>
        id === 'aiConversations' || path === '/settings/ai/conversations',
    ),
  ).toBe(false);
  expect(
    resolved.settings
      .filter(({ navigation }) => navigation)
      .map(({ id }) => id),
  ).toEqual(['ai', 'aiSkills', 'aiTools', 'aiLLMServices', 'aiMCPServices']);
});
