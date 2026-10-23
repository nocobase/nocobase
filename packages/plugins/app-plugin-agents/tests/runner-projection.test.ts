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
    row(1, '**Hello', block('delta')),
    row(2, 'Child', block('end', 'tool-1')),
    row(3, '**', block('delta')),
    row(4, ' ', block('delta')),
    row(5, 'world', block('end')),
    row(6, '**Independent**'),
    row(7, '', { notice: { code: 'news', type: 'fixture', title: 'Notice' } }),
    row(8, 'New run', block('end'), 'other'),
  ];
  const messages = runnerUIMessages([...rows, rows[2]]);
  const parts = messages.flatMap((m) => m.parts);
  expect(parts.filter((p) => p.type === 'text').map((p) => p.text)).toEqual([
    '**Hello** world',
    'Child',
    '**Independent**',
    'New run',
  ]);
  expect(parts.filter((p) => p.type === 'data-notice')).toHaveLength(1);
  expect(chatMessageSegments(messages).map((s) => s.seq)).toEqual([
    1, 2, 6, 7, 8,
  ]);
  expect(runnerUIMessages(JSON.parse(JSON.stringify(rows)))).toEqual(messages);
  const whitespace = runnerUIMessages([row(1, ' ', block('delta'))]);
  expect(chatMessageSegments(whitespace)).toHaveLength(1);
});
