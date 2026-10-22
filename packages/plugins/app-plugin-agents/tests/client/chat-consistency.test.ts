import { afterEach, expect, it, vi } from 'vitest';
import { ChatController } from '../../client/chat/controller.js';
import { agentsQueryClient } from '../../client/query.js';
import { chatKeys } from '../../client/chat/keys.js';
import { ChatApi } from '../../client/chat/api.js';
import { DefaultChatTransport } from 'ai';
import type { ApiClient } from '@nocobase/app-client';
import type { AppUIMessage } from '../../client/chat.js';
import { uiMessage } from './sdk-chat.js';
import type { ConversationDetail } from '../../shared/conversations.js';
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { resolve, promise };
}
const message = (seq: number, clientId?: string): AppUIMessage =>
  uiMessage(seq, 'user', `Message ${seq}`, clientId);
const page = (
  items: AppUIMessage[],
  lastSeq: number,
  nextCursor: string | null = null,
): {
  items: AppUIMessage[];
  lastSeq: number;
  hasMore: boolean;
  nextCursor: string | null;
} => ({
  items,
  lastSeq,
  nextCursor,
  hasMore: !!nextCursor,
});
const detail = (title: string, status: 'idle' | 'running' = 'idle') =>
  ({ id: 'c', title, execution: { status } }) as ConversationDetail;
const controllers: ChatController[] = [];
function controller(api: Partial<ChatApi>) {
  const c = new ChatController({
    transport: () => new DefaultChatTransport(),
    ...api,
  } as ChatApi);
  controllers.push(c);
  return c;
}
afterEach(() => {
  controllers.splice(0).forEach((c) => c.dispose());
  agentsQueryClient().clear();
});
it('drains a coalesced fresh refresh after an older page, using loaded messages rather than the server watermark', async () => {
  const old = deferred<ReturnType<typeof page>>();
  const messages = vi
    .fn()
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce(page([message(11)], 11));
  const c = controller({ messages, conversation: async () => detail('fresh') });
  c.dispatch('c', { type: 'page', page: page([message(10)], 10, 'older') });
  const older = c.loadHistory('c', true);
  const refresh = c.refresh('c');
  await vi.waitFor(() => expect(messages).toHaveBeenCalledTimes(1));
  const again = c.loadHistory('c', false, true);
  old.resolve(page([message(1)], 11));
  await Promise.all([older, refresh, again]);
  expect(messages.mock.calls.map((call) => call[1])).toEqual([
    { pageToken: 'older' },
    { after: 10 },
  ]);
  expect(c.history('c').state.items.map((m) => m.metadata?.seq)).toEqual([
    1, 10, 11,
  ]);
});
it('does not let an older detail response overwrite a newer refresh', async () => {
  const a = deferred<ConversationDetail>(),
    b = deferred<ConversationDetail>();
  const conversation = vi
    .fn()
    .mockReturnValueOnce(a.promise)
    .mockReturnValueOnce(b.promise);
  const c = controller({ conversation, messages: async () => page([], 0) });
  const first = c.refresh('c'),
    second = c.refresh('c');
  b.resolve(detail('new'));
  await second;
  a.resolve(detail('old', 'running'));
  await first;
  expect(agentsQueryClient().getQueryData(chatKeys.conversation('c'))).toEqual(
    detail('new'),
  );
});
it.each(['Stop', 'Archive', 'Undo'])(
  'discards a detail read issued before or during %s',
  async (title) => {
    const old = deferred<ConversationDetail>(),
      during = deferred<ConversationDetail>(),
      result = deferred<ConversationDetail>();
    const c = controller({
      conversation: vi
        .fn()
        .mockReturnValueOnce(old.promise)
        .mockReturnValueOnce(during.promise),
      messages: async () => page([], 0),
    });
    const before = c.refresh('c');
    const request = vi.fn(() => result.promise);
    const command = c.command('c', request, (value) => value);
    await vi.waitFor(() => expect(request).toHaveBeenCalledOnce());
    const middle = c.refresh('c');
    during.resolve(detail('stale during', 'running'));
    await middle;
    result.resolve(detail(title));
    await command;
    old.resolve(detail('stale before', 'running'));
    await before;
    expect(
      agentsQueryClient().getQueryData(chatKeys.conversation('c')),
    ).toEqual(detail(title));
  },
);
it('merges canonical confirmation after a lost response exactly once without sending again or opening events', async () => {
  let saved: AppUIMessage | undefined;
  const post = vi.fn(async (options: { json: { message: AppUIMessage } }) => {
    saved = message(1, options.json.message.id);
    throw Error('Response lost');
  });
  const host = { stream: post } as unknown as ApiClient;
  const transportApi = new ChatApi(host);
  const c = controller({
    transport: (id, accepted) => transportApi.transport(id, accepted),
    messages: async () => page(saved ? [saved] : [], 1),
  });
  c.submissions.submit({
    conversationId: 'c',
    content: 'Hello',
    context: undefined,
    attachments: [],
    editorKey: 'probe',
    create: {},
  });
  await vi.waitFor(() =>
    expect(c.submissions.snapshot()[0].status).toBe('confirmed'),
  );
  c.submissions.observe('c', [saved!]);
  await c.submissions.reconcile(c.submissions.snapshot()[0].clientId);
  expect(c.history('c').state.items).toEqual([saved]);
  expect(post).toHaveBeenCalledOnce();
  expect(post.mock.calls[0][0]).toMatchObject({
    method: 'POST',
    path: 'agents/conversations/c/messages',
  });
});
it('rejects delayed history and commands from a previous Provider activation', async () => {
  const old = deferred<ReturnType<typeof page>>();
  const c = controller({ messages: () => old.promise });
  const load = c.loadHistory('c');
  const active = c.lifetime();
  c.invalidate();
  c.activate();
  old.resolve(page([message(1)], 1));
  await load;
  expect(active()).toBe(false);
  expect(c.history('c').state.loaded).toBe(false);
});

