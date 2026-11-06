import { expect, it } from 'vitest';
import { chatMessageSegments } from '../../client/chat/message-model.js';
import type {
  AppUIMessage,
  AppUIMessageMetadata,
} from '../../shared/online-agent.js';

const metadata: AppUIMessageMetadata = {
  conversationId: 'conversation',
  createdAt: '2026-01-01T00:00:00Z',
  seq: 1,
  revision: 1,
  executionId: 'execution',
  sourceUserMessageId: 'question',
};
const completed: AppUIMessage['parts'][number] = {
  type: 'data-notice',
  id: 'execution-status',
  data: { type: 'completed', title: 'Completed' },
};

it.each(['assistant', 'system'] as const)(
  'omits invisible live and historical %s messages without changing SDK parts',
  (role) => {
    const invisible: AppUIMessage['parts'][] = [
      [],
      [{ type: 'text', text: '', state: 'streaming' }],
      [{ type: 'text', text: ' \n\t ', state: 'done' }],
      [{ type: 'step-start' }],
      [{ type: 'reasoning', text: '   ', state: 'streaming' }],
      [completed],
      [
        { type: 'step-start' },
        { type: 'reasoning', text: '   ', state: 'done' },
        { type: 'text', text: '  ' },
        completed,
      ],
    ];
    for (const parts of invisible) {
      for (const saved of [false, true]) {
        const message: AppUIMessage = {
          id: 'answer',
          role,
          parts,
          ...(saved ? { metadata } : {}),
        };
        const original = structuredClone(message);
        expect(chatMessageSegments([message])).toEqual([]);
        expect(message).toEqual(original);
        expect(message.parts).toBe(parts);
        expect(message.metadata).toBe(saved ? metadata : undefined);
      }
    }
  },
);

it('shows a live text part only after visible output arrives, keeping its original index and text', () => {
  const message: AppUIMessage = {
    id: 'answer',
    role: 'assistant',
    parts: [
      { type: 'step-start' },
      { type: 'reasoning', text: ' ' },
      { type: 'text', text: ' \n', state: 'streaming' },
    ],
  };
  expect(chatMessageSegments([message])).toEqual([]);
  message.parts[2] = { type: 'text', text: '  Answer\n', state: 'streaming' };
  expect(chatMessageSegments([message])).toEqual([
    {
      key: 'answer',
      message,
      partIndexes: [2],
      seq: undefined,
      at: '',
      first: true,
      last: true,
    },
  ]);
  expect(chatMessageSegments([message])[0].message).toBe(message);
  expect(message.parts[2]).toEqual({
    type: 'text',
    text: '  Answer\n',
    state: 'streaming',
  });
});

const toolParts: AppUIMessage['parts'] = [
  {
    type: 'tool-business',
    toolCallId: 'input',
    state: 'input-streaming',
    input: { query: 'Lookup' },
  },
  {
    type: 'tool-business',
    toolCallId: 'output',
    state: 'output-available',
    input: {},
    output: { value: 1 },
  },
  {
    type: 'dynamic-tool',
    toolName: 'custom',
    toolCallId: 'dynamic',
    state: 'output-available',
    input: {},
    output: { value: 2 },
  },
  {
    type: 'tool-business',
    toolCallId: 'error',
    state: 'output-error',
    input: {},
    errorText: 'Tool failed',
  },
  {
    type: 'tool-business',
    toolCallId: 'approval',
    state: 'approval-requested',
    input: {},
    approval: { id: 'approve' },
  },
  {
    type: 'tool-business',
    toolCallId: 'approved',
    state: 'approval-responded',
    input: {},
    approval: { id: 'approved', approved: true },
  },
  {
    type: 'tool-business',
    toolCallId: 'denied',
    state: 'output-denied',
    input: {},
    approval: { id: 'denied', approved: false },
  },
];
it.each(toolParts)('retains tool-only SDK output: $type $state', (part) => {
  const message: AppUIMessage = {
    id: 'answer',
    role: 'assistant',
    metadata,
    parts: [{ type: 'text', text: '' }, part, completed],
  };
  const original = structuredClone(message);
  const [segment] = chatMessageSegments([message]);
  expect(segment.partIndexes).toEqual([1]);
  expect(segment.message).toBe(message);
  expect(segment.message.parts[1]).toBe(part);
  expect(segment.first).toBe(true);
  expect(segment.last).toBe(true);
  expect(message).toEqual(original);
});

