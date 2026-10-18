import { expect, it, vi } from 'vitest';
import type { ChatApi } from '../../client/chat/api.js';
import { ChatController } from '../../client/chat/controller.js';
import type { ConversationDetail } from '../../shared/conversations.js';

function fixture(chunks: string[]) {
  const api = {
    events: vi.fn(
      async () =>
        new ReadableStream<Uint8Array>({
          start(c) {
            for (const chunk of chunks)
              c.enqueue(new TextEncoder().encode(chunk));
            c.close();
          },
        }),
    ),
    conversation: vi.fn(async () => ({ id: 'c1' }) as ConversationDetail),
    messages: vi.fn(async () => ({
      items: [],
      lastSeq: 2,
      nextCursor: null,
      hasMore: false,
    })),
    createConversation: vi.fn(),
    sendMessage: vi.fn(),
  };
  return { api, controller: new ChatController(api as unknown as ChatApi) };
}
it('uses one first subscription across views and handles chunked cached output and terminal persistence', async () => {
  const part = JSON.stringify({
    type: 'part',
    boundary: { afterSeq: 1 },
    messageIndex: 0,
    item: { role: 'assistant', parts: [{ type: 'text', text: 'Answer' }] },
  });
  const f = fixture([
    `event: part\ndata: ${part.slice(0, 30)}`,
    `${part.slice(30)}\n\nevent: saved\ndata: {"type":"saved","lastSeq":2}\n\n`,
  ]);
  f.controller.receive('c1');
  f.controller.receive('c1');
  await vi.waitFor(() => expect(f.controller.state('c1')?.phase).toBe('saved'));
  expect(f.api.events).toHaveBeenCalledTimes(1);
  expect(f.controller.state('c1')?.items[0].content.content).toBe('Answer');
  await vi.waitFor(() => expect(f.api.messages).toHaveBeenCalledTimes(1));
  f.controller.dispose();
});
it('appends live deltas to the initial prefix and replaces the canonical answer without duplication', async () => {
  let output!: ReadableStreamDefaultController<Uint8Array>;
  const f = fixture([]);
  f.api.events.mockImplementationOnce(
    async () =>
      new ReadableStream({
        start(controller) {
          output = controller;
        },
      }),
  );
  f.controller.receive('c1');
  await vi.waitFor(() => expect(output).toBeDefined());
  const emit = (event: unknown) =>
    output.enqueue(
      new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`),
    );
  emit({
    type: 'part',
    boundary: { afterSeq: 1 },
    messageIndex: 0,
    item: { role: 'assistant', parts: [{ type: 'text', text: 'A' }] },
  });
  await vi.waitFor(() =>
    expect(f.controller.state('c1')?.items[0].content.content).toBe('A'),
  );
  emit({
    type: 'delta',
    boundary: { afterSeq: 1 },
    messageIndex: 0,
    text: 'B',
  });
  await vi.waitFor(() =>
    expect(f.controller.state('c1')?.items[0].content.content).toBe('AB'),
  );
  expect(f.controller.state('c1')?.phase).toBe('streaming');
  emit({
    type: 'part',
    boundary: { afterSeq: 1 },
    messageIndex: 0,
    item: { role: 'assistant', parts: [{ type: 'text', text: 'AB' }] },
  });
  emit({ type: 'saved', lastSeq: 2, outcome: 'cancelled' });
  output.close();
  await vi.waitFor(() => expect(f.controller.state('c1')?.phase).toBe('saved'));
  expect(f.controller.state('c1')?.outcome).toBe('cancelled');
  expect(
    f.controller.state('c1')?.items.map((item) => item.content.content),
  ).toEqual(['AB']);
  f.controller.dispose();
});
it('retains disconnected output, never reconnects automatically and only refreshes saved history explicitly', async () => {
  const f = fixture([]);
  f.controller.receive('c1');
  await vi.waitFor(() =>
    expect(f.controller.state('c1')?.phase).toBe('interrupted'),
  );
  f.controller.receive('c1');
  await f.controller.refresh('c1');
  expect(f.api.events).toHaveBeenCalledTimes(1);
  expect(f.api.messages).toHaveBeenCalledTimes(1);
  expect(f.api.sendMessage).not.toHaveBeenCalled();
  f.controller.dispose();
});
it('reads final history when the first subscription follows a fast completion', async () => {
  const f = fixture([]);
  f.api.events.mockImplementationOnce(async () => null as never);
  f.controller.receive('c1');
  await vi.waitFor(() => expect(f.api.messages).toHaveBeenCalledTimes(1));
  expect(f.controller.state('c1')?.phase).toBe('saved');
  expect(f.api.events).toHaveBeenCalledTimes(1);
  f.controller.dispose();
});

it('shares a canonical history load across views and drops stale identity responses', async () => {
  const f = fixture([]);
  let resolve!: (value: Awaited<ReturnType<typeof f.api.messages>>) => void;
  f.api.messages.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const first = f.controller.loadHistory('c1');
  const second = f.controller.loadHistory('c1');
  expect(f.api.messages).toHaveBeenCalledTimes(1);
  f.controller.invalidate();
  resolve({ items: [], lastSeq: 2, nextCursor: null, hasMore: false });
  await Promise.all([first, second]);
  expect(f.controller.history('c1').state.loaded).toBe(false);
  f.controller.dispose();
});
it('does not let an old idle refresh mark the next subscription as saved', async () => {
  const f = fixture([]);
  let resolve!: (value: ConversationDetail) => void;
  f.api.conversation.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const old = f.controller.refresh('c1');
  f.controller.receive('c1', true);
  await vi.waitFor(() =>
    expect(f.controller.state('c1')?.phase).toBe('interrupted'),
  );
  resolve({ id: 'c1', execution: { status: 'idle' } } as ConversationDetail);
  await old;
  expect(f.controller.state('c1')?.phase).toBe('interrupted');
  expect(f.api.messages).not.toHaveBeenCalled();
  f.controller.dispose();
});

it.each([false, true])(
  'keeps Stop pending until terminal confirmation and clears across lifetimes (historical=%s)',
  async (historical) => {
    const f = fixture([]);
    f.controller.api.stop = vi.fn(
      async () =>
        ({
          id: 'c1',
          ...(historical
            ? { run: { id: 'legacy-run' } }
            : { execution: { status: 'running' } }),
        }) as ConversationDetail,
    );
    await f.controller.stop('c1');
    expect(f.controller.isStopping('c1')).toBe(true);
    f.controller.observeDetail({
      id: 'c1',
      ...(historical ? { run: null } : { execution: { status: 'idle' } }),
    } as ConversationDetail);
    expect(f.controller.isStopping('c1')).toBe(false);
    await f.controller.stop('c1');
    f.controller.invalidate();
    expect(f.controller.isStopping('c1')).toBe(false);
    f.controller.dispose();
  },
);
