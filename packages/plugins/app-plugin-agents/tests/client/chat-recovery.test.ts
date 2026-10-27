import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { appUIMessageText, type AppUIMessage } from '../../client/chat.js';
import { agentsQueryClient } from '../../client/query.js';
import { chatKeys } from '../../client/chat/keys.js';
import { sdkController } from './sdk-controller.js';
import { sdkResponse } from './sdk-chat.js';

const fixtures: ReturnType<typeof sdkController>[] = [];
beforeEach(() => vi.stubGlobal('document', { visibilityState: 'visible' }));
function fixture() {
  const f = sdkController();
  fixtures.push(f);
  return f;
}
afterEach(() => {
  fixtures.splice(0).forEach((f) => f.controller.dispose());
  agentsQueryClient().clear();
  vi.unstubAllGlobals();
});
const metadata = {
  conversationId: 'c1',
  createdAt: '2026-10-01T00:00:00.000Z',
  executionId: 'run1',
  revision: 1,
};
const user: AppUIMessage = {
  id: 'input',
  role: 'user',
  metadata: { ...metadata, seq: 1 },
  parts: [{ type: 'text', text: 'Continue' }],
};
const answer: AppUIMessage = {
  id: 'answer',
  role: 'assistant',
  metadata: { ...metadata, seq: 2 },
  parts: [{ type: 'text', text: 'Saved answer', state: 'done' }],
};

it('shares recovery across receive, reconnect and explicit resume without flashing an inferred error', async () => {
  const f = fixture(),
    output = f.output();
  let release!: (page: Awaited<ReturnType<typeof f.api.messages>>) => void;
  const read = vi.spyOn(f.api, 'messages').mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const first = f.controller.resume('c1');
  f.controller.receive('c1');
  const second = f.controller.resume('c1');
  const unwatch = f.controller.watch('c1');
  f.controller.reconnect();
  expect(f.controller.state('c1')).toMatchObject({ recovery: 'recovering' });
  expect(f.controller.state('c1')?.error).toBeUndefined();
  expect(read).toHaveBeenCalledOnce();
  release({ items: [], lastSeq: 0, nextCursor: null, hasMore: false });
  await vi.waitFor(() => expect(output.attached).toBe(true));
  output.emit({
    type: 'start',
    messageId: 'answer',
    messageMetadata: metadata,
  });
  output.emit({ type: 'text-start', id: 'text' });
  output.emit({ type: 'text-delta', id: 'text', delta: 'Live' });
  await vi.waitFor(() =>
    expect(f.controller.state('c1')?.status).toBe('streaming'),
  );
  const owner = f.controller.chat('c1');
  await f.controller.refresh('c1');
  await f.controller.resume('c1');
  f.controller.receive('c1');
  expect(f.controller.chat('c1')).toBe(owner);
  expect(f.stream).toHaveBeenCalledOnce();
  expect(f.controller.state('c1')?.error).toBeUndefined();
  output.emit({ type: 'text-end', id: 'text' });
  output.emit({ type: 'finish' });
  output.close();
  await Promise.all([first, second]);
  unwatch();
});

it('latches 204 for this running execution and keeps polling history without sending or reconnecting', async () => {
  const f = fixture();
  f.setResponse(() => new Response(null, { status: 204 }));
  await f.controller.resume('c1');
  expect(f.controller.state('c1')).toMatchObject({
    status: 'ready',
    recovery: 'history',
  });
  expect(f.controller.state('c1')?.error).toBeUndefined();
  const first = f.controller.watch('c1'),
    second = f.controller.watch('c1');
  for (let index = 0; index < 3; index++) {
    f.controller.receive('c1');
    f.controller.reconnect();
    await f.controller.resume('c1');
    await f.controller.refresh('c1');
  }
  expect(f.stream).toHaveBeenCalledOnce();
  expect(f.stream.mock.calls[0][0]).toMatchObject({ method: 'GET' });
  vi.spyOn(f.api, 'stop').mockRejectedValueOnce(
    new TypeError('Stop request lost'),
  );
  await expect(f.controller.stop('c1')).rejects.toThrow('Stop request lost');
  await f.controller.refresh('c1');
  await f.controller.resume('c1');
  expect(f.stream).toHaveBeenCalledOnce();
  expect(
    agentsQueryClient().getQueryData(chatKeys.conversation('c1')),
  ).toMatchObject({ execution: { status: 'running' } });
  f.state.messages = [user, answer];
  f.state.detail = {
    ...f.state.detail,
    execution: { status: 'idle', outcome: 'completed' },
  };
  await f.controller.refresh('c1');
  expect(f.controller.chat('c1').messages).toEqual([user, answer]);
  expect(f.controller.state('c1')?.recovery).toBeUndefined();
  first();
  second();
});