it('hides only the framework success notice, retaining files, business data and custom completed notices', () => {
  const message: AppUIMessage = {
    id: 'answer',
    role: 'assistant',
    metadata,
    parts: [
      completed,
      {
        type: 'data-notice',
        id: 'business-result',
        data: { type: 'completed', title: 'Invoice completed' },
      },
      {
        type: 'data-notice',
        data: { type: 'completed', title: 'Custom completion' },
      },
      {
        type: 'file',
        mediaType: 'application/pdf',
        url: '/report.pdf',
        filename: 'report.pdf',
      },
      {
        type: 'data-business',
        id: 'invoice',
        data: {
          kind: 'invoice',
          id: 'invoice',
          payload: { status: 'completed' },
        },
      },
      {
        type: 'data-notice',
        id: 'news',
        data: { type: 'news', title: 'Business notification' },
      },
      { type: 'text', text: '  Answer  ', state: 'done' },
    ],
  };
  const original = structuredClone(message);
  const [segment] = chatMessageSegments([message]);
  expect(segment.message).toBe(message);
  expect(segment.partIndexes).toEqual([1, 2, 3, 4, 5, 6]);
  expect(message).toEqual(original);
  for (const index of segment.partIndexes) {
    const part = message.parts[index];
    expect(
      chatMessageSegments([{ ...message, parts: [part] }])[0].partIndexes,
    ).toEqual([0]);
  }
});

it.each([
  'failed',
  'cancelled',
  'unknown',
  'stopping',
  'running',
  'effectReview',
])('retains the framework %s execution notice', (type) => {
  const message: AppUIMessage = {
    id: 'status',
    role: 'system',
    metadata,
    parts: [
      {
        type: 'data-notice',
        id: 'execution-status',
        data: { type, title: type },
      },
    ],
  };
  const [segment] = chatMessageSegments([message]);
  expect(segment.message).toBe(message);
  expect(segment.partIndexes).toEqual([0]);
});

it('filters source-record groups before choosing first and last while retaining source ordering and identity', () => {
  const message: AppUIMessage = {
    id: 'answer',
    role: 'system',
    metadata: {
      ...metadata,
      sourceRecords: [
        { recordId: 'empty-first', seq: 1, partId: 'step', partIndex: 0 },
        { recordId: 'first', seq: 2, partId: 'text', partIndex: 1 },
        { recordId: 'first', seq: 2, partId: 'blank', partIndex: 2 },
        { recordId: 'first', seq: 2, partId: 'file', partIndex: 3 },
        { recordId: 'empty-middle', seq: 3, partId: 'reasoning', partIndex: 4 },
        {
          recordId: 'last',
          seq: 5,
          partId: 'tool',
          partIndex: 5,
          createdAt: '2026-01-01T00:00:05Z',
        },
        { recordId: 'empty-last', seq: 6, partId: 'completed', partIndex: 6 },
        { recordId: 'missing', seq: 7, partId: 'missing', partIndex: 99 },
      ],
    },
    parts: [
      { type: 'step-start' },
      { type: 'text', text: 'First' },
      { type: 'text', text: ' \t' },
      { type: 'file', mediaType: 'text/plain', url: '/file.txt' },
      { type: 'reasoning', text: ' ' },
      toolParts[1],
      completed,
    ],
  };
  const notice: AppUIMessage = {
    id: 'notice',
    role: 'system',
    metadata: { ...metadata, seq: 4, createdAt: '2026-01-01T00:00:04Z' },
    parts: [
      { type: 'data-notice', data: { type: 'news', title: 'Independent' } },
    ],
  };
  const messages = [notice, message];
  const original = structuredClone(messages);
  const segments = chatMessageSegments(messages);
  expect(
    segments.map(({ key, partIndexes, seq, at, first, last }) => ({
      key,
      partIndexes,
      seq,
      at,
      first,
      last,
    })),
  ).toEqual([
    {
      key: 'answer:first',
      partIndexes: [1, 3],
      seq: 2,
      at: metadata.createdAt,
      first: true,
      last: false,
    },
    {
      key: 'notice',
      partIndexes: [0],
      seq: 4,
      at: notice.metadata!.createdAt,
      first: true,
      last: true,
    },
    {
      key: 'answer:last',
      partIndexes: [5],
      seq: 5,
      at: '2026-01-01T00:00:05Z',
      first: false,
      last: true,
    },
  ]);
  expect(segments[0].message).toBe(message);
  expect(segments[1].message).toBe(notice);
  expect(segments[2].message).toBe(message);
  expect(messages).toEqual(original);

  const [onlyVisible] = chatMessageSegments([
    {
      ...message,
      parts: message.parts.map((part, index) =>
        index === 1 || index === 3 ? { type: 'text', text: '' } : part,
      ),
    },
  ]);
  expect(onlyVisible.key).toBe('answer:last');
  expect(onlyVisible.partIndexes).toEqual([5]);
  expect(onlyVisible.first).toBe(true);
  expect(onlyVisible.last).toBe(true);
});

