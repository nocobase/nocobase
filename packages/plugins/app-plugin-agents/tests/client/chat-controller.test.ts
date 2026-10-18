import { afterEach, expect, it, vi } from 'vitest';
import type { AppUIMessage } from '../../client/chat.js';
import { appUIMessageText } from '../../client/chat.js';
import { agentsQueryClient } from '../../client/query.js';
import { chatKeys } from '../../client/chat/keys.js';
import type { ConversationDetail } from '../../shared/conversations.js';
import { sdkController } from './sdk-controller.js';
import { sdkResponse, uiMessage } from './sdk-chat.js';
const fixtures: ReturnType<typeof sdkController>[] = [];
const fixture = () => {
  const f = sdkController();
  fixtures.push(f);
  return f;
};
afterEach(() => {
  fixtures.splice(0).forEach((f) => f.controller.dispose());
  agentsQueryClient().clear();
});
const metadata = {
  conversationId: 'c1',
  createdAt: '2026-10-01T00:00:00.000Z',
  revision: 0,
  executionId: 'native-1',
};
it('shares one SDK owner and one initial recovery across views, then reconciles durable completion', async () => {
  const f = fixture(),
    output = f.output();
  f.controller.receive('c1');
  f.controller.receive('c1');
  expect(f.controller.chat('c1')).toBe(f.controller.chat('c1'));
  await vi.waitFor(() => expect(output.attached).toBe(true));
  output.emit({
    type: 'start',
    messageId: 'answer',
    messageMetadata: metadata,
  });
  output.emit({ type: 'text-start', id: 'text' });
  output.emit({ type: 'text-delta', id: 'text', delta: 'Answer' });
  output.emit({ type: 'text-end', id: 'text' });
  const saved: AppUIMessage = {
    id: 'answer',
    role: 'assistant',
    metadata: { ...metadata, revision: 1, seq: 2 },
    parts: [{ type: 'text', text: 'Answer', state: 'done' }],
  };
  f.state.messages = [saved];
  f.state.detail = {
    ...f.state.detail,
    execution: { status: 'idle', outcome: 'completed', messageId: 'answer' },
  };
  output.emit({ type: 'finish', messageMetadata: saved.metadata });
  output.close();
  await vi.waitFor(() => expect(f.controller.chat('c1').status).toBe('ready'));
  await f.controller.refresh('c1');
  expect(f.controller.chat('c1').messages).toEqual([saved]);
  expect(f.stream).toHaveBeenCalledOnce();
  expect(agentsQueryClient().getQueryData(chatKeys.conversation('c1'))).toEqual(
    f.state.detail,
  );
});
it('appends SDK deltas in place and protects the active message against an older history snapshot', async () => {
  const f = fixture(),
    output = f.output();
  f.controller.receive('c1');
  await vi.waitFor(() => expect(output.attached).toBe(true));
  output.emit({
    type: 'start',
    messageId: 'answer',
    messageMetadata: metadata,
  });
  output.emit({ type: 'text-start', id: 'part' });
  output.emit({ type: 'text-delta', id: 'part', delta: 'A' });
  await vi.waitFor(() =>
    expect(appUIMessageText(f.controller.chat('c1').messages[0])).toBe('A'),
  );
  f.controller.dispatch('c1', {
    type: 'page',
    page: {
      items: [
        {
          id: 'answer',
          role: 'assistant',
          metadata: { ...metadata, seq: 2 },
          parts: [{ type: 'text', text: 'Old snapshot', state: 'done' }],
        },
      ],
      lastSeq: 2,
      nextCursor: null,
      hasMore: false,
    },
  });
  expect(appUIMessageText(f.controller.chat('c1').messages[0])).toBe('A');
  output.emit({ type: 'text-delta', id: 'part', delta: 'B' });
  await vi.waitFor(() =>
    expect(appUIMessageText(f.controller.chat('c1').messages[0])).toBe('AB'),
  );
  expect(f.controller.chat('c1').messages).toHaveLength(1);
});
it('retains interrupted output and explicitly resumes through SDK without resending input', async () => {
  const f = fixture(),
    output = f.output();
  f.controller.receive('c1');
  await vi.waitFor(() => expect(output.attached).toBe(true));
  output.emit({
    type: 'start',
    messageId: 'answer',
    messageMetadata: metadata,
  });
  output.emit({ type: 'text-start', id: 'part' });
  output.emit({ type: 'text-delta', id: 'part', delta: 'A' });
  await vi.waitFor(() =>
    expect(f.controller.chat('c1').messages).toHaveLength(1),
  );
  output.error(new TypeError('Network connection lost'));
  await vi.waitFor(() => expect(f.controller.state('c1')?.error).toBeDefined());
  f.setResponse(() =>
    sdkResponse([
      { type: 'start', messageId: 'answer', messageMetadata: metadata },
      { type: 'text-start', id: 'part' },
      { type: 'text-delta', id: 'part', delta: 'AB' },
      { type: 'text-end', id: 'part' },
      { type: 'finish' },
    ]),
  );
  await f.controller.resume('c1');
  expect(f.controller.chat('c1').messages).toHaveLength(1);
  expect(appUIMessageText(f.controller.chat('c1').messages[0])).toBe('AB');
  expect(
    f.stream.mock.calls.map((call) => (call[0] as { method: string }).method),
  ).toEqual(['GET', 'GET']);
  expect(f.controller.state('c1')?.error).toBeDefined();
});
it('keeps business occupancy after SDK finish and after missing transport, including approval waiting', async () => {
  const f = fixture();
  await f.controller.resume('c1');
  expect(f.controller.state('c1')?.status).toBe('ready');
  expect(f.controller.state('c1')?.error).toBeDefined();
  f.state.detail = {
    ...f.state.detail,
    execution: { status: 'running', waitingApproval: true },
  };
  await f.controller.refresh('c1');
  expect(
    agentsQueryClient().getQueryData<ConversationDetail>(
      chatKeys.conversation('c1'),
    )?.execution?.waitingApproval,
  ).toBe(true);
});
it('shares a canonical history load across views and rejects previous identity results', async () => {
  const f = fixture();
  let resolve!: (value: Awaited<ReturnType<typeof f.api.messages>>) => void;
  const messages = vi.spyOn(f.api, 'messages').mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const first = f.controller.loadHistory('c1'),
    second = f.controller.loadHistory('c1');
  expect(messages).toHaveBeenCalledOnce();
  f.controller.invalidate();
  resolve({ items: [], lastSeq: 2, nextCursor: null, hasMore: false });
  await Promise.all([first, second]);
  expect(f.controller.history('c1').state.loaded).toBe(false);
});
it('does not let a stale idle detail overwrite a newer command or clear an interrupted business state', async () => {
  const f = fixture();
  let resolve!: (value: ConversationDetail) => void;
  vi.spyOn(f.api, 'conversation').mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const old = f.controller.refresh('c1');
  await f.controller.command(
    'c1',
    async () => f.state.detail,
    (value) => value,
  );
  resolve({ ...f.state.detail, execution: { status: 'idle' } });
  await old;
  expect(agentsQueryClient().getQueryData(chatKeys.conversation('c1'))).toEqual(
    f.state.detail,
  );
});
it('keeps Stop pending until trusted terminal confirmation and clears identity lifetimes', async () => {
  const f = fixture();
  vi.spyOn(f.api, 'stop').mockResolvedValue(f.state.detail);
  await f.controller.stop('c1');
  expect(f.controller.isStopping('c1')).toBe(true);
  f.controller.observeDetail({
    ...f.state.detail,
    execution: { status: 'idle' },
  });
  expect(f.controller.isStopping('c1')).toBe(false);
  await f.controller.stop('c1');
  f.controller.invalidate();
  expect(f.controller.isStopping('c1')).toBe(false);
});
it('drains nextAfter before advancing the conversation watermark and rereads revisions by ID', async () => {
  const f = fixture();
  const first = {
    ...uiMessage(2, 'assistant', 'first'),
    metadata: { ...metadata, seq: 2, revision: 1 },
  };
  const final = {
    ...first,
    metadata: { ...first.metadata, revision: 3 },
    parts: [{ type: 'text' as const, text: 'changed', state: 'done' as const }],
  };
  const messages = vi
    .spyOn(f.api, 'messages')
    .mockResolvedValueOnce({
      items: [first],
      lastSeq: 4,
      nextCursor: null,
      hasMore: true,
      nextAfter: 2,
    })
    .mockResolvedValueOnce({
      items: [uiMessage(4)],
      lastSeq: 4,
      nextCursor: null,
      hasMore: false,
    })
    .mockResolvedValueOnce({
      items: [final],
      lastSeq: 4,
      nextCursor: null,
      hasMore: false,
    });
  await f.controller.loadHistory('c1');
  expect(messages.mock.calls[1][1]).toEqual({ after: 2 });
  expect(f.controller.history('c1').loadedThrough).toBe(4);
  f.controller.messageUpdated('c1', first.id, 3);
  f.controller.messageUpdated('c1', first.id, 3);
  await vi.waitFor(() =>
    expect(
      f.controller
        .chat('c1')
        .messages.find((message) => message.id === first.id)?.metadata
        ?.revision,
    ).toBe(3),
  );
  expect(messages).toHaveBeenCalledTimes(3);
  expect(messages.mock.calls[2][1]).toEqual({ ids: first.id });
});