it('does not carry the 204 latch into another run in the same conversation', async () => {
  const f = fixture();
  f.state.detail = {
    ...f.state.detail,
    run: { id: 'run1', status: 'running', acceptsInput: true },
  };
  agentsQueryClient().setQueryData(chatKeys.conversation('c1'), f.state.detail);
  f.setResponse(() => new Response(null, { status: 204 }));
  await f.controller.resume('c1');
  f.state.detail = {
    ...f.state.detail,
    run: { id: 'run2', status: 'running', acceptsInput: true },
  };
  await f.controller.refresh('c1');
  await f.controller.resume('c1');
  expect(f.stream).toHaveBeenCalledTimes(2);
  expect(f.controller.state('c1')?.recovery).toBe('history');
  // A closing run has no open run record, but it is still the same execution.
  f.state.detail = { ...f.state.detail, run: null };
  await f.controller.refresh('c1');
  await f.controller.resume('c1');
  expect(f.stream).toHaveBeenCalledTimes(2);
});

it('hides the previous transport error while recovering and clears it after a successful replay', async () => {
  const f = fixture(),
    output = f.output();
  f.controller.receive('c1');
  await vi.waitFor(() => expect(output.attached).toBe(true));
  output.emit({
    type: 'start',
    messageId: 'answer',
    messageMetadata: metadata,
  });
  output.emit({ type: 'text-start', id: 'text' });
  output.emit({ type: 'text-delta', id: 'text', delta: 'Partial' });
  await vi.waitFor(() =>
    expect(f.controller.state('c1')?.status).toBe('streaming'),
  );
  output.error(new TypeError('Controlled transport loss'));
  await vi.waitFor(() => expect(f.controller.state('c1')?.error).toBeDefined());
  f.setResponse(() =>
    sdkResponse([
      { type: 'start', messageId: 'answer', messageMetadata: metadata },
      { type: 'text-start', id: 'text' },
      { type: 'text-delta', id: 'text', delta: 'Recovered' },
      { type: 'text-end', id: 'text' },
      { type: 'finish' },
    ]),
  );
  const restoring = f.controller.resume('c1');
  expect(f.controller.state('c1')?.recovery).toBe('recovering');
  expect(f.controller.state('c1')?.error).toBeUndefined();
  await restoring;
  expect(f.controller.state('c1')?.error).toBeUndefined();
  expect(appUIMessageText(f.controller.chat('c1').messages[0])).toBe(
    'Recovered',
  );
  expect(
    f.stream.mock.calls.map((call) => (call[0] as { method: string }).method),
  ).toEqual(['GET', 'GET']);
});

it('ignores a refresh snapshot that arrives after recovery connects', async () => {
  const f = fixture();
  const old = {
    ...f.state.detail,
    execution: { status: 'idle' as const, outcome: 'failed' as const },
  };
  let release!: (detail: typeof old) => void;
  vi.spyOn(f.api, 'conversation').mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const reading = f.controller.refresh('c1');
  const output = f.output();
  const restoring = f.controller.resume('c1');
  await vi.waitFor(() => expect(output.attached).toBe(true));
  output.emit({
    type: 'start',
    messageId: 'answer',
    messageMetadata: metadata,
  });
  output.emit({ type: 'text-start', id: 'text' });
  output.emit({ type: 'text-delta', id: 'text', delta: 'Current' });
  await vi.waitFor(() =>
    expect(f.controller.state('c1')?.status).toBe('streaming'),
  );
  release(old);
  await reading;
  expect(f.controller.state('c1')?.status).toBe('streaming');
  expect(f.controller.state('c1')?.error).toBeUndefined();
  expect(appUIMessageText(f.controller.chat('c1').messages[0])).toBe('Current');
  output.emit({ type: 'text-end', id: 'text' });
  output.emit({ type: 'finish' });
  output.close();
  await restoring;
});