it('keeps original source-group ordering when its first visible part follows another group', () => {
  const message: AppUIMessage = {
    id: 'answer',
    role: 'system',
    metadata: {
      ...metadata,
      sourceRecords: [
        { recordId: 'first', seq: 1, partId: 'step', partIndex: 0 },
        { recordId: 'last', seq: 2, partId: 'last-text', partIndex: 1 },
        { recordId: 'first', seq: 1, partId: 'first-text', partIndex: 2 },
      ],
    },
    parts: [
      { type: 'step-start' },
      { type: 'text', text: 'Last' },
      { type: 'text', text: 'First' },
    ],
  };
  expect(
    chatMessageSegments([message]).map(({ key, partIndexes, first, last }) => ({
      key,
      partIndexes,
      first,
      last,
    })),
  ).toEqual([
    { key: 'answer:first', partIndexes: [2], first: true, last: false },
    { key: 'answer:last', partIndexes: [1], first: false, last: true },
  ]);
});

it.each([false, true])(
  'retains context-only user rows (source records: %s)',
  (sourced) => {
    for (const parts of [
      [],
      [{ type: 'text', text: ' \n\t' }],
    ] satisfies AppUIMessage['parts'][]) {
      const message: AppUIMessage = {
        id: 'question',
        role: 'user',
        metadata: {
          ...metadata,
          context: { route: '/invoices', items: [], dropped: 0 },
          ...(sourced
            ? {
                sourceRecords: [
                  {
                    recordId: 'question-source',
                    seq: 1,
                    partId: 'blank',
                    partIndex: 0,
                  },
                ],
              }
            : {}),
        },
        parts,
      };
      const original = structuredClone(message);
      const [segment] = chatMessageSegments([message]);
      expect(segment.message).toBe(message);
      expect(segment.partIndexes).toEqual([]);
      expect(segment.first).toBe(true);
      expect(segment.last).toBe(true);
      expect(message).toEqual(original);
    }
  },
);

it('preserves reasoning, tools and text in original positions without merging reasoning across steps', () => {
  const message: AppUIMessage = {
    id: 'reasoning',
    role: 'assistant',
    parts: [
      { type: 'step-start' },
      { type: 'reasoning', text: ' First ', state: 'done' },
      toolParts[1],
      { type: 'step-start' },
      { type: 'reasoning', text: 'Second', state: 'streaming' },
      { type: 'text', text: 'Answer' },
    ],
  };
  const segments = chatMessageSegments([message]);
  expect(segments).toHaveLength(1);
  expect(segments[0].partIndexes).toEqual([1, 2, 4, 5]);
  expect(segments[0].message).toBe(message);
  expect(message.parts[1]).toMatchObject({ text: ' First ' });
});

it.each(['streaming', 'done'] as const)(
  'keeps one assistant bubble across source blocks in %s responses',
  (state) => {
    const message: AppUIMessage = {
      id: 'runner:execution',
      role: 'assistant',
      metadata: {
        ...metadata,
        sourceRecords: [
          { recordId: 'opening', partId: 'opening', partIndex: 0, seq: 2 },
          { recordId: 'thought-1', partId: 'thought-1', partIndex: 1, seq: 3 },
          { recordId: 'thought-2', partId: 'thought-2', partIndex: 2, seq: 3 },
          { recordId: 'answer', partId: 'answer', partIndex: 3, seq: 4 },
        ],
      },
      parts: [
        { type: 'text', text: 'Opening', state: 'done' },
        { type: 'reasoning', text: 'First thought', state: 'done' },
        { type: 'reasoning', text: 'Second thought', state: 'done' },
        { type: 'text', text: 'Answer', state },
      ],
    };
    const notice: AppUIMessage = {
      id: 'notice',
      role: 'system',
      metadata: { ...metadata, seq: 5 },
      parts: [
        {
          type: 'data-notice',
          data: { type: 'cancelled', title: 'Cancellation requested.' },
        },
      ],
    };
    const next: AppUIMessage = {
      ...message,
      id: 'runner:next',
      metadata: { ...metadata, seq: 7 },
      parts: [{ type: 'text', text: 'Next answer' }],
    };
    const original = structuredClone(message);
    const segments = chatMessageSegments([message, notice, next]);
    expect(segments.map((segment) => segment.key)).toEqual([
      'runner:execution',
      'notice',
      'runner:next',
    ]);
    expect(segments[0]).toMatchObject({
      partIndexes: [0, 1, 2, 3],
      first: true,
      last: true,
      seq: 2,
    });
    expect(segments[0].message).toBe(message);
    expect(message).toEqual(original);
    expect(chatMessageSegments([message])[0].key).toBe(segments[0].key);
  },
);