it('releases a stalled subscriber only after matching persisted terminal history, without business Stop', async () => {
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
    expect(f.controller.chat('c1').status).toBe('streaming'),
  );
  await f.controller.refresh('c1');
  expect(f.controller.chat('c1').status).toBe('streaming');
  f.state.messages = [
    {
      id: 'answer',
      role: 'assistant',
      metadata: { ...metadata, revision: 2, seq: 2 },
      parts: [{ type: 'text', text: 'Durable answer', state: 'done' }],
    },
  ];
  f.state.detail = {
    ...f.state.detail,
    execution: {
      status: 'idle',
      messageId: 'answer',
      revision: 2,
      outcome: 'completed',
    },
  };
  await f.controller.refresh('c1');
  expect(f.controller.chat('c1').status).toBe('ready');
  await vi.waitFor(() =>
    expect(appUIMessageText(f.controller.chat('c1').messages[0])).toBe(
      'Durable answer',
    ),
  );
  expect(
    f.request.mock.calls.some(([request]) => request.path.endsWith('/stop')),
  ).toBe(false);
  expect(f.stream).toHaveBeenCalledOnce();
});

it.each(['announcement', 'poll'])(
  'keeps failed revision IDs for %s reconciliation without losing an older message update',
  async (retry) => {
    const f = fixture(),
      original = uiMessage(2, 'system', 'Original'),
      changed = {
        ...original,
        metadata: { ...original.metadata!, revision: 2 },
        parts: [
          { type: 'text' as const, text: 'Updated', state: 'done' as const },
        ],
      };
    f.state.detail = { ...f.state.detail, execution: { status: 'idle' } };
    f.state.messages = [original];
    await f.controller.loadHistory('c1');
    const read = vi
      .spyOn(f.api, 'messages')
      .mockRejectedValueOnce(new Error('Network lost'));
    f.controller.messageUpdated('c1', original.id, 2);
    await vi.waitFor(() =>
      expect(f.controller.history('c1').error).toBeDefined(),
    );
    f.state.messages = [changed];
    if (retry === 'announcement')
      f.controller.messageUpdated('c1', original.id, 2);
    else await f.controller.loadHistory('c1', false, true);
    await vi.waitFor(() =>
      expect(appUIMessageText(f.controller.chat('c1').messages[0])).toBe(
        'Updated',
      ),
    );
    expect(
      read.mock.calls.filter((call) => call[1]?.ids).map((call) => call[1]),
    ).toEqual([{ ids: original.id }, { ids: original.id }]);
  },
);

