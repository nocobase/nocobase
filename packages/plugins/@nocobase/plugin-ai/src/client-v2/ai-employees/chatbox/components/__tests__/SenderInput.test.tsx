/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
      chatBoxRef: {
        current: null as HTMLDivElement | null,
      },
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
    attachmentsGetDropContainer: undefined as (() => HTMLElement | null | undefined) | undefined,
    resize: undefined as ((width: number) => void) | undefined,
    disconnect: vi.fn(),
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
    Attachments: ({
      children,
      getDropContainer,
    }: {
      children?: React.ReactNode;
      getDropContainer?: () => HTMLElement | null | undefined;
    }) => {
      mocks.attachmentsGetDropContainer = getDropContainer;
      return <div>{children}</div>;
    },
    Sender: React.forwardRef<
      { nativeElement?: HTMLTextAreaElement },
      {
        autoSize?: { minRows: number; maxRows: number };
        submitType?: string;
        value?: string;
        onChange?: (value: string) => void;
        onBlur?: () => void;
        onSubmit?: (value: string) => void;
        footer?: (options: {
          components: { SendButton: typeof MockButton; LoadingButton: typeof MockButton };
        }) => React.ReactNode;
        header?: React.ReactNode;
      }
    >(({ value = '', onChange, onBlur, onSubmit, footer, header, autoSize, submitType }, ref) => {
      const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
      React.useImperativeHandle(ref, () => ({
        nativeElement: textareaRef.current ?? undefined,
      }));

      return (
        <div>
          {header}
          <textarea
            data-testid="sender-input"
            data-min-rows={autoSize?.minRows}
            data-submit-type={submitType}
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

vi.mock('../CompactSenderOptions', () => ({
  CompactSenderOptions: () => <button type="button">Chat options</button>,
}));
describe('Sender input state', () => {
  beforeEach(() => {
    mocks.resize = undefined;
    mocks.disconnect.mockClear();
    vi.stubGlobal(
      'ResizeObserver',
      class implements ResizeObserver {
        constructor(callback: ResizeObserverCallback) {
          mocks.resize = (width) =>
            callback(
              [
                {
                  target: document.createElement('div'),
                  contentRect: new DOMRect(0, 0, width, 100),
                  borderBoxSize: [],
                  contentBoxSize: [],
                  devicePixelContentBoxSize: [],
                },
              ],
              this,
            );
        }
        observe() {}
        unobserve() {}
        disconnect = mocks.disconnect;
      },
    );
    mocks.runtime.chatSenderModel.senderValue = 'prefill';
    mocks.runtime.chatSenderModel.setSenderValue.mockClear();
    mocks.runtime.chatSenderModel.setSenderRef.mockClear();
    mocks.runtime.chatSenderModel.setShowSenderHint.mockClear();
    mocks.runtime.chatBoxModel.chatBoxRef.current = null;
    mocks.attachmentsGetDropContainer = undefined;
    mocks.send.mockClear();
  });

  afterEach(() => vi.unstubAllGlobals());
  it('limits attachment drops to the mounted chat box', () => {
    const dropContainer = document.createElement('div');
    mocks.runtime.chatBoxModel.chatBoxRef.current = dropContainer;

    render(
      <Sender showContextSelector={false} showWebSearch={false} showEmployeeSelect={false} showModelSelect={false} />,
    );

    expect(mocks.attachmentsGetDropContainer?.()).toBe(dropContainer);
    mocks.runtime.chatBoxModel.chatBoxRef.current = null;
    expect(mocks.attachmentsGetDropContainer?.()).toBeNull();
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

  it('does not submit whitespace-only input', () => {
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

    fireEvent.change(input, { target: { value: '   \n\t' } });
    fireEvent.click(getByTestId('sender-submit'));

    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.runtime.chatSenderModel.setSenderValue).not.toHaveBeenCalledWith('');
  });

  it('uses a compact single-row toolbar for narrow containers and preserves the input across resizing', () => {
    const { container, getByTestId, getByRole, unmount } = render(<Sender />);
    const input = getByTestId('sender-input') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '未发送的草稿' } });

    act(() => mocks.resize?.(320));
    expect(container.querySelector('.ai-chat-sender-compact-toolbar')).not.toBeNull();
    expect(getByRole('button', { name: 'Chat options' })).toBeTruthy();
    expect(input.getAttribute('data-min-rows')).toBe('1');
    expect(input.getAttribute('data-submit-type')).toBe('shiftEnter');
    expect(fireEvent.keyDown(input, { key: 'Enter' })).toBe(true);
    expect(mocks.send).not.toHaveBeenCalled();

    act(() => mocks.resize?.(480));
    expect(container.querySelector('.ai-chat-sender-compact-toolbar')).not.toBeNull();
    act(() => mocks.resize?.(0));
    expect(container.querySelector('.ai-chat-sender-compact-toolbar')).not.toBeNull();
    act(() => mocks.resize?.(481));
    expect(container.querySelector('.ai-chat-sender-compact-toolbar')).toBeNull();
    expect(input.value).toBe('未发送的草稿');
    expect(input.getAttribute('data-submit-type')).toBe('enter');
    expect(input.getAttribute('data-min-rows')).toBe('2');
    unmount();
    expect(mocks.disconnect).toHaveBeenCalled();
  });

  it('does not intercept Enter while an IME composition is in progress', () => {
    const { getByTestId } = render(<Sender />);
    const input = getByTestId('sender-input');
    expect(fireEvent.keyDown(input, { key: 'Enter', isComposing: true })).toBe(true);
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
