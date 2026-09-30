import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import { MessagesSquare } from 'lucide-react';
import { expect, it } from 'vitest';
import { createAISettings } from '../client/ai-settings.js';
import { conversationCenterPath } from '../client/route-paths.js';
import settings from '../client/settings.js';

const settingsAccess = {
  resource: { type: 'page', id: 'ai.settings' },
  action: 'access',
} as const;

it('registers the conversation center as the last AI settings menu entry', () => {
  expect(
    createAISettings().children?.find(({ name }) => name === 'aiConversations'),
  ).toMatchObject({
    path: '/ai/conversations',
    navigation: { title: 'Conversations', icon: MessagesSquare },
    authz: settingsAccess,
    componentLoader: expect.any(Function),
    children: [{ name: 'aiConversationDetails', path: ':sessionId' }],
  });

  const resolved = resolveAppClientContributions([
    { packageName: '@nocobase/app-plugin-ai-employee', routes: settings },
  ]);
  expect(
    resolved.settings.find(({ id }) => id === 'aiConversations'),
  ).toMatchObject({
    path: conversationCenterPath,
    navigation: true,
    authz: settingsAccess,
  });
  expect(
    resolved.settings.find(({ id }) => id === 'aiConversationDetails'),
  ).toMatchObject({
    path: `${conversationCenterPath}/:sessionId`,
    navigation: false,
    authz: settingsAccess,
  });
  expect(
    resolved.settings
      .filter(({ navigation }) => navigation)
      .map(({ id }) => id)
      .at(-1),
  ).toBe('aiConversations');
});
