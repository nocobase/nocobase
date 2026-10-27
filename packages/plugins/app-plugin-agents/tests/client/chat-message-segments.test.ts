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

it.each(['streaming', 'done'] as const)(
  'splits a %s response only where a visible card or user message interrupts its sources',
  (state) => {
    for (const role of ['system', 'user'] as const) {
      const message: AppUIMessage = {
        id: 'response',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Opening A', state: 'done' },
          { type: 'reasoning', text: 'Thought A', state: 'done' },
          { type: 'reasoning', text: 'Thought B', state: 'done' },
          { type: 'text', text: 'Answer B', state },
        ],
        metadata: {
          ...metadata,
          seq: 2,
          sourceRecords: [
            { recordId: 'opening', seq: 2, partId: 'a', partIndex: 0 },
            { recordId: 'thought-a', seq: 3, partId: 'ta', partIndex: 1 },
            { recordId: 'thought-b', seq: 5, partId: 'tb', partIndex: 2 },
            { recordId: 'answer', seq: 6, partId: 'b', partIndex: 3 },
          ],
        },
      };
      const barrier: AppUIMessage = {
        id: 'barrier',
        role,
        metadata: { ...metadata, seq: 4 },
        parts:
          role === 'user'
            ? [{ type: 'text', text: 'User question' }]
            : [
                {
                  type: 'data-notice',
                  data: { type: 'news', title: 'Task update' },
                },
              ],
      };
      const original = structuredClone([message, barrier]);
      const segments = chatMessageSegments([barrier, message]);
      expect(
        segments.map((segment) => [
          segment.message.id,
          segment.partIndexes,
          segment.seq,
          segment.first,
          segment.last,
        ]),
      ).toEqual([
        ['response', [0, 1], 2, true, false],
        ['barrier', [0], 4, true, true],
        ['response', [2, 3], 5, false, true],
      ]);
      expect(segments[0].message).toBe(message);
      expect(segments[2].message).toBe(message);
      expect(
        new Set(
          segments
            .filter((segment) => segment.message.role === 'assistant')
            .map((segment) => segment.message),
        ).size,
      ).toBe(1);
      expect([message, barrier]).toEqual(original);
      // Removing an invisible card does not fragment otherwise continuous reasoning and text.
      expect(
        chatMessageSegments([
          message,
          { ...barrier, role: 'system', parts: [completed] },
        ]),
      ).toMatchObject([
        { key: 'response', partIndexes: [0, 1, 2, 3], first: true, last: true },
      ]);
    }
  },
);

it('keeps segment anchors and the original message as parts grow and interleaved history arrives', () => {
  const opening: AppUIMessage = {
    id: 'response',
    role: 'assistant',
    parts: [{ type: 'text', text: 'A', state: 'done' }],
    metadata: {
      ...metadata,
      seq: 2,
      sourceRecords: [{ recordId: 'a', seq: 2, partId: 'a', partIndex: 0 }],
    },
  };
  const complete: AppUIMessage = {
    ...opening,
    parts: [
      ...opening.parts,
      { type: 'text', text: 'B', state: 'done' },
      { type: 'text', text: 'C', state: 'streaming' },
    ],
    metadata: {
      ...opening.metadata!,
      sourceRecords: [
        ...opening.metadata!.sourceRecords!,
        { recordId: 'b', seq: 4, partId: 'b', partIndex: 1 },
      ],
    },
  };
  const card: AppUIMessage = {
    id: 'card',
    role: 'system',
    metadata: { ...metadata, seq: 3 },
    parts: [
      { type: 'data-notice', data: { type: 'news', title: 'Task update' } },
    ],
  };
  const firstKey = chatMessageSegments([opening])[0].key;
  const beforeHistory = chatMessageSegments([complete]);
  expect(beforeHistory).toHaveLength(1);
  expect(beforeHistory[0].key).toBe(firstKey);
  const segments = chatMessageSegments([complete, card]);
  expect(segments.map((segment) => [segment.key, segment.partIndexes])).toEqual(
    [
      [firstKey, [0]],
      ['card', [0]],
      ['response:b', [1, 2]],
    ],
  );
  expect(chatMessageSegments([card, complete])).toEqual(segments);
  const canonical = {
    ...complete,
    metadata: {
      ...complete.metadata!,
      sourceRecords: [
        ...complete.metadata!.sourceRecords!,
        { recordId: 'c', seq: 5, partId: 'c', partIndex: 2 },
      ],
    },
    parts: complete.parts.map((part) =>
      part.type === 'text' ? { ...part, state: 'done' as const } : part,
    ),
  };
  expect(
    chatMessageSegments([canonical, card]).map((segment) => segment.key),
  ).toEqual(segments.map((segment) => segment.key));
});

