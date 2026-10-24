import { afterEach, expect, it, vi } from 'vitest';
import { ApiClientError } from '@nocobase/app-client';
import { sdkController } from './sdk-controller.js';
import { sdkResponse, uiMessage } from './sdk-chat.js';
import { agentsQueryClient } from '../../client/query.js';
import { chatKeys } from '../../client/chat/keys.js';

const controllers: ReturnType<typeof sdkController>['controller'][] = [];
afterEach(() => {
  controllers.splice(0).forEach((c) => c.dispose());
  agentsQueryClient().clear();
});
function fixture() {
  const f = sdkController();
  controllers.push(f.controller);
  f.state.detail = {
    ...f.state.detail,
    mode: 'online',
    execution: { status: 'idle' },
  };
  agentsQueryClient().setQueryData(chatKeys.conversation('c1'), f.state.detail);
  f.state.messages = [
    uiMessage(1),
    uiMessage(2, 'assistant'),
    uiMessage(3),
    uiMessage(4, 'assistant'),
  ];
  return f;
}
it('loads an explicitly linked user outside the current page before calling the official SDK flow', async () => {
  const f = fixture();
  await f.controller.loadHistory('c1');
  f.controller.chat('c1').messages = [uiMessage(4, 'assistant')];
  f.setResponse(() => {
    expect(
      f.controller.chat('c1').messages.map((message) => message.id),
    ).toEqual(['m1']);
    f.state.messages = [
      {
        ...uiMessage(1),
        metadata: {
          ...uiMessage(1).metadata!,
          revision: 2,
          executionId: 'new',
        },
      },
    ];
    return sdkResponse([{ type: 'finish' }]);
  });
  expect((await f.controller.resend('c1', { messageId: 'm1' })).outcome).toBe(
    'accepted',
  );
  expect(f.stream).toHaveBeenCalledTimes(1);
});

it('rejects a missing source read without sending a destructive POST', async () => {
  const f = fixture();
  await f.controller.loadHistory('c1');
  expect(
    (await f.controller.resend('c1', { messageId: 'deleted-user' })).outcome,
  ).toBe('rejected');
  expect(f.stream).not.toHaveBeenCalled();
  expect(f.controller.chat('c1').messages.map((message) => message.id)).toEqual(
    ['m1', 'm2', 'm3', 'm4'],
  );
});

it.each(['resend', 'edit'] as const)(
  'uses the official SDK %s flow with one POST and a fresh response',
  async (operation) => {
    const f = fixture();
    await f.controller.loadHistory('c1');
    f.setResponse(() => {
      expect(f.controller.chat('c1').messages).toHaveLength(1);
      const target = {
        ...uiMessage(1, 'user', operation === 'edit' ? 'edited' : 'message 1'),
        metadata: {
          ...uiMessage(1).metadata!,
          revision: 2,
          executionId: 'new',
        },
      };
      f.state.messages = [target];
      f.state.lastSeq = 4;
      return sdkResponse([
        {
          type: 'start',
          messageId: 'new-answer',
          messageMetadata: {
            conversationId: 'c1',
            executionId: 'new',
            sourceUserMessageId: target.id,
            revision: 0,
          },
        },
        { type: 'text-start', id: 'text' },
        { type: 'text-delta', id: 'text', delta: 'new answer' },
        { type: 'text-end', id: 'text' },
        { type: 'finish' },
      ]);
    });
    const options = {
      messageId: 'm1',
      ...(operation === 'edit' ? { input: { text: 'edited' } } : {}),
    };
    const first = f.controller.resend('c1', options);
    const doubleClick = await f.controller.resend('c1', { messageId: 'm1' });
    expect(doubleClick.outcome).toBe('rejected');
    expect((await first).outcome).toBe('accepted');
    await vi.waitFor(() =>
      expect(f.controller.chat('c1').status).toBe('ready'),
    );
    expect(f.controller.chat('c1').error).toBeUndefined();
    expect(f.stream).toHaveBeenCalledTimes(1);
    expect(f.stream.mock.calls[0][0]).toMatchObject({
      path: 'agents/conversations/c1/resend',
      json: options,
    });
    expect(f.controller.chat('c1').messages.map((m) => m.id)).toEqual([
      'm1',
      'new-answer',
    ]);
    expect(f.controller.chat('c1').messages.at(-1)!.parts).toEqual([
      { type: 'text', text: 'new answer', state: 'done' },
    ]);
    expect(f.controller.history('c1').loadedThrough).toBe(4);
  },
);

