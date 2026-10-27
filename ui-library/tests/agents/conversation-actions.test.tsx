import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';

import {
  resetChatDemo,
  useConversation,
  useConversationActions,
  useConversationList,
  useConversationMessages,
} from '../../website/demo/agents/agents-chat-client';

afterEach(() => resetChatDemo());

it('deletes a preview conversation and its messages without changing other conversations', () => {
  const { result } = renderHook(() => ({
    actions: useConversationActions(),
    list: useConversationList({ archived: 'all' }),
    conversation: useConversation('release-plan'),
    neighbor: useConversation('naming'),
    messages: useConversationMessages('release-plan'),
  }));
  expect(result.current.conversation.data?.id).toBe('release-plan');
  expect(result.current.messages.items.length).toBeGreaterThan(0);
  const neighbor = result.current.neighbor.data;

  act(() => result.current.actions.remove.mutate('release-plan'));

  expect(result.current.conversation.data).toBeUndefined();
  expect(
    result.current.list.data?.pages[0]?.items.map((item) => item.id),
  ).not.toContain('release-plan');
  expect(result.current.messages.items).toEqual([]);
  expect(result.current.neighbor.data).toEqual(neighbor);
});