it('disposes approval continuations and finalization callbacks before another identity can issue a request', async () => {
  const f = fixture(),
    chat = f.controller.chat('c1');
  let release!: () => void;
  vi.spyOn(chat, 'addToolApprovalResponse').mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  const approval = f.controller.approve('c1', {
    messageId: 'answer',
    executionId: 'native',
    approval: { id: 'pending', approved: true },
  });
  const rejected = approval.catch((error: unknown) => error);
  await vi.waitFor(() => expect(release).toBeDefined());
  f.controller.invalidate();
  release();
  await expect(rejected).resolves.toMatchObject({ silent: true });
  await f.controller.refresh('c1');
  await f.controller.reread('c1', ['answer']);
  expect(f.stream).not.toHaveBeenCalled();
  expect(f.request).not.toHaveBeenCalled();
  const second = fixture();
  let finish!: (detail: ConversationDetail) => void;
  vi.spyOn(second.api, 'finalize').mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const saving = second.controller.finalize('c1');
  await vi.waitFor(() => expect(second.api.finalize).toHaveBeenCalledOnce());
  second.controller.invalidate();
  finish(second.state.detail);
  await saving;
  expect(second.request).not.toHaveBeenCalled();
});

it('replays an interrupted approved continuation from its saved tool state without duplicating text or tool parts', async () => {
  const f = fixture();
  const original: AppUIMessage = {
    id: 'answer',
    role: 'assistant',
    metadata: { ...metadata, revision: 2, seq: 2 },
    parts: [
      {
        type: 'tool-business',
        toolCallId: 'call',
        state: 'approval-responded',
        input: { value: 'allowed' },
        approval: { id: 'approval', approved: true },
      },
    ],
  };
  f.state.messages = [original];
  const output = f.output();
  f.controller.receive('c1');
  await vi.waitFor(() => expect(output.attached).toBe(true));
  output.emit({
    type: 'start',
    messageId: 'answer',
    messageMetadata: original.metadata,
  });
  output.emit({
    type: 'tool-output-available',
    toolCallId: 'call',
    output: { ok: true },
  });
  output.emit({ type: 'text-start', id: 'text' });
  output.emit({ type: 'text-delta', id: 'text', delta: 'A' });
  await vi.waitFor(() =>
    expect(appUIMessageText(f.controller.chat('c1').messages.at(-1)!)).toBe(
      'A',
    ),
  );
  output.error(new TypeError('Network connection lost'));
  await vi.waitFor(() => expect(f.controller.state('c1')?.error).toBeDefined());
  const old = f.controller.chat('c1');
  f.setResponse(() => {
    f.state.messages = [
      {
        ...original,
        metadata: { ...original.metadata!, revision: 3 },
        parts: [
          {
            type: 'tool-business',
            toolCallId: 'call',
            state: 'output-available',
            input: { value: 'allowed' },
            approval: { id: 'approval', approved: true },
            output: { ok: true },
          },
          { type: 'text', text: 'AB', state: 'done' },
        ],
      },
    ];
    f.state.detail = {
      ...f.state.detail,
      execution: {
        status: 'idle',
        outcome: 'completed',
        messageId: 'answer',
        revision: 3,
      },
    };
    return sdkResponse([
      {
        type: 'start',
        messageId: 'answer',
        messageMetadata: original.metadata,
      },
      {
        type: 'tool-output-available',
        toolCallId: 'call',
        output: { ok: true },
      },
      { type: 'text-start', id: 'text' },
      { type: 'text-delta', id: 'text', delta: 'AB' },
      { type: 'text-end', id: 'text' },
      { type: 'finish' },
    ]);
  });
  await f.controller.resume('c1');
  expect(f.controller.chat('c1')).not.toBe(old);
  expect(f.controller.chat('c1').messages).toHaveLength(1);
  expect(appUIMessageText(f.controller.chat('c1').messages[0])).toBe('AB');
  expect(
    f.controller
      .chat('c1')
      .messages[0].parts.filter((part) => part.type === 'tool-business'),
  ).toHaveLength(1);
  expect(
    f.stream.mock.calls.map((call) => (call[0] as { method: string }).method),
  ).toEqual(['GET', 'GET']);
});
it('retains an interrupted unsaved tool input when shared recovery has no stream, without repeating input', async () => {
  const f = fixture(),
    output = f.output();
  f.controller.receive('c1');
  await vi.waitFor(() => expect(output.attached).toBe(true));
  output.emit({
    type: 'start',
    messageId: 'answer',
    messageMetadata: metadata,
  });
  output.emit({
    type: 'tool-input-start',
    toolCallId: 'call',
    toolName: 'business',
  });
  output.emit({
    type: 'tool-input-delta',
    toolCallId: 'call',
    inputTextDelta: '{"value":',
  });
  await vi.waitFor(() =>
    expect(f.controller.chat('c1').messages.at(-1)?.parts[0]?.type).toBe(
      'tool-business',
    ),
  );
  output.error(new TypeError('Network connection lost'));
  await vi.waitFor(() => expect(f.controller.state('c1')?.error).toBeDefined());
  f.setResponse(() => new Response(null, { status: 204 }));
  await f.controller.resume('c1');
  expect(f.controller.chat('c1').messages).toHaveLength(1);
  expect(f.controller.chat('c1').messages[0].parts[0].type).toBe(
    'tool-business',
  );
  expect(f.controller.state('c1')?.error).toBeDefined();
  expect(
    f.stream.mock.calls.map((call) => (call[0] as { method: string }).method),
  ).toEqual(['GET', 'GET']);
});

