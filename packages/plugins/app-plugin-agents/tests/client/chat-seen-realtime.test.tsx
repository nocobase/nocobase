// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { QueryObserver } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { api, clientMocks, realtime, resetApi } from './fake-client.js';
import {
  CONVERSATIONS_TOPIC,
  type ConversationDetail,
} from '../../shared/conversations.js';

const readiness = vi.hoisted(() => ({
  reconnect: undefined as (() => void) | undefined,
}));
vi.mock('@nocobase/app-client', async () => ({
  ...(await clientMocks.appClient()),
  useRealtimeReadiness: (topics: string[], reconnect?: () => void) => {
    if (topics.includes(CONVERSATIONS_TOPIC)) readiness.reconnect = reconnect;
    return true;
  },
}));
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());

const { ChatClientProvider, useChatController } =
  await import('../../client/chat/controller.js');
const { useChatRealtime } = await import('../../client/chat/use-chat.js');
const { agentsQueryClient } = await import('../../client/query.js');
const { chatKeys } = await import('../../client/chat/keys.js');
const { CHAT_INVALIDATION_MS } =
  await import('../../client/chat/coalesced-invalidation.js');
const { ApiClientError } = await vi.importActual<
  typeof import('@nocobase/app-client')
>('@nocobase/app-client');

const off: (() => void)[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  resetApi({});
  readiness.reconnect = undefined;
  agentsQueryClient().clear();
});
afterEach(() => {
  cleanup();
  off.splice(0).forEach((stop) => stop());
  agentsQueryClient().clear();
  vi.useRealTimers();
});

async function fixture() {
  let detail = {
    id: 'c1',
    lastSeq: 5,
    seenSeq: 4,
    read: false,
  } as ConversationDetail;
  const reads = {
    detail: vi.fn(async () => detail),
    links: vi.fn(async () => []),
    usage: vi.fn(async () => ({})),
    list: vi.fn(async () => []),
  };
  const client = agentsQueryClient();
  const key = chatKeys.conversation('c1');
  for (const [queryKey, queryFn] of [
    [key, reads.detail],
    [[...key, 'links'], reads.links],
    [[...key, 'usage'], reads.usage],
    [chatKeys.list({}), reads.list],
  ] as const) {
    const observer = new QueryObserver(client, {
      queryKey,
      queryFn,
      staleTime: Infinity,
      retry: false,
    });
    off.push(observer.subscribe(() => {}));
  }
  let controller!: ReturnType<typeof useChatController>;
  function Watch() {
    controller = useChatController();
    useChatRealtime(true);
    return null;
  }
  render(
    <ChatClientProvider>
      <Watch />
    </ChatClientProvider>,
  );
  await act(async () => vi.advanceTimersByTimeAsync(0));
  const settle = () =>
    act(async () => vi.advanceTimersByTimeAsync(CHAT_INVALIDATION_MS * 2));
  const seen = (seenSeq?: number) => {
    realtime.publish(CONVERSATIONS_TOPIC, {
      kind: 'conversation.changed',
      conversationId: 'c1',
      ...(seenSeq === undefined ? {} : { seenSeq }),
    });
  };
  const update = (seenSeq: number) => {
    detail = { ...detail, seenSeq, read: seenSeq >= detail.lastSeq };
    return detail;
  };
  const patch = (values: Partial<ConversationDetail>) => {
    detail = { ...detail, ...values };
    return detail;
  };
  return { client, key, reads, seen, update, patch, settle, controller };
}

it.each(['before', 'after'])(
  'shares the originating tab receipt when its event arrives %s the HTTP response',
  async (order) => {
    const f = await fixture();
    const receipt = Promise.withResolvers<ConversationDetail>();
    api.routes['POST agents/conversations/c1/markRead'] = () => receipt.promise;
    const marking = f.controller.markRead('c1');
    if (order === 'before') {
      f.seen(5);
      await f.settle();
    }
    await act(async () => {
      receipt.resolve(f.update(5));
      await marking;
    });
    if (order === 'after') f.seen(5);
    await f.settle();
    expect(f.reads.list).toHaveBeenCalledTimes(2);
    expect(f.reads.detail).toHaveBeenCalledTimes(1);
    expect(f.reads.links).toHaveBeenCalledTimes(1);
    expect(f.reads.usage).toHaveBeenCalledTimes(1);
    expect(f.client.getQueryData<ConversationDetail>(f.key)?.seenSeq).toBe(5);
  },
);

it('refreshes another tab’s exact detail without its links or usage', async () => {
  const f = await fixture();
  f.update(5);
  f.seen(5);
  await f.settle();
  expect(f.reads.list).toHaveBeenCalledTimes(2);
  expect(f.reads.detail).toHaveBeenCalledTimes(2);
  expect(f.reads.links).toHaveBeenCalledTimes(1);
  expect(f.reads.usage).toHaveBeenCalledTimes(1);
  expect(f.client.getQueryData<ConversationDetail>(f.key)?.seenSeq).toBe(5);
});

