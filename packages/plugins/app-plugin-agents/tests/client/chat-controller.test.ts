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
