// @vitest-environment jsdom
import { QueryObserver } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import type {
  ConversationDetail,
  ConversationListQuery,
} from '../../shared/conversations.js';
import { agentsQueryClient } from '../../client/query.js';
import { chatKeys } from '../../client/chat/keys.js';
import { sdkController } from './sdk-controller.js';

const fixtures: ReturnType<typeof sdkController>[] = [];
const off: (() => void)[] = [];
afterEach(() => {
  off.splice(0).forEach((stop) => stop());
  fixtures.splice(0).forEach((f) => f.controller.dispose());
  agentsQueryClient().clear();
  vi.useRealTimers();
});
const detail = (id: string, at: string) =>
  ({
    id,
    lastMessageAt: at,
    updatedAt: at,
    lastSeq: 2,
    archivedAt: null,
    showInChatList: true,
    execution: { status: 'idle' },
  }) as ConversationDetail;
function fixture(
  items: ConversationDetail[],
  nextCursor: string | null = null,
  query: ConversationListQuery = { archived: false },
) {
  vi.useFakeTimers();
  const f = sdkController();
  fixtures.push(f);
  const data = { pages: [{ items, nextCursor }], pageParams: [null] };
  const read = vi.fn(async () => data);
  const key = chatKeys.list(query);
  const observer = new QueryObserver(agentsQueryClient(), {
    queryKey: key,
    queryFn: read,
    initialData: data,
    staleTime: Infinity,
  });
  off.push(observer.subscribe(() => {}));
  return { controller: f.controller, read, key };
}
it('updates the first row from terminal detail without changing order or pagination', async () => {
  const first = detail('c1', '2026-10-30T10:00:00Z'),
    second = detail('c2', '2026-10-30T09:00:00Z');
  const f = fixture([first, second], 'next-page');
  const ended = {
    ...first,
    lastMessageAt: '2026-10-30T11:00:00Z',
    updatedAt: '2026-10-30T11:00:00Z',
    execution: { status: 'idle', outcome: 'completed' },
  } as ConversationDetail;
  f.controller.observeDetail(ended);
  await vi.advanceTimersByTimeAsync(400);
  expect(f.read).not.toHaveBeenCalled();
  const cached = agentsQueryClient().getQueryData<{
    pages: { items: ConversationDetail[]; nextCursor: string }[];
  }>(f.key)!;
  expect(cached.pages[0]!.items.map((item) => item.id)).toEqual(['c1', 'c2']);
  expect(cached.pages[0]!.items[0]!.execution?.outcome).toBe('completed');
  expect(cached.pages[0]!.nextCursor).toBe('next-page');
  f.controller.observeDetail({ ...first, lastSeq: 1 });
  expect(agentsQueryClient().getQueryData(f.key)).toBe(cached);
});
it.each(['order', 'cursor', 'membership', 'filter'])(
  'rereads the list when %s may change',
  async (reason) => {
    const first = detail('c1', '2026-10-30T10:00:00Z'),
      second = detail('c2', '2026-10-30T09:00:00Z');
    const f = fixture(
      reason === 'cursor' ? [first] : [first, second],
      reason === 'cursor' ? 'next-page' : null,
      reason === 'filter'
        ? { archived: false, q: 'search' }
        : { archived: false },
    );
    const changed =
      reason === 'order'
        ? { ...second, lastMessageAt: '2026-10-30T11:00:00Z' }
        : reason === 'cursor'
          ? { ...first, lastMessageAt: '2026-10-30T11:00:00Z' }
          : reason === 'membership'
            ? { ...first, archivedAt: '2026-10-30T11:00:00Z' }
            : first;
    f.controller.observeDetail(changed);
    await vi.advanceTimersByTimeAsync(400);
    expect(f.read).toHaveBeenCalledOnce();
  },
);