it('orders approval as a command and refuses concurrent opposite decisions before SDK preparation finishes', async () => {
  const f = fixture();
  f.state.detail = { ...f.state.detail, execution: { status: 'idle' } };
  const chat = f.controller.chat('c1');
  let prepare!: () => void, read!: (detail: ConversationDetail) => void;
  vi.spyOn(chat, 'addToolApprovalResponse').mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        prepare = resolve;
      }),
  );
  vi.spyOn(f.api, 'conversation').mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        read = resolve;
      }),
  );
  const old = f.controller.refresh('c1');
  let late!: (detail: ConversationDetail) => void;
  const oldCommand = f.controller.command(
    'c1',
    () =>
      new Promise<ConversationDetail>((resolve) => {
        late = resolve;
      }),
    (value) => value,
  );
  await vi.waitFor(() => expect(late).toBeDefined());
  const approval = {
    messageId: 'answer',
    executionId: 'native',
    approval: { id: 'pending', approved: true },
  };
  const first = f.controller.approve('c1', approval);
  await vi.waitFor(() => expect(prepare).toBeDefined());
  await expect(
    f.controller.approve('c1', {
      ...approval,
      approval: { id: 'pending', approved: false },
    }),
  ).rejects.toThrow('busy');
  read({
    ...f.state.detail,
    title: 'Stale waiting state',
    execution: { status: 'running', waitingApproval: true },
  });
  await old;
  expect(
    agentsQueryClient().getQueryData<ConversationDetail>(
      chatKeys.conversation('c1'),
    )?.title,
  ).not.toBe('Stale waiting state');
  late({ ...f.state.detail, title: 'Stale admission' });
  await oldCommand;
  expect(
    agentsQueryClient().getQueryData<ConversationDetail>(
      chatKeys.conversation('c1'),
    )?.title,
  ).not.toBe('Stale admission');
  prepare();
  await first;
  expect(f.stream).toHaveBeenCalledOnce();
  expect(f.stream.mock.calls[0][0]).toMatchObject({
    method: 'POST',
    json: approval,
  });
});