it('lets Stop finish while a prior send response is unknown and discards the late running result', async () => {
  const c = controller({});
  const unknown = deferred<ConversationDetail>();
  const send = c.command(
    'c',
    () => unknown.promise,
    (value) => value,
  );
  const stopped = c.command(
    'c',
    async () => detail('Stopped'),
    (value) => value,
  );
  await stopped;
  expect(agentsQueryClient().getQueryData(chatKeys.conversation('c'))).toEqual(
    detail('Stopped'),
  );
  unknown.resolve(detail('Late send', 'running'));
  await send;
  expect(agentsQueryClient().getQueryData(chatKeys.conversation('c'))).toEqual(
    detail('Stopped'),
  );
});

it('does not advance the history coverage past intervening messages after single-message confirmation', async () => {
  const messages = vi
    .fn()
    .mockResolvedValue(page([message(11), message(12)], 12));
  const c = controller({ messages });
  c.dispatch('c', { type: 'page', page: page([message(10)], 10) });
  c.dispatch('c', { type: 'confirmed', message: message(12) });
  expect(c.history('c').state.lastSeq).toBe(12);
  expect(c.history('c').loadedThrough).toBe(10);
  await c.loadHistory('c', false, true);
  expect(messages).toHaveBeenCalledWith('c', { after: 10 });
  expect(c.history('c').state.items.map((m) => m.metadata?.seq)).toEqual([
    10, 11, 12,
  ]);
  expect(c.history('c').loadedThrough).toBe(12);
});

it('does not clear the new identity cache when the previous Provider finishes deferred disposal', () => {
  const old = controller({});
  old.invalidate();
  const current = detail('Current identity');
  agentsQueryClient().setQueryData(chatKeys.conversation('c'), current);
  old.dispose();
  expect(agentsQueryClient().getQueryData(chatKeys.conversation('c'))).toEqual(
    current,
  );
});

it('keeps persisted source sequence authoritative when source timestamps are equal or skewed', async () => {
  const { timelineOrder } = await import('../../client/chat/message-model.js');
  const entries = [
    { key: 'first', seq: 2, rank: 0, at: '2026-01-01T00:00:03Z' },
    { key: 'notification', seq: 3, rank: 0, at: '2026-01-01T00:00:02Z' },
    { key: 'second', seq: 4, rank: 0, at: '2026-01-01T00:00:03Z' },
    { key: 'plan', rank: 1, at: '2026-01-01T00:00:02Z' },
  ];
  expect(
    timelineOrder(entries)
      .filter((entry) => entry.seq)
      .map((entry) => entry.key),
  ).toEqual(['first', 'notification', 'second']);
  expect(
    timelineOrder(entries).filter((entry) => entry.key === 'plan'),
  ).toHaveLength(1);
});
