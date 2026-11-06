// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { agentsQueryClient } from '../../client/query.js';
import type { AppUIMessage } from '../../client/chat.js';
import { sdkController } from './sdk-controller.js';

const fixtures: ReturnType<typeof sdkController>[] = [];
afterEach(() => {
  fixtures.splice(0).forEach((fixture) => fixture.controller.dispose());
  agentsQueryClient().clear();
  vi.useRealTimers();
});

function setup() {
  const f = sdkController();
  fixtures.push(f);
  const queued: AppUIMessage = {
    id: 'queued',
    role: 'user',
    parts: [{ type: 'text', text: 'Queued request' }],
    metadata: {
      conversationId: 'c1',
      createdAt: '2026-11-01T00:00:00Z',
      seq: 3,
      revision: 3,
      queue: 'queued',
    },
  };
  const fresh: AppUIMessage = {
    ...queued,
    metadata: { ...queued.metadata!, revision: 4, queue: undefined },
  };
  f.state.messages = [queued];
  f.controller.dispatch('c1', { type: 'confirmed', message: queued });
  const revision =
    Promise.withResolvers<Awaited<ReturnType<typeof f.api.messages>>>();
  const messages = vi
    .spyOn(f.api, 'messages')
    .mockImplementation(async (_id, query) =>
      query?.ids
        ? query.ids.split(',').some((id) => id === 'queued' || id === 'answer')
          ? revision.promise
          : { items: [], lastSeq: 3, hasMore: false, nextCursor: null }
        : { items: [queued], lastSeq: 3, hasMore: false, nextCursor: null },
    );
  const reconnect = Promise.withResolvers<Response>();
  f.setResponse(() => reconnect.promise);
  return { ...f, queued, fresh, revision, messages, reconnect };
}

it('applies an in-flight input revision after recovery reports no live stream', async () => {
  const f = setup();
  const resuming = f.controller.resume('c1');
  await vi.waitFor(() => expect(f.stream).toHaveBeenCalledOnce());
  const reading = f.controller.reread('c1', ['queued']);
  f.reconnect.resolve(new Response(null, { status: 204 }));
  await resuming;
  f.revision.resolve({
    items: [f.fresh],
    lastSeq: 3,
    hasMore: false,
    nextCursor: null,
  });
  expect(await reading).toEqual([f.fresh]);
  expect(f.controller.history('c1').state.items[0].metadata).toMatchObject({
    revision: 4,
  });
  expect(
    f.controller.history('c1').state.items[0].metadata?.queue,
  ).toBeUndefined();
  expect(f.messages.mock.calls.filter(([, query]) => query?.ids)).toHaveLength(
    1,
  );
});

it('keeps a scheduled revision notification across no-stream recovery without another request', async () => {
  const f = setup();
  const resuming = f.controller.resume('c1');
  await vi.waitFor(() => expect(f.stream).toHaveBeenCalledOnce());
  vi.useFakeTimers();
  f.controller.messageUpdated('c1', 'queued', 4);
  f.reconnect.resolve(new Response(null, { status: 204 }));
  await resuming;
  f.revision.resolve({
    items: [f.fresh],
    lastSeq: 3,
    hasMore: false,
    nextCursor: null,
  });
  await vi.advanceTimersByTimeAsync(200);
  expect(
    f.controller.history('c1').state.items[0].metadata?.queue,
  ).toBeUndefined();
  expect(f.messages.mock.calls.filter(([, query]) => query?.ids)).toHaveLength(
    1,
  );
});

it.each([204, 200])(
  'keeps input revisions and isolates old assistant snapshots across recovery %s',
  async (status) => {
    const f = setup();
    const resuming = f.controller.resume('c1');
    await vi.waitFor(() => expect(f.stream).toHaveBeenCalledOnce());
    const reading = f.controller.reread('c1', ['queued', 'answer']);
    let writer: ReadableStreamDefaultController<Uint8Array> | undefined;
    const body =
      status === 204
        ? null
        : new ReadableStream<Uint8Array>({
            start(controller) {
              writer = controller;
            },
          });
    f.reconnect.resolve(new Response(body, { status }));
    await vi.waitFor(() =>
      expect(f.controller.state('c1')?.recovery).not.toBe('recovering'),
    );
    const stale: AppUIMessage = {
      id: 'answer',
      role: 'assistant',
      parts: [{ type: 'text', text: 'Obsolete saved reply' }],
      metadata: { ...f.queued.metadata!, seq: 2 },
    };
    f.revision.resolve({
      items: [f.fresh, stale],
      lastSeq: 3,
      hasMore: false,
      nextCursor: null,
    });
    expect(await reading).toEqual([f.fresh]);
    expect(
      f.controller
        .history('c1')
        .state.items.some((message) => message.id === 'answer'),
    ).toBe(false);
    writer?.close();
    await resuming;
  },
);

it.each(['account', 'conversation'] as const)(
  'rejects a late durable revision after %s reset',
  async (reset) => {
    const f = setup();
    const reading = f.controller.reread('c1', ['queued']);
    if (reset === 'account') {
      f.controller.invalidate();
      f.controller.activate();
    } else {
      f.controller.historyReplaced({
        kind: 'conversation.historyReplaced',
        conversationId: 'c1',
        messageId: 'replacement',
        seq: 1,
        lastSeq: 1,
        revision: 1,
        executionId: 'new-run',
      });
    }
    f.revision.resolve({
      items: [f.fresh],
      lastSeq: 3,
      hasMore: false,
      nextCursor: null,
    });
    expect(await reading).toEqual([]);
    expect(
      f.controller
        .history('c1')
        .state.items.some((message) => message.metadata?.revision === 4),
    ).toBe(false);
  },
);
