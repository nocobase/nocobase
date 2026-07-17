/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import type { FlowModel } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import type { SenderOptions } from '../../../ai-employees/chatbox/components/Sender';
import type { AIChatBoxBlockModel } from '../AIChatBoxBlockModel';
import { MessagesAndSender } from '../components/MessagesAndSender';
import type { AIChatBoxBlockProps } from '../types';

const mocks = vi.hoisted(() => ({
  messagesRendered: false,
  senderProps: undefined as SenderOptions | undefined,
  switchAIEmployee: vi.fn(),
  getAIEmployees: vi.fn(),
  currentEmployee: { username: 'legacy', nickname: 'Legacy' },
  currentConversation: undefined as string | undefined,
  draftMessages: [] as Array<{ key: string; role?: string }>,
  setContextItems: vi.fn(),
}));

vi.mock('../../../locale', () => ({
  useT: () => (text: string) => text,
}));

vi.mock('../../../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => ({
    getAIEmployees: mocks.getAIEmployees,
  }),
}));

vi.mock('../../../ai-employees/chatbox/hooks/useChatBoxActions', () => ({
  useChatBoxActions: () => ({
    switchAIEmployee: mocks.switchAIEmployee,
  }),
}));

vi.mock('../../../ai-employees/chatbox/stores/runtime', () => ({
  useChatBoxRuntime: () => ({
    chatBoxModel: {
      currentEmployee: mocks.currentEmployee,
    },
    chatConversationModel: {
      currentConversation: mocks.currentConversation,
    },
  }),
}));

vi.mock('../../../ai-employees/chatbox/hooks/useChat', () => ({
  useChat: () => ({
    setContextItems: mocks.setContextItems,
    use: {
      messages: () => mocks.draftMessages,
    },
  }),
}));

vi.mock('../../../ai-employees/chatbox/components/Messages', () => ({
  Messages: () => {
    mocks.messagesRendered = true;
    return <div data-testid="messages" />;
  },
}));

vi.mock('../../../ai-employees/chatbox/components/Sender', () => ({
  Sender: (props: SenderOptions) => {
    mocks.senderProps = props;
    return <div data-testid="sender" />;
  },
}));

const makeFlowModel = (uid: string, title: string) => {
  return {
    uid,
    title,
    use: 'PlainBlockModel',
    constructor: {
      name: 'PlainBlockModel',
    },
  } as FlowModel;
};

const makeModel = (props: AIChatBoxBlockProps): AIChatBoxBlockModel => {
  const bodyBlocks = [makeFlowModel('body-1', 'Body one')];
  return {
    uid: 'chat-box-1',
    props,
    mapSubModels: (_subKey: string, callback: (model: FlowModel, index: number) => unknown) =>
      bodyBlocks.map((bodyBlock, index) => callback(bodyBlock, index)),
  } as AIChatBoxBlockModel;
};

