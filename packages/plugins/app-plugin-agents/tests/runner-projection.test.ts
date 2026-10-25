import { expect, it } from 'vitest';
import { runnerUIMessages } from '../server/online/agent/runner/projection.js';
import { chatMessageSegments } from '../client/chat/message-model.js';
import type { ConversationMessage } from '../shared/conversations.js';

const row = (
  seq: number,
  content: string,
  metadata: ConversationMessage['metadata'] = {},
  runId = 'run',
): ConversationMessage => ({
  id: `r${seq}`,
  conversationId: 'conversation',
  seq,
  role: 'assistant',
  content: { type: 'text', content },
  toolCalls: null,
  attachments: null,
  workContext: null,
  metadata,
  runId,
  createdAt: '2026-01-01T00:00:00Z',
});
it('preserves explicit blocks, whitespace, notices and independent parent/child and run boundaries', () => {
  const block = (phase: 'delta' | 'end', parentToolUseId?: string) => ({
    output: { blockId: 'same', phase },
    ...(parentToolUseId ? { parentToolUseId } : {}),
  });
  const rows = [
    row(1, '**Hello** world', block('end')),
    row(2, 'Child', {
      ...block('end', 'tool-1'),
      output: { blockId: 'child', phase: 'end' },
    }),
    row(3, '**Independent**'),
    row(4, '', { notice: { code: 'news', type: 'fixture', title: 'Notice' } }),
    row(5, 'New run', block('end'), 'other'),
  ];
  const messages = runnerUIMessages([...rows, rows[0]]);
  const parts = messages.flatMap((m) => m.parts);
  expect(parts.filter((p) => p.type === 'text').map((p) => p.text)).toEqual([
    '**Hello** world',
    'Child',
    '**Independent**',
    'New run',
  ]);
  expect(parts.filter((p) => p.type === 'data-notice')).toHaveLength(1);
  const segments = chatMessageSegments(messages);
  expect(
    segments.map(({ message, seq, partIndexes }) => ({
      id: message.id,
      seq,
      partIndexes,
    })),
  ).toEqual([
    { id: 'runner:run', seq: 1, partIndexes: [0, 1, 2, 3] },
    { id: 'runner:other', seq: 5, partIndexes: [0] },
  ]);
  expect(segments[0].message).toBe(messages[0]);
  expect(
    segments[0].message.metadata?.sourceRecords?.map(
      ({ recordId, partIndex, output }) => ({ recordId, partIndex, output }),
    ),
  ).toEqual([
    { recordId: 'r1', partIndex: 0, output: { blockId: 'same', phase: 'end' } },
    {
      recordId: 'r2',
      partIndex: 1,
      output: { blockId: 'child', phase: 'end' },
    },
    { recordId: 'r3', partIndex: 2, output: undefined },
    { recordId: 'r4', partIndex: 3, output: undefined },
  ]);
  expect(
    segments[0].partIndexes.map((index) => segments[0].message.parts[index]),
  ).toEqual(messages[0].parts);
  expect(runnerUIMessages(JSON.parse(JSON.stringify(rows)))).toEqual(messages);
  const whitespace = runnerUIMessages([row(1, ' ', block('delta'))]);
  expect(chatMessageSegments(whitespace)).toHaveLength(1);
});

it('interleaves saved negotiated reasoning with canonical text without changing conversation cursors', () => {
  const rows = [
    row(2, 'First answer', {
      runEventSeq: 2,
      output: { blockId: 'body-one', phase: 'end' },
    }),
    row(3, 'Second answer', {
      runEventSeq: 5,
      output: { blockId: 'body-two', phase: 'end' },
    }),
    row(4, 'Other run', { runEventSeq: 2 }, 'other'),
  ];
  const thought = (
    runId: string,
    seq: number,
    blockId: string,
    content: string,
  ) => ({
    runId,
    seq,
    at: '2026-01-01T00:00:00Z',
    content,
    meta: { output: { blockId, phase: 'end' } },
  });
  const original = structuredClone(rows);
  const messages = runnerUIMessages(rows, [
    thought('run', 1, 'thought-one', 'First summary'),
    thought('run', 3, 'thought-two', 'Second summary'),
    thought('run', 3, 'thought-two', 'Duplicate summary'),
    thought('unrelated', 1, 'private', 'Other conversation summary'),
    { ...thought('run', 4, 'legacy', 'Legacy thought'), meta: {} },
  ]);
  expect(
    messages[0].parts.map((part) =>
      part.type === 'text' || part.type === 'reasoning' ? part.text : '',
    ),
  ).toEqual([
    'First summary',
    'First answer',
    'Second summary',
    'Second answer',
  ]);
  expect(messages[1].parts).toEqual([
    { type: 'text', text: 'Other run', state: 'done' },
  ]);
  expect(messages[0].metadata?.revision).toBe(3);
  const segments = chatMessageSegments(messages);
  expect(
    segments.map(({ message, seq, partIndexes }) => ({
      id: message.id,
      seq,
      partIndexes,
    })),
  ).toEqual([
    { id: 'runner:run', seq: 2, partIndexes: [0, 1, 2, 3] },
    { id: 'runner:other', seq: 4, partIndexes: [0] },
  ]);
  expect(segments[0].message).toBe(messages[0]);
  expect(
    segments[0].partIndexes.map((index) => messages[0].parts[index]),
  ).toEqual(messages[0].parts);
  expect(
    messages[0].metadata?.sourceRecords?.map((source) => source.partId),
  ).toEqual([
    'output:thought-one',
    'output:body-one',
    'output:thought-two',
    'output:body-two',
  ]);
  expect(rows).toEqual(original);
});
