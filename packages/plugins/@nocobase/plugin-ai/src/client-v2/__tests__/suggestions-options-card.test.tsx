/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SuggestionsOptionsCard } from '../ai-employees/tools/SuggestionsOptionsCard';

const chatState: {
  responseLoading: boolean;
  messages: Array<{ content?: { messageId?: string } }>;
} = {
  responseLoading: false,
  messages: [{ content: { messageId: 'message-1' } }],
};

vi.mock('../locale', () => ({
  useT: () => (text: string) => text,
}));

vi.mock('../ai-employees/chatbox/hooks/useChat', () => ({
  useChat: () => ({
    use: {
      responseLoading: () => chatState.responseLoading,
      messages: () => chatState.messages,
    },
  }),
}));

vi.mock('../ai-employees/chatbox/stores/chat-box', () => ({
  useChatBoxStore: {
    use: {
      readonly: () => false,
    },
  },
}));

vi.mock('../ai-employees/chatbox/stores/chat-conversations', () => ({
  useChatConversationsStore: {
    use: {
      currentConversation: () => undefined,
    },
  },
}));

const createProps = () => ({
  messageId: 'message-1',
  tools: {
    scope: 'GENERAL' as const,
    from: 'loader' as const,
    definition: {
      name: 'suggestions',
      description: '',
    },
  },
  toolCall: {
    id: 'tool-1',
    type: 'function',
    name: 'suggestions',
    invokeStatus: 'interrupted' as const,
    auto: false,
    args: {
      options: ['Approve', 'Reject'],
    },
  },
  decisions: {
    approve: vi.fn().mockResolvedValue(undefined),
    edit: vi.fn().mockResolvedValue(undefined),
    reject: vi.fn().mockResolvedValue(undefined),
  },
});

describe('SuggestionsOptionsCard', () => {
  beforeEach(() => {
    chatState.responseLoading = false;
    chatState.messages = [{ content: { messageId: 'message-1' } }];
  });

  it('keeps the clicked suggestion disabled instead of switching to loading', () => {
    const props = createProps();
    const { container, rerender } = render(<SuggestionsOptionsCard {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    chatState.responseLoading = true;
    rerender(<SuggestionsOptionsCard {...props} />);

    expect(container.querySelector('.ant-spin')).toBeNull();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
    expect(props.decisions.edit).toHaveBeenCalledWith({
      options: ['Approve', 'Reject'],
      option: 'Approve',
    });
  });

  it('shows loading while suggestions are still generating before a user choice', () => {
    chatState.responseLoading = true;

    const { container } = render(<SuggestionsOptionsCard {...createProps()} />);

    expect(container.querySelector('.ant-spin')).toBeTruthy();
    expect(screen.getByText('Generating...')).toBeTruthy();
  });
});