it.each(['unknown', 'rejected'] as const)(
  'retains old history on %s admission without retrying the POST',
  async (outcome) => {
    const f = fixture();
    await f.controller.loadHistory('c1');
    f.setResponse(() => {
      throw outcome === 'unknown'
        ? new TypeError('network lost')
        : new ApiClientError('busy', {
            status: 400,
            method: 'POST',
            url: '/resend',
          });
    });
    const result = await f.controller.resend('c1', { messageId: 'm1' });
    expect(result.outcome).toBe(outcome);
    expect(f.stream).toHaveBeenCalledTimes(1);
    expect(f.controller.chat('c1').messages.map((m) => m.id)).toEqual([
      'm1',
      'm2',
      'm3',
      'm4',
    ]);
  },
);

it('does not resurrect a physically deleted suffix when the POST was accepted but its response was lost', async () => {
  const f = fixture();
  await f.controller.loadHistory('c1');
  f.setResponse(() => {
    f.state.messages = [
      {
        ...uiMessage(1),
        metadata: {
          ...uiMessage(1).metadata!,
          revision: 2,
          executionId: 'accepted',
        },
      },
    ];
    throw new TypeError('response lost after commit');
  });
  const result = await f.controller.resend('c1', { messageId: 'm1' });
  expect(result.outcome).toBe('unknown');
  await f.controller.refresh('c1');
  expect(f.controller.chat('c1').messages.map((message) => message.id)).toEqual(
    ['m1'],
  );
  expect(f.stream).toHaveBeenCalledTimes(1);
});

it('preserves non-text parts in the optimistic SDK edit and restores a rejected edit', async () => {
  const f = fixture();
  const file = {
    type: 'file' as const,
    mediaType: 'text/plain',
    url: '/private/file.txt',
  };
  f.state.messages[0]!.parts = [
    { type: 'text', text: 'first' },
    file,
    { type: 'text', text: 'second' },
  ];
  await f.controller.loadHistory('c1');
  f.setResponse(() => {
    expect(f.controller.chat('c1').messages).toHaveLength(1);
    expect(f.controller.chat('c1').messages[0]!.parts).toEqual([
      { type: 'text', text: 'edited' },
      file,
    ]);
    throw new ApiClientError('busy', {
      status: 409,
      method: 'POST',
      url: '/resend',
    });
  });
  expect(
    await f.controller.resend('c1', {
      messageId: 'm1',
      input: { text: 'edited' },
    }),
  ).toMatchObject({ outcome: 'rejected' });
  expect(f.controller.chat('c1').messages).toEqual(f.state.messages);
  expect(f.stream).toHaveBeenCalledTimes(1);
});

it('discovers physical deletion without a replacement event and ignores a late revision read', async () => {
  const f = fixture();
  await f.controller.loadHistory('c1');
  let release!: (value: Awaited<ReturnType<typeof f.api.messages>>) => void;
  const old = new Promise<Awaited<ReturnType<typeof f.api.messages>>>(
    (resolve) => {
      release = resolve;
    },
  );
  const original = f.api.messages.bind(f.api);
  vi.spyOn(f.api, 'messages')
    .mockReturnValueOnce(old)
    .mockImplementation(original);
  const reread = f.controller.reread('c1', ['m4']);
  f.state.messages = [
    {
      ...uiMessage(1),
      metadata: {
        ...uiMessage(1).metadata!,
        revision: 2,
        executionId: 'replacement',
      },
    },
  ];
  await f.controller.refresh('c1');
  release({
    items: [uiMessage(4, 'assistant')],
    lastSeq: 4,
    nextCursor: null,
    hasMore: false,
  });
  await reread;
  expect(f.controller.chat('c1').messages.map((m) => m.id)).toEqual(['m1']);
  expect(f.controller.history('c1').loadedThrough).toBe(4);
  expect(f.stream).not.toHaveBeenCalled();
});

