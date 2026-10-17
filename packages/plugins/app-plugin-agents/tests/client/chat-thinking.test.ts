import { expect, it, vi } from 'vitest';
import type { ChatApi } from '../../client/chat/api.js';
import { ChatController } from '../../client/chat/controller.js';
import { chatFeedback } from '../../client/chat/feedback.js';
import { OnlineAgentMemoryStreamManager } from '../../server/online-agent/streams.js';

it('shows thinking before native stream attachment and first text, then yields to the reply', async () => {
  const manager = new OnlineAgentMemoryStreamManager();
  const writer = await manager.open('conversation', 1);
  let attach!: () => void;
  const ready = new Promise<void>((resolve) => {
    attach = resolve;
  });
  const api = {
    events: vi.fn(async () => {
      await ready;
      const stream = await manager.receive('conversation');
      return stream!.pipeThrough(
        new TransformStream({
          transform(event, output) {
            output.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`),
            );
          },
        }),
      );
    }),
  };
  const controller = new ChatController(api as unknown as ChatApi);
  const feedback = () => {
    const stream = controller.state('conversation');
    return chatFeedback({
      execution: { status: 'running' },
      running: true,
      stopping: false,
      submission: { status: 'confirmed' },
      stream,
      hasOutput: Boolean(
        stream?.items.some(
          (item) =>
            item.seq > 1 &&
            item.role !== 'user' &&
            item.content.content.trim().length > 0,
        ),
      ),
    });
  };
  try {
    controller.receive('conversation');
    expect(feedback()).toBe('thinking');
    attach();
    await vi.waitFor(() => expect(api.events).toHaveResolved());
    expect(feedback()).toBe('thinking');
    await writer.append(0, 'First');
    await vi.waitFor(() => expect(feedback()).toBeNull());
    expect(controller.state('conversation')?.items[0]?.content.content).toBe(
      'First',
    );
    await writer.append(0, ' reply');
    await vi.waitFor(() =>
      expect(controller.state('conversation')?.items[0]?.content.content).toBe(
        'First reply',
      ),
    );
    expect(feedback()).toBeNull();
  } finally {
    attach();
    controller.dispose();
    await writer.discard();
  }
});