it('acknowledges a disconnected response only after its terminal message is saved and retires its SDK error state', async () => {
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
  output.emit({ type: 'text-delta', id: 'text', delta: 'A' });
  await vi.waitFor(() =>
    expect(f.controller.chat('c1').messages).toHaveLength(1),
  );
  output.error(new TypeError('Network connection lost'));
  await vi.waitFor(() => expect(f.controller.state('c1')?.error).toBeDefined());
  const interrupted = f.controller.chat('c1');
  f.state.messages = [
    {
      id: 'answer',
      role: 'assistant',
      metadata: { ...metadata, seq: 2, revision: 1 },
      parts: [{ type: 'text', text: 'AB', state: 'done' }],
    },
  ];
  f.state.detail = {
    ...f.state.detail,
    execution: {
      status: 'idle',
      outcome: 'completed',
      messageId: 'answer',
      revision: 1,
    },
  };
  await f.controller.refresh('c1');
  expect(f.controller.state('c1')?.error).toBeUndefined();
  expect(f.controller.state('c1')?.status).toBe('ready');
  expect(f.controller.chat('c1')).not.toBe(interrupted);
  expect(appUIMessageText(f.controller.chat('c1').messages[0])).toBe('AB');
  expect(f.stream).toHaveBeenCalledOnce();
});

