/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubAgentDispatchCard } from '../ai-employees/tools/SubAgentDispatchCard';

type ChatMessage = {
  content?: {
    messageId?: string;
  };
};

const getAIEmployees = vi.fn().mockResolvedValue(undefined);
const chatState: {
  responseLoading: boolean;
  messages: ChatMessage[];
} = {
  responseLoading: true,
  messages: [{ content: {} }],
};

vi.mock('../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => ({
    aiEmployees: [
      {
        username: 'dex',
        nickname: 'Dex',
        position: 'Data analyst',
      },
    ],
    getAIEmployees,
  }),
}));

vi.mock('../ai-employees/chatbox/hooks/useChat', () => ({
  useChat: () => ({
    use: {
      responseLoading: () => chatState.responseLoading,
      messages: () => chatState.messages,
    },
  }),
}));

vi.mock('../ai-employees/chatbox/stores/chat-conversations', () => ({
  useChatConversationsStore: {
    use: {
      currentConversation: () => undefined,
    },
  },
}));

describe('SubAgentDispatchCard', () => {
  beforeEach(() => {
    getAIEmployees.mockClear();
    chatState.responseLoading = true;
    chatState.messages = [{ content: {} }];
  });

  it('shows loading for the current live message when message ids are still empty', () => {
    const { container } = render(
      <SubAgentDispatchCard
        messageId=""
        tools={{
          scope: 'GENERAL',
          from: 'loader',
          definition: {
            name: 'dispatch-sub-agent-task',
            description: '',
          },
        }}
        toolCall={{
          id: 'tool-1',
          type: 'function',
          name: 'dispatch-sub-agent-task',
          invokeStatus: 'pending',
          auto: true,
          args: {
            username: 'dex',
            question: 'Analyze this order.',
          },
        }}
        decisions={{
          approve: vi.fn().mockResolvedValue(undefined),
          edit: vi.fn().mockResolvedValue(undefined),
          reject: vi.fn().mockResolvedValue(undefined),
        }}
      />,
    );

    expect(container.querySelector('.ant-spin')).toBeTruthy();
  });

  it('does not show loading for historical messages', () => {
    chatState.responseLoading = false;

    const { container } = render(
      <SubAgentDispatchCard
        messageId=""
        tools={{
          scope: 'GENERAL',
          from: 'loader',
          definition: {
            name: 'dispatch-sub-agent-task',
            description: '',
          },
        }}
        toolCall={{
          id: 'tool-1',
          type: 'function',
          name: 'dispatch-sub-agent-task',
          invokeStatus: 'done',
          auto: true,
          args: {
            username: 'dex',
            question: 'Analyze this order.',
          },
        }}
        decisions={{
          approve: vi.fn().mockResolvedValue(undefined),
          edit: vi.fn().mockResolvedValue(undefined),
          reject: vi.fn().mockResolvedValue(undefined),
        }}
      />,
    );

    expect(container.querySelector('.ant-spin')).toBeNull();
  });
});