it('anchors a continuation to its part ID when a preview becomes a saved source', () => {
  const reply: AppUIMessage = {
    id: 'runner:response',
    role: 'assistant',
    parts: [
      { type: 'text', text: 'A', state: 'done' },
      { type: 'reasoning', text: 'Thought B', state: 'streaming' },
      { type: 'text', text: 'B', state: 'streaming' },
    ],
    metadata: {
      ...metadata,
      sourceRecords: [
        { recordId: 'saved-a', partId: 'output:a', partIndex: 0, seq: 2 },
        {
          recordId: 'output:thought',
          partId: 'output:thought',
          partIndex: 1,
          seq: 4,
        },
        { recordId: 'output:b', partId: 'output:b', partIndex: 2, seq: 4 },
      ],
    },
  };
  const card: AppUIMessage = {
    id: 'card',
    role: 'system',
    metadata: { ...metadata, seq: 3 },
    parts: [
      { type: 'data-notice', data: { type: 'news', title: 'Task update' } },
    ],
  };
  const keys = chatMessageSegments([reply, card]).map((segment) => segment.key);
  const saved: AppUIMessage = {
    ...reply,
    metadata: {
      ...reply.metadata!,
      sourceRecords: reply.metadata!.sourceRecords!.map((source) => ({
        ...source,
        recordId: `saved-${source.partId}`,
      })),
    },
  };
  expect(
    chatMessageSegments([saved, card]).map((segment) => segment.key),
  ).toEqual(keys);
  expect(keys).toEqual([
    'runner:response',
    'card',
    'runner:response:output:thought',
  ]);
});

it.each([true, false])(
  'orders equal-sequence sources by their actual timestamps (preview first=%s)',
  (previewFirst) => {
    const reply: AppUIMessage = {
      id: 'response',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'A' },
        { type: 'text', text: 'B' },
      ],
      metadata: {
        ...metadata,
        sourceRecords: [
          {
            recordId: 'a',
            partId: 'a',
            partIndex: 0,
            seq: 2,
            createdAt: '2026-01-01T00:00:00Z',
          },
          {
            recordId: 'output:b',
            partId: 'output:b',
            partIndex: 1,
            seq: 3,
            createdAt: `2026-01-01T00:00:0${previewFirst ? 1 : 3}Z`,
          },
        ],
      },
    };
    const card: AppUIMessage = {
      id: 'card',
      role: 'system',
      metadata: { ...metadata, seq: 3, createdAt: '2026-01-01T00:00:02Z' },
      parts: [
        { type: 'data-notice', data: { type: 'news', title: 'Task update' } },
      ],
    };
    const expected = previewFirst
      ? [
          ['response', [0, 1]],
          ['card', [0]],
        ]
      : [
          ['response', [0]],
          ['card', [0]],
          ['response', [1]],
        ];
    for (const messages of [
      [reply, card],
      [card, reply],
    ])
      expect(
        chatMessageSegments(messages).map((segment) => [
          segment.message.id,
          segment.partIndexes,
        ]),
      ).toEqual(expected);
  },
);

it('uses stable segment identities for otherwise indistinguishable source positions', () => {
  const reply: AppUIMessage = {
    id: 'response',
    role: 'assistant',
    parts: [
      { type: 'text', text: 'A' },
      { type: 'text', text: 'B' },
    ],
    metadata: {
      ...metadata,
      sourceRecords: [
        { recordId: 'a', partId: 'a', partIndex: 0, seq: 2 },
        {
          recordId: 'output:b',
          partId: 'output:b',
          partIndex: 1,
          seq: 3,
          createdAt: metadata.createdAt,
        },
      ],
    },
  };
  const card: AppUIMessage = {
    id: 'card',
    role: 'system',
    metadata: { ...metadata, seq: 3 },
    parts: [
      { type: 'data-notice', data: { type: 'news', title: 'Task update' } },
    ],
  };
  const keys = chatMessageSegments([reply, card]).map((segment) => segment.key);
  expect(keys).toEqual(['response', 'card', 'response:output:b']);
  expect(
    chatMessageSegments([card, reply]).map((segment) => segment.key),
  ).toEqual(keys);
});

it('keeps an undated turn footer after its body in the same continuation', () => {
  const reply: AppUIMessage = {
    id: 'response',
    role: 'assistant',
    parts: [
      { type: 'text', text: 'Opening' },
      { type: 'text', text: 'Partial body' },
      { type: 'data-turn', data: { outcome: 'cancelled' } },
    ],
    metadata: {
      ...metadata,
      sourceRecords: [
        {
          recordId: 'a',
          partId: 'a',
          partIndex: 0,
          seq: 2,
          createdAt: '2026-01-01T00:00:01Z',
        },
        {
          recordId: 'b',
          partId: 'b',
          partIndex: 1,
          seq: 4,
          createdAt: '2026-01-01T00:00:03Z',
        },
        { recordId: 'turn', partId: 'turn', partIndex: 2, seq: 4 },
      ],
    },
  };
  const card: AppUIMessage = {
    id: 'card',
    role: 'system',
    metadata: { ...metadata, seq: 3, createdAt: '2026-01-01T00:00:02Z' },
    parts: [{ type: 'data-notice', data: { type: 'news', title: 'Stopped' } }],
  };
  expect(
    chatMessageSegments([reply, card]).map((s) => [s.key, s.partIndexes]),
  ).toEqual([
    ['response', [0]],
    ['card', [0]],
    ['response:b', [1, 2]],
  ]);
});