it('keeps live independent notices in source order without letting SDK deltas append duplicate logical messages', async () => {
  const f = fixture(),
    output = f.output();
  f.controller.receive('c1');
  await vi.waitFor(() => expect(output.attached).toBe(true));
  const first = {
    ...metadata,
    seq: 2,
    revision: 2,
    sourceRecords: [
      {
        recordId: 'a',
        seq: 2,
        partId: 'a-text',
        partIndex: 0,
        createdAt: '2026-01-01T00:00:01Z',
      },
    ],
  };
  output.emit({ type: 'start', messageId: 'answer', messageMetadata: first });
  output.emit({ type: 'text-start', id: 'a' });
  output.emit({ type: 'text-delta', id: 'a', delta: 'First' });
  output.emit({ type: 'text-end', id: 'a' });
  await vi.waitFor(() =>
    expect(f.controller.chat('c1').messages).toHaveLength(1),
  );
  const notice: AppUIMessage = {
    id: 'notice',
    role: 'system',
    metadata: {
      conversationId: 'c1',
      seq: 3,
      revision: 1,
      createdAt: '2026-01-01T00:00:02Z',
    },
    parts: [
      {
        type: 'data-notice',
        id: 'news',
        data: { type: 'news', title: 'Independent' },
      },
    ],
  };
  f.state.messages = [notice];
  await f.controller.loadHistory('c1', false, true);
  const final = {
    ...first,
    revision: 4,
    sourceRecords: [
      ...first.sourceRecords,
      {
        recordId: 'b',
        seq: 4,
        partId: 'b-text',
        partIndex: 1,
        createdAt: '2026-01-01T00:00:03Z',
      },
    ],
  };
  output.emit({ type: 'message-metadata', messageMetadata: final });
  output.emit({ type: 'text-start', id: 'b' });
  output.emit({ type: 'text-delta', id: 'b', delta: 'Second' });
  output.emit({ type: 'text-end', id: 'b' });
  await vi.waitFor(() =>
    expect(
      appUIMessageText(
        f.controller
          .chat('c1')
          .messages.find((message) => message.id === 'answer')!,
      ),
    ).toBe('First\nSecond'),
  );
  expect(
    f.controller
      .chat('c1')
      .messages.filter((message) => message.id === 'answer'),
  ).toHaveLength(1);
  const { chatMessageSegments } = await import('../../client/chat.js');
  expect(
    chatMessageSegments(f.controller.chat('c1').messages).map(
      (segment) => segment.seq,
    ),
  ).toEqual([2, 3, 4]);
});
it('continues approval on its stable assistant while later independent notifications are read during the response', async () => {
  const f = fixture();
  const approval: AppUIMessage = {
    id: 'answer',
    role: 'assistant',
    metadata: { ...metadata, seq: 2, revision: 1 },
    parts: [
      {
        type: 'tool-business',
        toolCallId: 'call',
        state: 'approval-requested',
        input: { value: 'allowed' },
        approval: { id: 'approval' },
      },
    ],
  };
  const notice: AppUIMessage = {
    id: 'notice',
    role: 'system',
    metadata: {
      conversationId: 'c1',
      seq: 3,
      revision: 1,
      createdAt: '2026-01-01T00:00:02Z',
    },
    parts: [
      {
        type: 'data-notice',
        id: 'news',
        data: { type: 'news', title: 'Independent' },
      },
    ],
  };
  f.state.messages = [approval, notice];
  await f.controller.loadHistory('c1');
  const output = f.output();
  const sending = f.controller.approve('c1', {
    messageId: 'answer',
    executionId: 'native-1',
    approval: { id: 'approval', approved: true },
  });
  await vi.waitFor(() => expect(output.attached).toBe(true));
  output.emit({
    type: 'start',
    messageId: 'answer',
    messageMetadata: approval.metadata,
  });
  output.emit({
    type: 'tool-output-available',
    toolCallId: 'call',
    output: { ok: true },
  });
  const late = {
    ...notice,
    id: 'late',
    metadata: { ...notice.metadata!, seq: 4 },
  };
  f.state.messages = [approval, notice, late];
  await f.controller.loadHistory('c1', false, true);
  output.emit({ type: 'text-start', id: 'text' });
  output.emit({ type: 'text-delta', id: 'text', delta: 'Approved' });
  await vi.waitFor(() =>
    expect(
      f.controller
        .chat('c1')
        .messages.find((message) => message.id === 'answer')
        ?.parts.some(
          (part) => part.type === 'text' && part.text === 'Approved',
        ),
    ).toBe(true),
  );
  const final: AppUIMessage = {
    ...approval,
    metadata: { ...approval.metadata!, revision: 2 },
    parts: [
      {
        type: 'tool-business',
        toolCallId: 'call',
        state: 'output-available',
        input: { value: 'allowed' },
        approval: { id: 'approval', approved: true },
        output: { ok: true },
      },
      { type: 'text', text: 'Approved', state: 'done' },
    ],
  };
  f.state.messages = [final, notice, late];
  f.state.detail = {
    ...f.state.detail,
    execution: {
      status: 'idle',
      outcome: 'completed',
      messageId: 'answer',
      revision: 2,
    },
  };
  output.emit({ type: 'text-end', id: 'text' });
  output.emit({ type: 'finish', messageMetadata: final.metadata });
  output.close();
  await sending;
  expect(f.controller.chat('c1').messages.map((message) => message.id)).toEqual(
    ['answer', 'notice', 'late'],
  );
  expect(f.controller.state('c1')?.error).toBeUndefined();
  expect(f.stream).toHaveBeenCalledOnce();
});
