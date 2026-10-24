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
  expect(
    events
      .filter((e) => (e.meta?.output as { phase: string }).phase === 'delta')
      .map((e) => e.content)
      .join(''),
  ).toBe('**Hello** world');
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
  expect(
    events.map((e) =>
      e.meta?.output && (e.meta.output as { phase: string }).phase === 'end'
        ? undefined
        : e.content,
    ),
  ).toEqual([' ', undefined, 'next', undefined]);
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

it('saves an acknowledged partial block once, bounded in UTF-8 bytes, and releases its buffer', () => {
  const events: Omit<AdapterEvent, 'at'>[] = [];
  const stream = new StreamOutput((e) => events.push(e));
  for (let i = 0; i < 65; i++)
    stream.delta(String(i), 'text', '界'.repeat(30_000));
  stream.end(true);
  stream.end(true);
  const ends = events.filter(
    (e) => (e.meta?.output as { phase?: string })?.phase === 'end',
  );
  expect(ends).toHaveLength(65);
  expect(ends.filter((e) => e.content !== undefined)).toHaveLength(64);
  for (const end of ends.slice(0, 64)) {
    expect(Buffer.byteLength(end.content!, 'utf8')).toBe(65_535);
    expect(end.content).not.toContain('\ufffd');
    expect(end.meta?.truncated).toBe(true);
  }
  stream.delta('next', 'text', 'Next response');
  stream.end(true);
  expect(events.at(-1)?.content).toBe('Next response');
});

it('does not persist an unacknowledged interruption or duplicate a completed snapshot', () => {
  const events: Omit<AdapterEvent, 'at'>[] = [];
  const stream = new StreamOutput((e) => events.push(e));
  stream.delta('failed', 'text', 'Not confirmed');
  stream.end();
  stream.complete('done', 'text', 'Complete');
  stream.end(true);
  const ends = events.filter(
    (e) => (e.meta?.output as { phase?: string })?.phase === 'end',
  );
  expect(ends.map((e) => e.content)).toEqual([undefined, 'Complete']);
  expect(ends[1]?.meta?.truncated).toBeUndefined();
});
