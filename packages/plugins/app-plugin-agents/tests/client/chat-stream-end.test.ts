import { afterEach, expect, it, vi } from 'vitest';
import { QueryObserver } from '@tanstack/react-query';
import type { AppUIMessage } from '../../client/chat.js';
import { agentsQueryClient } from '../../client/query.js';
import { chatKeys } from '../../client/chat/keys.js';
import type { ConversationDetail } from '../../shared/conversations.js';
import { sdkController } from './sdk-controller.js';
import { uiMessage } from './sdk-chat.js';

const fixtures: ReturnType<typeof sdkController>[] = [];
const fixture = () => {
  const f = sdkController();
  fixtures.push(f);
  return f;
};
const observers: (() => void)[] = [];
afterEach(() => {
  observers.splice(0).forEach((off) => off());
  fixtures.splice(0).forEach((f) => f.controller.dispose());
  agentsQueryClient().clear();
});
const metadata = {
  conversationId: 'c1',
  createdAt: '2026-10-01T00:00:00.000Z',
  revision: 0,
  executionId: 'run-2',
};
const previousTurn = uiMessage(1);
/** The conversation as read before the current input: idle, its history ending at the previous turn. */
const before: ConversationDetail = {
  id: 'c1',
  lastSeq: 1,
  execution: { status: 'idle', outcome: 'completed' },
} as ConversationDetail;
const answer: AppUIMessage = {
  id: 'answer',
  role: 'assistant',
  metadata: { ...metadata, revision: 1, seq: 3 },
  parts: [{ type: 'text', text: 'Still working', state: 'done' }],
};

/** A live response whose run the server still reports as running, with its answer already saved. */
async function streamingWhileRunning() {
  const f = fixture(),
    output = f.output();
  f.state.detail = before;
  f.state.messages = [previousTurn];
  agentsQueryClient().setQueryData(chatKeys.conversation('c1'), before);
  await f.controller.loadHistory('c1');
  f.state.detail = {
    ...before,
    lastSeq: 3,
    execution: { status: 'running', messageId: 'answer', revision: 1 },
  } as ConversationDetail;
  f.controller.receive('c1', f.state.detail);
  await vi.waitFor(() => expect(output.attached).toBe(true));
  output.emit({
    type: 'start',
    messageId: 'answer',
    messageMetadata: metadata,
  });
  output.emit({ type: 'text-start', id: 'text' });
  output.emit({ type: 'text-delta', id: 'text', delta: 'Still' });
  await vi.waitFor(() =>
    expect(f.controller.chat('c1').status).toBe('streaming'),
  );
  f.state.messages = [previousTurn, uiMessage(2), answer];
  return { f, output };
}

it('keeps a running response subscribed when the cached idle read predates it', async () => {
  const { f } = await streamingWhileRunning();
  // The conversation query still holds the read from before this input and is not fetching.
  agentsQueryClient().setQueryData(chatKeys.conversation('c1'), before);
  const observer = new QueryObserver(agentsQueryClient(), {
    queryKey: chatKeys.conversation('c1'),
    queryFn: async () => before,
    staleTime: Infinity,
  });
  observers.push(observer.subscribe(() => {}));
  await f.controller.refresh('c1', false);
  // The saved answer was reread, yet the idle read never saw it.
  expect(
    f.request.mock.calls.some(([request]) => request.query?.ids === 'answer'),
  ).toBe(true);
  expect(f.controller.chat('c1').status).toBe('streaming');
  expect(f.controller.state('c1')?.finished).toBeUndefined();
  expect(
    f.request.mock.calls.some(([request]) => request.path.endsWith('/stop')),
  ).toBe(false);
});

it('releases the response once an idle read taken after its saved answer arrives', async () => {
  const { f } = await streamingWhileRunning();
  f.state.detail = {
    ...before,
    lastSeq: 3,
    execution: {
      status: 'idle',
      outcome: 'completed',
      messageId: 'answer',
      revision: 1,
    },
  } as ConversationDetail;
  await f.controller.refresh('c1');
  expect(f.controller.chat('c1').status).toBe('ready');
  // Releasing the subscriber is not the server's finish: the saved idle detail is what says the run is over.
  expect(f.controller.state('c1')?.finished).toBeUndefined();
  expect(
    f.request.mock.calls.some(([request]) => request.path.endsWith('/stop')),
  ).toBe(false);
});

it.each([
  ['the server finishes it', 'finish'],
  ['it is stopped here', 'stop'],
  ['the connection drops', 'disconnect'],
  ['the stream closes without finish', 'close'],
] as const)(
  'names the finished response only when %s',
  async (_label, ending) => {
    const { f, output } = await streamingWhileRunning();
    if (ending === 'finish') {
      output.emit({ type: 'text-end', id: 'text' });
      output.emit({ type: 'finish', finishReason: 'stop' });
      output.close();
    } else if (ending === 'stop') await f.controller.chat('c1').stop();
    else if (ending === 'disconnect')
      output.error(new TypeError('Failed to fetch'));
    else output.close();
    await vi.waitFor(() =>
      expect(['ready', 'error']).toContain(f.controller.chat('c1').status),
    );
    expect(f.controller.state('c1')?.finished).toBe(
      ending === 'finish' ? 'answer' : undefined,
    );
  },
);

it('forgets a finished response once a later stream on the conversation ends without finish', async () => {
  const { f, output } = await streamingWhileRunning();
  output.emit({ type: 'finish', finishReason: 'stop' });
  output.close();
  await vi.waitFor(() =>
    expect(f.controller.state('c1')?.finished).toBe('answer'),
  );
  const next = f.output();
  f.state.detail = {
    ...f.state.detail,
    lastSeq: 5,
    execution: { status: 'running', messageId: 'next', revision: 0 },
  } as ConversationDetail;
  f.controller.receive('c1', f.state.detail);
  await vi.waitFor(() => expect(next.attached).toBe(true));
  next.emit({ type: 'start', messageId: 'next', messageMetadata: metadata });
  next.emit({ type: 'text-start', id: 'next-text' });
  next.emit({ type: 'text-delta', id: 'next-text', delta: 'Next' });
  await vi.waitFor(() =>
    expect(f.controller.chat('c1').status).toBe('streaming'),
  );
  await f.controller.chat('c1').stop();
  await vi.waitFor(() =>
    expect(f.controller.state('c1')?.finished).toBeUndefined(),
  );
  expect(f.controller.chat('c1').status).toBe('ready');
});
