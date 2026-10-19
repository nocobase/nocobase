import { expect, it, vi } from 'vitest';
import { appUIMessageText } from '../../client/chat.js';
import { chatFeedback } from '../../client/chat/feedback.js';
import { sdkController } from './sdk-controller.js';
it('shows thinking before SDK attachment and first text, then yields to the real SDK reply', async () => {
  const f = sdkController(),
    output = f.output();
  const feedback = () =>
    chatFeedback({
      execution: { status: 'running' },
      running: true,
      stopping: false,
      submission: { status: 'confirmed' },
      stream: f.controller.state('c1'),
      hasOutput: f.controller
        .chat('c1')
        .messages.some(
          (message) =>
            message.role === 'assistant' && Boolean(appUIMessageText(message)),
        ),
    });
  try {
    f.controller.receive('c1');
    expect(feedback()).toBe('thinking');
    await vi.waitFor(() => expect(output.attached).toBe(true));
    expect(feedback()).toBe('thinking');
    output.emit({
      type: 'start',
      messageId: 'answer',
      messageMetadata: {
        conversationId: 'c1',
        createdAt: '2026-10-01T00:00:00.000Z',
        revision: 0,
      },
    });
    output.emit({ type: 'text-start', id: 'part' });
    output.emit({ type: 'text-delta', id: 'part', delta: 'First' });
    await vi.waitFor(() => expect(feedback()).toBeNull());
    expect(appUIMessageText(f.controller.chat('c1').messages[0])).toBe('First');
    output.emit({ type: 'text-delta', id: 'part', delta: ' reply' });
    await vi.waitFor(() =>
      expect(appUIMessageText(f.controller.chat('c1').messages[0])).toBe(
        'First reply',
      ),
    );
    expect(feedback()).toBeNull();
  } finally {
    f.controller.dispose();
  }
});