describe('MessagesAndSender', () => {
  it('keeps messages in a bounded flex region above the sender', () => {
    mocks.messagesRendered = false;
    mocks.currentConversation = undefined;
    mocks.draftMessages = [];
    mocks.setContextItems.mockReset();
    mocks.getAIEmployees.mockResolvedValue([]);

    const { container } = render(
      <MessagesAndSender
        model={makeModel({
          showMessages: true,
          showDisclaimer: false,
        })}
      />,
    );

    const messages = screen.getByTestId('messages');
    const messagesRegion = messages.parentElement;
    const senderRegion = screen.getByTestId('sender').parentElement;
    expect(messagesRegion?.getAttribute('style')).toContain('flex: 1 1 0');
    expect(messagesRegion?.getAttribute('style')).toContain('overflow: hidden');
    expect(mocks.messagesRendered).toBe(true);
    expect(senderRegion?.tagName).toBe('DIV');
    expect(senderRegion?.getAttribute('style')).toContain('flex: 0 0 auto');
    expect(senderRegion?.getAttribute('style')).toContain('position: relative');
  });

  it('passes AI chat box settings to the real sender and switches to an allowed employee', async () => {
    mocks.senderProps = undefined;
    mocks.switchAIEmployee.mockReset();
    mocks.currentConversation = undefined;
    mocks.draftMessages = [{ key: 'draft-greeting' }];
    mocks.setContextItems.mockReset();
    mocks.getAIEmployees.mockResolvedValue([
      { username: 'sales', nickname: 'Sales assistant', category: 'business' },
      { username: 'support', nickname: 'Support assistant', category: 'business' },
    ]);

    const { container } = render(
      <MessagesAndSender
        model={makeModel({
          showMessages: false,
          showContextSelector: false,
          showUpload: false,
          showWebSearch: false,
          showEmployeeSelect: false,
          showModelSelect: false,
          showDisclaimer: false,
          senderPlaceholder: 'Ask sales',
          systemPrompt: 'Use sales tone',
          defaultUserMessage: 'Summarize this block',
          selectedBlocks: [{ type: 'flow-model', uid: 'external-1', title: 'External' }],
          allowedAIEmployees: ['sales'],
          allowedModels: ['openai:gpt'],
        })}
      />,
    );

    expect(container.firstElementChild?.getAttribute('style')).toContain('max-height: 100%');
    expect(screen.queryByTestId('messages')).toBeNull();
    expect(screen.getByTestId('sender')).toBeInTheDocument();
    expect(mocks.senderProps).toMatchObject({
      containerStyle: { margin: '8px 0' },
      placeholder: 'Ask sales',
      showContextSelector: false,
      showUpload: false,
      showWebSearch: false,
      showEmployeeSelect: false,
      showModelSelect: false,
      sendContextItems: true,
      allowedAIEmployees: ['sales'],
      allowedModels: ['openai:gpt'],
      defaultSystemMessage: 'Use sales tone',
      defaultUserMessage: 'Summarize this block',
    });
    expect(mocks.setContextItems).toHaveBeenCalledWith(expect.any(Function));
    expect(mocks.setContextItems.mock.calls[0][0]([{ type: 'flow-model', uid: 'manual-1', title: 'Manual' }])).toEqual([
      { type: 'flow-model', uid: 'manual-1', title: 'Manual' },
      { type: 'flow-model', uid: 'external-1', title: 'External' },
    ]);

    await waitFor(() => expect(mocks.switchAIEmployee).toHaveBeenCalled());
    expect(mocks.switchAIEmployee.mock.calls[0][0]).toMatchObject({ username: 'sales' });
    expect(mocks.switchAIEmployee.mock.calls[0][1]).toEqual({
      clear: {
        sender: false,
        attachments: false,
        contextItems: false,
      },
    });
  });

  it('does not inject configured work context into existing conversations', () => {
    mocks.senderProps = undefined;
    mocks.currentConversation = 'session-1';
    mocks.draftMessages = [{ key: 'session-message' }];
    mocks.setContextItems.mockReset();
    mocks.getAIEmployees.mockResolvedValue([]);

    render(
      <MessagesAndSender
        model={makeModel({
          showMessages: false,
          showDisclaimer: false,
          selectedBlocks: [{ type: 'flow-model', uid: 'external-1', title: 'External' }],
        })}
      />,
    );
    expect(mocks.setContextItems).not.toHaveBeenCalled();
  });

  it('does not inject configured work context again after the draft has user messages', () => {
    mocks.senderProps = undefined;
    mocks.currentConversation = undefined;
    mocks.draftMessages = [{ key: 'draft-user-message', role: 'user' }];
    mocks.setContextItems.mockReset();
    mocks.getAIEmployees.mockResolvedValue([]);

    render(
      <MessagesAndSender
        model={makeModel({
          showMessages: false,
          showDisclaimer: false,
          selectedBlocks: [{ type: 'flow-model', uid: 'external-1', title: 'External' }],
        })}
      />,
    );

    expect(mocks.setContextItems).not.toHaveBeenCalled();
  });
});