it('ignores an old recovery response and its finally after history moves to a new execution', async () => {
  const f = fixture();
  let release!: (response: Response) => void;
  f.setResponse(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const old = f.controller.resume('c1');
  await vi.waitFor(() => expect(f.stream).toHaveBeenCalledOnce());
  f.state.messages = [
    {
      ...user,
      metadata: { ...user.metadata!, executionId: 'run2', revision: 2 },
    },
  ];
  f.state.detail = {
    ...f.state.detail,
    execution: { status: 'running', messageId: 'answer2' },
  };
  const output = f.output();
  f.controller.historyReplaced({
    kind: 'conversation.historyReplaced',
    conversationId: 'c1',
    messageId: 'input',
    executionId: 'run2',
    revision: 2,
    seq: 1,
    lastSeq: 1,
  });
  await vi.waitFor(() => expect(output.attached).toBe(true));
  output.emit({
    type: 'start',
    messageId: 'answer2',
    messageMetadata: { ...metadata, executionId: 'run2' },
  });
  output.emit({ type: 'text-start', id: 'text' });
  output.emit({ type: 'text-delta', id: 'text', delta: 'New turn' });
  await vi.waitFor(() =>
    expect(f.controller.state('c1')?.status).toBe('streaming'),
  );
  release(new Response(null, { status: 204 }));
  await old;
  expect(f.controller.state('c1')?.status).toBe('streaming');
  expect(f.controller.state('c1')?.recovery).toBeUndefined();
  expect(f.controller.state('c1')?.error).toBeUndefined();
  expect(appUIMessageText(f.controller.chat('c1').messages.at(-1)!)).toBe(
    'New turn',
  );
  expect(f.stream).toHaveBeenCalledTimes(2);
});

it.each(['completed', 'failed', 'cancelled'] as const)(
  'settles a submitted stream without a start event after confirmed %s',
  async (outcome) => {
    const f = fixture(),
      output = f.output();
    const sending = f.controller
      .chat('c1')
      .sendMessage({ id: 'input', role: 'user', parts: user.parts });
    await vi.waitFor(() => expect(output.attached).toBe(true));
    f.state.messages = [user];
    await f.controller.refresh('c1');
    expect(f.controller.state('c1')?.status).toBe('submitted');
    const terminal: AppUIMessage =
      outcome === 'completed'
        ? answer
        : {
            id: 'notice',
            role: 'system',
            metadata: { ...metadata, seq: 2 },
            parts: [{ type: 'text', text: 'Durable terminal notice' }],
          };
    f.state.messages = [user, terminal];
    // A realtime catch-up can advance the history cursor before terminal detail arrives.
    // The SDK still has no assistant target, so the saved reply remains deferred.
    await f.controller.loadHistory('c1', false, true);
    f.state.detail = {
      ...f.state.detail,
      execution: { status: 'idle', outcome },
    };
    await f.controller.refresh('c1');
    await sending;
    expect(f.controller.state('c1')?.status).toBe('ready');
    expect(f.controller.chat('c1').messages).toEqual([user, terminal]);
    expect(f.controller.state('c1')?.error).toBeUndefined();
    expect(f.stream).toHaveBeenCalledOnce();
    expect(
      f.request.mock.calls.some((call) => call[0].path.endsWith('/stop')),
    ).toBe(false);
  },
);

it('does not treat an unacknowledged submission and an old idle snapshot as completion', async () => {
  const f = fixture(),
    output = f.output();
  const sending = f.controller
    .chat('c1')
    .sendMessage({ id: 'input', role: 'user', parts: user.parts });
  await vi.waitFor(() => expect(output.attached).toBe(true));
  f.state.messages = [user, answer];
  f.state.detail = {
    ...f.state.detail,
    execution: { status: 'idle', outcome: 'completed' },
  };
  await f.controller.refresh('c1');
  expect(f.controller.state('c1')?.status).toBe('submitted');
  await f.controller.chat('c1').stop();
  await sending;
});

it('clears a transport error after idle and a saved failure notice without requiring an assistant reply', async () => {
  const f = fixture(),
    output = f.output();
  const sending = f.controller
    .chat('c1')
    .sendMessage({ id: 'input', role: 'user', parts: user.parts });
  await vi.waitFor(() => expect(output.attached).toBe(true));
  f.state.messages = [user];
  await f.controller.refresh('c1');
  output.error(new TypeError('Lost response'));
  await sending;
  expect(f.controller.state('c1')?.error).toBeDefined();
  const notice: AppUIMessage = {
    id: 'notice',
    role: 'system',
    metadata: { ...metadata, seq: 2 },
    parts: [{ type: 'text', text: 'Saved failure' }],
  };
  f.state.messages = [user, notice];
  f.state.detail = {
    ...f.state.detail,
    execution: { status: 'idle', outcome: 'failed' },
  };
  await f.controller.refresh('c1');
  expect(f.controller.state('c1')).toMatchObject({ status: 'ready' });
  expect(f.controller.state('c1')?.error).toBeUndefined();
  expect(f.controller.chat('c1').messages).toEqual([user, notice]);
});

it('rejects a history page started before a newer command', async () => {
  const f = fixture();
  let release!: (page: Awaited<ReturnType<typeof f.api.messages>>) => void;
  vi.spyOn(f.api, 'messages').mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const reading = f.controller.loadHistory('c1');
  const detail = { ...f.state.detail, execution: { status: 'idle' as const } };
  await f.controller.command(
    'c1',
    async () => detail,
    (result) => result,
  );
  const next: AppUIMessage = {
    ...user,
    id: 'new-input',
    metadata: { ...metadata, seq: 10, executionId: 'run2' },
  };
  f.controller.dispatch('c1', { type: 'confirmed', message: next });
  release({ items: [answer], lastSeq: 2, nextCursor: null, hasMore: false });
  await reading;
  expect(f.controller.chat('c1').messages).toEqual([next]);
  expect(agentsQueryClient().getQueryData(chatKeys.conversation('c1'))).toEqual(
    detail,
  );
});

it('reports a failed history read without inventing a transport error or sending input', async () => {
  const f = fixture();
  const error = new TypeError('History unavailable');
  vi.spyOn(f.api, 'messages').mockRejectedValueOnce(error);
  await f.controller.resume('c1');
  expect(f.controller.state('c1')?.error).toBeUndefined();
  expect(f.controller.history('c1').error).toBe(error);
  expect(f.stream).not.toHaveBeenCalled();
  await f.controller.refresh('c1');
  expect(f.controller.history('c1').error).toBeUndefined();
  f.setResponse(() => new Response(null, { status: 204 }));
  await f.controller.resume('c1');
  expect(f.controller.state('c1')?.recovery).toBe('history');
  expect(f.stream).toHaveBeenCalledOnce();
});
