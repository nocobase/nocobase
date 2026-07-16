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
  senderProps: undefined as SenderOptions | undefined,
  switchAIEmployee: vi.fn(),
  getAIEmployees: vi.fn(),
  currentEmployee: { username: 'legacy', nickname: 'Legacy' },
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
  }),
}));

vi.mock('../../../ai-employees/chatbox/components/Messages', () => ({
  Messages: () => <div data-testid="messages" />,
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
  it('passes AI chat box settings to the real sender and switches to an allowed employee', async () => {
    mocks.senderProps = undefined;
    mocks.switchAIEmployee.mockReset();
    mocks.getAIEmployees.mockResolvedValue([
      { username: 'sales', nickname: 'Sales assistant', category: 'business' },
      { username: 'support', nickname: 'Support assistant', category: 'business' },
    ]);

    render(
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

    expect(screen.queryByTestId('messages')).toBeNull();
    expect(screen.getByTestId('sender')).toBeInTheDocument();
    expect(mocks.senderProps).toMatchObject({
      placeholder: 'Ask sales',
      showContextSelector: false,
      showUpload: false,
      showWebSearch: false,
      showEmployeeSelect: false,
      showModelSelect: false,
      allowedAIEmployees: ['sales'],
      allowedModels: ['openai:gpt'],
      defaultSystemMessage: 'Use sales tone',
      defaultUserMessage: 'Summarize this block',
      defaultWorkContext: [
        { type: 'flow-model', uid: 'external-1', title: 'External' },
        { type: 'flow-model', uid: 'body-1', title: 'Body one' },
      ],
    });

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
});
