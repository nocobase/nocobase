import { expect, it } from 'vitest';
import { StreamOutput } from '../../src/agent/adapters/stream-output.ts';
import type { AdapterEvent } from '../../src/agent/adapters/types.ts';

it('deduplicates raw snapshots and emits one explicit end even on repeated completion', () => {
  const events: Omit<AdapterEvent, 'at'>[] = [];
  const stream = new StreamOutput((e) => events.push(e));
  stream.delta('reply', 'text', '**Hel');
  stream.delta('reply', 'text', 'lo**');
  stream.complete('reply', 'text', '**Hello** world');
  stream.complete('reply', 'text', '**Hello** world');
  stream.end();
  expect(events.map((e) => e.content).join('')).toBe('**Hello** world');
  expect(
    events.filter((e) => (e.meta?.output as { phase: string }).phase === 'end'),
  ).toHaveLength(1);
  expect(
    new Set(events.map((e) => (e.meta?.output as { blockId: string }).blockId))
      .size,
  ).toBe(1);
});

it('preserves whitespace and independent ids, including repeated provider keys in a new message', () => {
  const events: Omit<AdapterEvent, 'at'>[] = [];
  const stream = new StreamOutput((e) => events.push(e));
  stream.delta('reply', 'text', ' ');
  stream.end();
  stream.reset();
  stream.complete('reply', 'text', 'next');
  expect(events.map((e) => e.content)).toEqual([
    ' ',
    undefined,
    'next',
    undefined,
  ]);
  expect(
    new Set(events.map((e) => (e.meta?.output as { blockId: string }).blockId))
      .size,
  ).toBe(2);
});

it('does not invent empty thinking when a model provides no summary', () => {
  const events: Omit<AdapterEvent, 'at'>[] = [];
  const stream = new StreamOutput((e) => events.push(e));
  stream.complete('summary', 'thinking', '');
  stream.end();
  expect(events).toEqual([]);
});
