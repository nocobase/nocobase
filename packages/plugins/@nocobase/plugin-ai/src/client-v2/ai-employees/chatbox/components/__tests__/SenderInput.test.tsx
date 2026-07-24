/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Sender } from '../Sender';

const mocks = vi.hoisted(() => {
  const runtime = {
    mode: 'block',
    chatBoxModel: {
      currentEmployee: {
        username: 'sales',
        nickname: 'Sales',
      },
      readonly: false,
    },
    chatConversationModel: {
      currentConversation: undefined as string | undefined,
      webSearch: false,
      setWebSearch: vi.fn(),
    },
    chatSenderModel: {
      senderValue: 'prefill',
      isEditingMessage: false,
      editingMessageId: null as string | null,
      senderRef: null,
      setSenderValue: vi.fn((value: string) => {
        runtime.chatSenderModel.senderValue = value;
      }),
      setSenderRef: vi.fn((ref) => {
        runtime.chatSenderModel.senderRef = ref;
      }),
      setShowSenderHint: vi.fn(),
    },
  };

  return {
    runtime,
    send: vi.fn(),
    cancelRequest: vi.fn(),
    finishEditingMessage: vi.fn(),
  };
});

vi.mock('@ant-design/x', async () => {
  const React = await import('react');
  const MockButton = React.forwardRef<HTMLButtonElement, React.ComponentProps<'button'>>((props, ref) => (
    <button ref={ref} type="button" {...props} />
  ));
  MockButton.displayName = 'MockButton';

  return {
    Attachments: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Sender: React.forwardRef<
      { nativeElement?: HTMLTextAreaElement },
      {
        value?: string;
        onChange?: (value: string) => void;
        onBlur?: () => void;
        onSubmit?: (value: string) => void;
        footer?: (options: {
          components: { SendButton: typeof MockButton; LoadingButton: typeof MockButton };
        }) => React.ReactNode;
        header?: React.ReactNode;
      }
    >(({ value = '', onChange, onBlur, onSubmit, footer, header }, ref) => {
      const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
      React.useImperativeHandle(ref, () => ({
        nativeElement: textareaRef.current ?? undefined,
      }));

      return (
        <div>
          {header}
          <textarea
            data-testid="sender-input"
            ref={textareaRef}
            value={value}
            onBlur={onBlur}
            onChange={(event) => onChange?.(event.target.value)}
          />
          <button data-testid="sender-submit" type="button" onClick={() => onSubmit?.(value)}>
            submit
          </button>
          {footer?.({ components: { SendButton: MockButton, LoadingButton: MockButton } })}
        </div>
      );
    }),
  };
});

vi.mock('../../../../locale', () => ({
  useT: () => (text: string) => text,
}));

vi.mock('../AIEmployeeSwitcher', () => ({
  AIEmployeeSwitcher: () => null,
}));

vi.mock('../ModelSwitcher', () => ({
  ModelSwitcher: () => null,
}));

vi.mock('../SearchSwitch', () => ({
  SearchSwitch: () => null,
}));

vi.mock('../../../AddContextButton', () => ({
  AddContextButton: () => null,
}));

vi.mock('../Attachments', () => ({
  FileCardList: () => null,
  useAttachmentFileCards: () => [],
}));

vi.mock('../../hooks/useChat', () => ({
  useChat: () => ({
    use: {
      attachments: () => [],
      contextItems: () => [],
      systemMessage: () => '',
      responseLoading: () => false,
      skillSettings: () => null,
    },
    setAttachments: vi.fn(),
    addContextItems: vi.fn(),
    removeContextItem: vi.fn(),
    removeAttachment: vi.fn(),
    setMessages: vi.fn(),
  }),
}));

vi.mock('../../hooks/useChatBoxActions', () => ({
  useChatBoxActions: () => ({
    send: mocks.send,
  }),
}));

vi.mock('../../hooks/useChatMessageActions', () => ({
  useChatMessageActions: () => ({
    cancelRequest: mocks.cancelRequest,
    finishEditingMessage: mocks.finishEditingMessage,
    loadMessages: vi.fn(),
  }),
}));

vi.mock('../../hooks/useUploadFiles', () => ({
  useUploadFiles: () => ({}),
}));

vi.mock('../../stores/runtime', () => ({
  useChatBoxRuntime: () => mocks.runtime,
}));

describe('Sender input state', () => {
  beforeEach(() => {
    mocks.runtime.chatSenderModel.senderValue = 'prefill';
    mocks.runtime.chatSenderModel.setSenderValue.mockClear();
    mocks.runtime.chatSenderModel.setSenderRef.mockClear();
    mocks.runtime.chatSenderModel.setShowSenderHint.mockClear();
    mocks.send.mockClear();
  });

  it('keeps typing local until blur', () => {
    const { getByTestId } = render(
      <Sender
        showContextSelector={false}
        showUpload={false}
        showWebSearch={false}
        showEmployeeSelect={false}
        showModelSelect={false}
      />,
    );
    const input = getByTestId('sender-input') as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: 'typed locally' } });

    expect(input.value).toBe('typed locally');
    expect(mocks.runtime.chatSenderModel.setSenderValue).not.toHaveBeenCalled();

    fireEvent.blur(input);

    expect(mocks.runtime.chatSenderModel.setSenderValue).toHaveBeenCalledWith('typed locally');
  });

  it('submits local input and clears the external sender value', () => {
    const { getByTestId } = render(
      <Sender
        showContextSelector={false}
        showUpload={false}
        showWebSearch={false}
        showEmployeeSelect={false}
        showModelSelect={false}
      />,
    );
    const input = getByTestId('sender-input') as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: 'send this' } });
    fireEvent.click(getByTestId('sender-submit'));

    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ type: 'text', content: 'send this' }],
      }),
    );
    expect(mocks.runtime.chatSenderModel.setSenderValue).toHaveBeenCalledWith('');
  });
});