it.each(['read', 'needsYou'] as const)(
  'refreshes another tab after a %s-only acknowledgement at the same read position',
  async (field) => {
    const f = await fixture();
    const before = f.patch({
      seenSeq: 5,
      read: field !== 'read',
      needsYou:
        field === 'needsYou' ? { reason: 'reply', seq: 5, text: null } : null,
    });
    f.client.setQueryData(f.key, before);
    const after = f.patch({ read: true, needsYou: null });
    f.seen();
    await f.settle();
    expect(f.client.getQueryData(f.key)).toEqual(after);
    expect(f.reads.detail).toHaveBeenCalledTimes(2);
    expect(f.reads.links).toHaveBeenCalledTimes(2);
    expect(f.reads.usage).toHaveBeenCalledTimes(2);
  },
);

it('retains the full prefix refresh for old events without a read position', async () => {
  const f = await fixture();
  f.seen();
  await f.settle();
  for (const read of Object.values(f.reads))
    expect(read).toHaveBeenCalledTimes(2);
});

it('retains a trailing exact read when a seen event overtakes an in-flight snapshot', async () => {
  const f = await fixture();
  const stale = f.client.getQueryData<ConversationDetail>(f.key)!;
  const gate = Promise.withResolvers<ConversationDetail>();
  f.reads.detail.mockReturnValueOnce(gate.promise);
  const reading = f.client.refetchQueries({ queryKey: f.key, exact: true });
  f.update(5);
  f.seen(5);
  await f.settle();
  expect(f.reads.detail).toHaveBeenCalledTimes(2);
  await act(async () => {
    gate.resolve(stale);
    await reading;
  });
  await f.settle();
  expect(f.reads.detail).toHaveBeenCalledTimes(3);
  expect(f.client.getQueryData<ConversationDetail>(f.key)?.seenSeq).toBe(5);
  expect(f.reads.links).toHaveBeenCalledTimes(1);
});

it('catches up to a newer remote receipt received during the local acknowledgement', async () => {
  const f = await fixture();
  const gate = Promise.withResolvers<ConversationDetail>();
  api.routes['POST agents/conversations/c1/markRead'] = () => gate.promise;
  const marking = f.controller.markRead('c1');
  f.seen(6);
  await f.settle();
  const older = { ...f.update(5) };
  f.update(6);
  await act(async () => {
    gate.resolve(older);
    await marking;
  });
  await f.settle();
  expect(f.reads.detail).toHaveBeenCalledTimes(2);
  expect(f.client.getQueryData<ConversationDetail>(f.key)?.seenSeq).toBe(6);
  expect(f.reads.links).toHaveBeenCalledTimes(1);
});

it('does not revive a previous identity or its deferred receipt', async () => {
  const f = await fixture();
  const gate = Promise.withResolvers<ConversationDetail>();
  api.routes['POST agents/conversations/c1/markRead'] = () => gate.promise;
  const marking = f.controller.markRead('c1');
  f.seen(6);
  f.controller.invalidate();
  await act(async () => {
    gate.resolve(f.update(5));
    await marking;
  });
  await f.settle();
  expect(f.client.getQueryData(f.key)).toBeUndefined();
  expect(f.reads.detail).toHaveBeenCalledTimes(1);
});

it('keeps full recovery after an acknowledged reconnect', async () => {
  const f = await fixture();
  readiness.reconnect?.();
  await f.settle();
  for (const read of Object.values(f.reads))
    expect(read).toHaveBeenCalledTimes(2);
});

it('retains a new reply refreshed while an older local receipt is pending', async () => {
  const f = await fixture();
  const gate = Promise.withResolvers<ConversationDetail>();
  api.routes['POST agents/conversations/c1/markRead'] = () => gate.promise;
  const marking = f.controller.markRead('c1');
  const older = { ...f.update(5) };
  const reply = {
    ...older,
    lastSeq: 6,
    read: false,
    needsYou: { reason: 'reply', seq: 6, text: null },
  } as ConversationDetail;
  f.reads.detail.mockResolvedValue(reply);
  f.seen();
  await f.settle();
  await act(async () => {
    gate.resolve(older);
    await marking;
  });
  expect(f.client.getQueryData(f.key)).toMatchObject({
    lastSeq: 6,
    seenSeq: 5,
    read: false,
    needsYou: { seq: 6 },
  });
  for (const read of Object.values(f.reads))
    expect(read).toHaveBeenCalledTimes(2);
});

it('recovers an acknowledged server receipt when the local HTTP response fails', async () => {
  const f = await fixture();
  const gate = Promise.withResolvers<ConversationDetail>();
  api.routes['POST agents/conversations/c1/markRead'] = () => gate.promise;
  const marking = f.controller.markRead('c1').catch(() => undefined);
  f.update(5);
  f.seen(5);
  await f.settle();
  await act(async () => {
    gate.reject(new Error('Response lost'));
    await marking;
  });
  await f.settle();
  expect(f.client.getQueryData<ConversationDetail>(f.key)?.seenSeq).toBe(5);
  expect(f.reads.detail).toHaveBeenCalledTimes(2);
  expect(f.reads.links).toHaveBeenCalledTimes(1);
});

it('clears a protected detail when the read-specific refresh is refused', async () => {
  const f = await fixture();
  f.reads.detail.mockRejectedValueOnce(
    new ApiClientError('FORBIDDEN', {
      status: 403,
      method: 'GET',
      url: '/agents/conversations/c1',
    }),
  );
  f.seen(5);
  await f.settle();
  expect(f.client.getQueryData(f.key)).toBeUndefined();
  expect(f.reads.detail).toHaveBeenCalledTimes(2);
});
