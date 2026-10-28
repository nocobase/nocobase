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
import { AIChatBoxView } from '../components/AIChatBoxView';

const mocks = vi.hoisted(() => ({
  model: {
    uid: 'mobile-chat',
    props: { minWidth: 600, showMessages: false },
    decoratorProps: {},
    context: { flowSettingsEnabled: false },
    mapSubModels: () => [],
    renderActions: () => null,
  },
  runtime: { chatConversationModel: { currentConversation: undefined, setConversationRead: vi.fn() } },
  eventBus: { addEventListener: vi.fn(), removeEventListener: vi.fn() },
  refresh: vi.fn(),
  unregister: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({ useApp: () => ({ eventBus: mocks.eventBus }) }));
vi.mock('@nocobase/flow-engine', () => ({
  observer: (component: unknown) => component,
  useFlowContext: () => ({ model: mocks.model }),
  DndProvider: ({ children }: React.PropsWithChildren) => children,
}));
vi.mock('../../../locale', () => ({ useT: () => (text: string) => text }));
vi.mock('../sub-models', () => ({ isAIChatBoxCoreModel: () => true }));
vi.mock('../../../ai-employees/chatbox', () => ({
  useChatBoxRuntime: () => mocks.runtime,
  useChat: () => ({}),
  useChatBoxActions: () => ({}),
  useChatConversationActions: () => ({ refresh: mocks.refresh }),
  useChatMessageActions: () => ({}),
  registerMountedChatBox: () => mocks.unregister,
  ChatBoxUnreadBadge: ({ children }: React.PropsWithChildren) => children,
  Conversations: ({ onOpen }: { onOpen: () => void }) => <button onClick={onOpen}>Open conversation</button>,
  Messages: () => <div>Message history</div>,
}));

describe('AI chat box responsive shell', () => {
  beforeEach(() => vi.clearAllMocks());

  it('caps a configured desktop minimum width at its available container width', () => {
    const { container } = render(<AIChatBoxView />);
    expect((container.firstElementChild as HTMLElement).style.minWidth).toBe('min(100%, 600px)');
    expect(container.querySelector('.ai-chat-box-header')).not.toBeNull();
  });

  it('keeps space for dismissing the conversation panel on narrow screens', () => {
    const { getByRole, queryByRole } = render(<AIChatBoxView />);
    fireEvent.click(getByRole('button', { name: 'Conversation list' }));
    const openButton = getByRole('button', { name: 'Open conversation' });
    const panel = openButton.parentElement?.parentElement;
    expect(panel?.style.maxWidth).toBe('calc(100% - 44px)');
    fireEvent.click(openButton);
    expect(queryByRole('button', { name: 'Close conversation list' })).toBeNull();
  });

  it('closes message history with Escape without dismissing an enclosing view', () => {
    const { getByRole, getByText, queryByText } = render(<AIChatBoxView />);
    fireEvent.click(getByRole('button', { name: 'Messages' }));
    expect(getByText('Message history')).toBeTruthy();
    fireEvent.keyDown(getByText('Message history'), { key: 'Escape' });
    expect(queryByText('Message history')).toBeNull();
  });

  it('prevents Space on the backdrop from scrolling the surrounding page', () => {
    const { getByRole, queryByRole } = render(<AIChatBoxView />);
    fireEvent.click(getByRole('button', { name: 'Conversation list' }));
    const allowedDefault = fireEvent.keyDown(getByRole('button', { name: 'Close conversation list' }), { key: ' ' });
    expect(allowedDefault).toBe(false);
    expect(queryByRole('button', { name: 'Close conversation list' })).toBeNull();
  });
});
