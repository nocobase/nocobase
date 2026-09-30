// @vitest-environment jsdom
import type { Chat } from '@ai-sdk/react';
import { act, renderHook } from '@testing-library/react';
import type { UIMessage } from 'ai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatState } from '../registry/nocobase-ai/providers/use-chat-state.js';

function createChat() {
  const callbacks = new Set<() => void>();
  let messages: UIMessage[] = [];
  const chat = {
    get messages() {
      return messages;
    },
    status: 'ready',
    error: undefined,
    '~registerMessagesCallback': (onChange: () => void) => {
      callbacks.add(onChange);
      return () => callbacks.delete(onChange);
    },
    '~registerStatusCallback': () => () => {},
    '~registerErrorCallback': () => () => {},
  };
  const push = (id: string) => {
    messages = [...messages, { id, role: 'user', parts: [] }];
    callbacks.forEach((callback) => callback());
  };
  return { chat: chat as unknown as Chat<UIMessage>, push };
}

describe('useChatState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('throttles message updates and delivers the last one', () => {
    const { chat, push } = createChat();
    const { result } = renderHook(() => useChatState(chat));

    act(() => push('first'));
    act(() => push('second'));
    expect(result.current.messages.map((message) => message.id)).toEqual([
      'first',
    ]);

    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.messages.map((message) => message.id)).toEqual([
      'first',
      'second',
    ]);
  });

  it('cancels a throttled update when the subscription ends', () => {
    const { chat, push } = createChat();
    const { unmount } = renderHook(() => useChatState(chat));

    act(() => push('first'));
    act(() => push('second'));
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
