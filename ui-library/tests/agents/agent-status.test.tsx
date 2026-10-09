import type {
  ConversationDetail,
  ConversationMessage,
} from '@nocobase/app-plugin-agents/shared/conversations';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

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
  'renders online fallback notices and actions in %s',
  async (locale, resources, reason, action) => {
    const runtime = await createTestI18nRuntime({
      locale,
      application: { namespace: 'chat-test', resources },
    });
    const messages: ConversationMessage[] = [
      {
        id: 'switched',
        conversationId: 'chat',
        seq: 1,
        role: 'system',
        content: { type: 'text', content: 'untranslated' },
        toolCalls: null,
        attachments: null,
        workContext: null,
        metadata: {
          notice: {
            code: 'switchedToOnline',
            agentId: 'assistant',
            fromAgentId: 'coder',
          },
        },
        runId: null,
        createdAt: at,
      },
      {
        id: 'unavailable',
        conversationId: 'chat',
        seq: 2,
        role: 'system',
        content: { type: 'text', content: 'untranslated' },
        toolCalls: null,
        attachments: null,
        workContext: null,
        metadata: {
          notice: {
            code: 'onlineFallbackUnavailable',
            fromAgentId: 'coder',
            reason: 'modelUnavailable',
          },
        },
        runId: null,
        createdAt: at,
      },
    ];
    render(
      <TestI18nProvider runtime={runtime}>
        <AgentNotice
          conversation={conversation}
          busy={false}
          onFallback={vi.fn()}
          onRestore={vi.fn()}
        />
        <AgentNotice
          conversation={{
            ...conversation,
            fallbackFrom: null,
            canFallback: true,
            availability: {
              online: false,
              reason: 'noRunner',
              onlineRunners: 0,
            },
          }}
          busy={false}
          onFallback={vi.fn()}
          onRestore={vi.fn()}
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
    expect(screen.getByTestId('chat-fallback')).toHaveTextContent('Assistant');
    expect(screen.getByTestId('chat-fallback')).toHaveTextContent('Coder');
    expect(screen.getByTestId('chat-fallback')).not.toHaveTextContent(
      /system default|系统默认/,
    );
    expect(screen.getByRole('button', { name: action })).toBeVisible();
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