it('treats a failed reread after a successful POST as accepted, not as a rejected or retryable submission', async () => {
  const f = fixture();
  await f.controller.loadHistory('c1');
  f.setResponse(() => {
    vi.spyOn(f.api, 'messages').mockRejectedValue(
      new Error('read unavailable'),
    );
    return sdkResponse();
  });
  expect(await f.controller.resend('c1', { messageId: 'm1' })).toMatchObject({
    outcome: 'accepted',
    needsSync: true,
  });
  expect(f.stream).toHaveBeenCalledTimes(1);
});

it('keeps an unpersisted active response across duplicate replacement events and authoritative reads', async () => {
  const f = fixture();
  await f.controller.loadHistory('c1');
  f.state.messages = [
    {
      ...uiMessage(1),
      metadata: { ...uiMessage(1).metadata!, revision: 2, executionId: 'new' },
    },
  ];
  f.state.lastSeq = 4;
  f.state.detail = {
    ...f.state.detail,
    execution: { status: 'running', messageId: 'live-answer' },
  };
  const output = f.output();
  expect((await f.controller.resend('c1', { messageId: 'm1' })).outcome).toBe(
    'accepted',
  );
  output.emit({
    type: 'start',
    messageId: 'live-answer',
    messageMetadata: {
      conversationId: 'c1',
      executionId: 'new',
      sourceUserMessageId: 'm1',
      revision: 0,
    },
  });
  output.emit({ type: 'text-start', id: 'text' });
  output.emit({ type: 'text-delta', id: 'text', delta: 'Live answer' });
  await vi.waitFor(() =>
    expect(f.controller.chat('c1').messages.at(-1)?.parts).toContainEqual({
      type: 'text',
      text: 'Live answer',
      state: 'streaming',
    }),
  );
  const event = {
    kind: 'conversation.historyReplaced' as const,
    conversationId: 'c1',
    messageId: 'm1',
    seq: 1,
    revision: 2,
    lastSeq: 4,
    executionId: 'new',
  };
  f.controller.historyReplaced(event);
  f.controller.historyReplaced(event);
  await f.controller.refresh('c1');
  expect(f.controller.chat('c1').messages.map((message) => message.id)).toEqual(
    ['m1', 'live-answer'],
  );
  expect(f.controller.chat('c1').messages.at(-1)!.parts).toContainEqual({
    type: 'text',
    text: 'Live answer',
    state: 'streaming',
  });
  output.emit({ type: 'text-end', id: 'text' });
  output.emit({ type: 'finish' });
  output.close();
  await vi.waitFor(() => expect(f.controller.chat('c1').status).toBe('ready'));
  expect(f.stream).toHaveBeenCalledTimes(1);
});

it('does not infer physical deletion when any bounded ID reconciliation batch fails', async () => {
  const f = fixture();
  f.state.messages = Array.from({ length: 105 }, (_, index) =>
    uiMessage(index + 1),
  );
  await f.controller.loadHistory('c1');
  const before = f.controller.chat('c1').messages;
  f.state.messages = [f.state.messages[0]!];
  const read = f.api.messages.bind(f.api);
  vi.spyOn(f.api, 'messages').mockImplementation((id, query) => {
    if (query?.ids?.includes('m101'))
      throw new Error('Second batch unavailable');
    return read(id, query);
  });
  await expect(f.controller.refresh('c1')).rejects.toThrow(
    'Second batch unavailable',
  );
  expect(f.controller.chat('c1').messages).toEqual(before);
  expect(f.stream).not.toHaveBeenCalled();
});
