import type { AppUIMessage } from '@nocobase/app-plugin-agents/client/chat';
import type { ConversationDetail } from '@nocobase/app-plugin-agents/shared/conversations';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { AgentNotice } from '../../registry/agents/agent-chat/agent-status';
import { MessageItem } from '../../registry/agents/agent-chat/message-item';
import enUS from '../../registry/agents/agent-chat/locales/en-US';
import zhCN from '../../registry/agents/agent-chat/locales/zh-CN';

const at = '2026-01-01T00:00:00.000Z';
const conversation: ConversationDetail = {
  id: 'chat',
  title: 'Chat',
  titleSource: 'user',
  category: 'chat',
  source: 'panel',
  mode: 'online',
  agent: {
    id: 'assistant',
    name: 'Assistant',
    nameText: null,
    avatar: null,
    archived: false,
  },
  fallbackFrom: {
    id: 'coder',
    name: 'Coder',
    nameText: null,
    avatar: null,
    archived: false,
  },
  model: null,
  read: true,
  lastMessageAt: at,
  archivedAt: null,
  createdAt: at,
  updatedAt: at,
  run: null,
  availability: { online: true, reason: null, onlineRunners: 1 },
  models: [],
  canFallback: false,
  canRestore: false,
};

it.each([
  ['en-US', enUS, 'Model unavailable', 'Use another agent here'],
  ['zh-CN', zhCN, '模型不可用', '这条对话改用其他 Agent'],
] as const)(
  'keeps historical notices readable and removes Runner fallback actions in %s',
  async (locale, resources, reason, action) => {
    const runtime = await createTestI18nRuntime({
      locale,
      application: { namespace: 'chat-test', resources },
    });
    const notices = [
      { code: 'switchedToOnline', agentId: 'assistant', fromAgentId: 'coder' },
      {
        code: 'onlineFallbackUnavailable',
        fromAgentId: 'coder',
        reason: 'modelUnavailable',
      },
    ];
    const messages: AppUIMessage[] = notices.map((notice, index) => ({
      id: notice.code,
      role: 'system',
      metadata: {
        conversationId: 'chat',
        seq: index + 1,
        revision: 1,
        createdAt: at,
      },
      parts: [
        {
          type: 'data-business',
          id: notice.code,
          data: {
            kind: notice.code,
            id: notice.code,
            payload: JSON.parse(JSON.stringify(notice)),
          },
        },
      ],
    }));

    render(
      <TestI18nProvider runtime={runtime}>
        <AgentNotice conversation={conversation} />
        <AgentNotice
          conversation={{
            ...conversation,
            execution: { status: 'idle' },
            fallbackFrom: null,
            canFallback: true,
            availability: {
              online: false,
              reason: 'noRunner',
              onlineRunners: 0,
            },
          }}
        />
        <ul>
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              agentName={(id) => (id === 'coder' ? 'Coder' : 'Assistant')}
            />
          ))}
        </ul>
      </TestI18nProvider>,
    );
    expect(screen.queryByTestId('chat-fallback')).toBeNull();
    expect(screen.queryByRole('button', { name: action })).toBeNull();
    expect(screen.getByText(resources.chat.historicalReadOnly)).toBeVisible();
    expect(screen.getByText(new RegExp(reason))).toBeVisible();
    expect(
      screen.queryByText(/untranslated|chat\.notice\./),
    ).not.toBeInTheDocument();
    expect(document.querySelector('[data-seq="1"]')).toHaveTextContent(
      'Assistant',
    );
    expect(document.querySelector('[data-seq="1"]')).toHaveTextContent('Coder');
  },
);
