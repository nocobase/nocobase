/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Conversation } from '../../../types';
import { ChatBoxRuntimeProvider, createChatBoxRuntime } from '../../stores/runtime';
import { ChatBoxUnreadBadge } from '../ChatBoxUnreadBadge';

const conversation = (sessionId: string, read: boolean): Conversation =>
  ({
    sessionId,
    read,
  }) as Conversation;

describe('ChatBoxUnreadBadge', () => {
  it('uses loaded scoped conversations in block mode', () => {
    const runtime = createChatBoxRuntime({ mode: 'block' });
    runtime.chatConversationModel.setConversations([conversation('session-a', true)]);
    runtime.chatConversationModel.setUnreadCount(3);

    const { container, rerender } = render(
      <ChatBoxRuntimeProvider runtime={runtime}>
        <ChatBoxUnreadBadge>
          <button type="button">Conversations</button>
        </ChatBoxUnreadBadge>
      </ChatBoxRuntimeProvider>,
    );

    expect(container.querySelector('.ant-badge-dot')).toBeFalsy();

    act(() => {
      runtime.chatConversationModel.setConversations([
        conversation('session-a', true),
        conversation('session-b', false),
      ]);
    });
    rerender(
      <ChatBoxRuntimeProvider runtime={runtime}>
        <ChatBoxUnreadBadge>
          <button type="button">Conversations</button>
        </ChatBoxUnreadBadge>
      </ChatBoxRuntimeProvider>,
    );

    expect(container.querySelector('.ant-badge-dot')).toBeTruthy();
  });

  it('uses runtime unread counts in global mode', () => {
    const runtime = createChatBoxRuntime({ mode: 'global' });
    runtime.chatConversationModel.setConversations([conversation('session-a', true)]);
    runtime.chatConversationModel.setUnreadCount(0);
    runtime.workflowTaskModel.setUnreadCount(1);

    const { container } = render(
      <ChatBoxRuntimeProvider runtime={runtime}>
        <ChatBoxUnreadBadge>
          <button type="button">Conversations</button>
        </ChatBoxUnreadBadge>
      </ChatBoxRuntimeProvider>,
    );

    expect(container.querySelector('.ant-badge-dot')).toBeTruthy();
  });
});
