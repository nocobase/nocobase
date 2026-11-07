// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { agentsQueryClient } from '../../client/query.js';
import { sdkController } from './sdk-controller.js';

const fixtures: ReturnType<typeof sdkController>[] = [];
afterEach(() => {
  fixtures.splice(0).forEach((f) => f.controller.dispose());
  agentsQueryClient().clear();
  vi.useRealTimers();
});

it('shares an output read with the existing five-second fallback without a redundant trailing page', async () => {
  vi.useFakeTimers();
  const f = sdkController();
  fixtures.push(f);
  vi.spyOn(f.controller, 'receive').mockImplementation(() => {});
  await f.controller.loadHistory('c1');
  const stop = f.controller.watch('c1');
  f.state.lastSeq = 1;
  f.state.detail = { ...f.state.detail, lastSeq: 1 };
  const pending =
    Promise.withResolvers<Awaited<ReturnType<typeof f.api.messages>>>();
  const read = vi.spyOn(f.api, 'messages').mockReturnValueOnce(pending.promise);
  const output = f.controller.messagesChanged('c1', 1);
  await vi.advanceTimersByTimeAsync(5000);
  expect(read).toHaveBeenCalledOnce();
  pending.resolve({ items: [], lastSeq: 1, hasMore: false, nextCursor: null });
  await output;
  await vi.advanceTimersByTimeAsync(200);
  expect(read).toHaveBeenCalledOnce();
  expect(f.controller.history('c1').loadedThrough).toBe(1);
  stop();
});

it('shares an in-flight revision read between a fallback and another surface', async () => {
  const f = sdkController();
  fixtures.push(f);
  const pending =
    Promise.withResolvers<Awaited<ReturnType<typeof f.api.messages>>>();
  const read = vi.spyOn(f.api, 'messages').mockReturnValueOnce(pending.promise);
  const first = f.controller.reread('c1', ['a', 'b']);
  const second = f.controller.reread('c1', ['b', 'a']);
  expect(read).toHaveBeenCalledOnce();
  pending.resolve({ items: [], lastSeq: 0, hasMore: false, nextCursor: null });
  await Promise.all([first, second]);
  expect(read).toHaveBeenCalledOnce();
});

it('lets a shared cursor response satisfy the accompanying revision announcement', async () => {
  vi.useFakeTimers();
  const f = sdkController();
  fixtures.push(f);
  const stop = f.controller.watch('c1');
  await f.controller.loadHistory('c1');
  f.request.mockClear();
  f.state.messages = [
    {
      id: 'answer',
      role: 'assistant',
      parts: [],
      metadata: {
        seq: 1,
        revision: 1,
        conversationId: 'c1',
        createdAt: '2026-10-30T00:00:00Z',
      },
    },
  ];
  f.controller.messageUpdated('c1', 'answer', 1);
  await f.controller.messagesChanged('c1', 1);
  await vi.advanceTimersByTimeAsync(200);
  expect(f.request).toHaveBeenCalledOnce();
  expect(f.request.mock.calls[0]![0].query).toEqual({ after: 0 });
  stop();
});

it('does not reread a revision supplied by the SDK before its queued read', async () => {
  vi.useFakeTimers();
  const f = sdkController();
  fixtures.push(f);
  f.controller.messageUpdated('c1', 'answer', 2);
  f.controller.chat('c1').messages = [
    {
      id: 'answer',
      role: 'assistant',
      parts: [],
      metadata: {
        seq: 1,
        revision: 2,
        conversationId: 'c1',
        createdAt: '2026-10-30T00:00:00Z',
      },
    },
  ];
  await vi.advanceTimersByTimeAsync(200);
  expect(f.request).not.toHaveBeenCalled();
});

it('shares cursor reads across surfaces and only trails when the returned cursor leaves a gap', async () => {
  const f = sdkController();
  fixtures.push(f);
  const stop = f.controller.watch('c1');
  await f.controller.loadHistory('c1');
  const pending = Promise.withResolvers<{
    data: never[];
    meta: { lastSeq: number };
  }>();
  f.request.mockClear();
  f.request.mockImplementationOnce(() => pending.promise);
  const first = f.controller.messagesChanged('c1', 1);
  const second = f.controller.messagesChanged('c1', 2);
  expect(second).toBe(first);
  expect(f.request).toHaveBeenCalledOnce();
  pending.resolve({ data: [], meta: { lastSeq: 2 } });
  await first;
  expect(f.request).toHaveBeenCalledOnce();
  expect(f.request.mock.calls[0]![0].query).toEqual({ after: 0 });
  await f.controller.messagesChanged('c1', 2);
  expect(f.request).toHaveBeenCalledOnce();
  f.state.lastSeq = 4;
  const next = Promise.withResolvers<{
    data: never[];
    meta: { lastSeq: number };
  }>();
  f.request.mockImplementationOnce(() => next.promise);
  const third = f.controller.messagesChanged('c1', 3);
  f.controller.messagesChanged('c1', 4);
  next.resolve({ data: [], meta: { lastSeq: 3 } });
  await third;
  expect(f.request).toHaveBeenCalledTimes(3);
  expect(f.request.mock.calls.map(([request]) => request.path)).toEqual(
    Array(3).fill('agents/conversations/c1/messages'),
  );
  expect(f.controller.history('c1').loadedThrough).toBe(4);
  stop();
});

it('does not reread a revision already present in durable history', async () => {
  const f = sdkController();
  fixtures.push(f);
  f.state.messages = [
    {
      id: 'answer',
      role: 'assistant',
      parts: [],
      metadata: {
        seq: 1,
        revision: 2,
        conversationId: 'c1',
        createdAt: '2026-10-30T00:00:00Z',
      },
    },
  ];
  await f.controller.loadHistory('c1');
  f.request.mockClear();
  f.controller.messageUpdated('c1', 'answer', 2);
  expect(f.request).not.toHaveBeenCalled();
  f.controller.messageUpdated('c1', 'answer', 3);
  await vi.waitFor(() => expect(f.request).toHaveBeenCalledOnce());
});
