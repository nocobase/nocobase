import { afterEach, expect, it, vi } from 'vitest';

import { StreamOutput } from '../../src/agent/adapters/stream-output.ts';
import type { AdapterEvent } from '../../src/agent/adapters/types.ts';

afterEach(() => vi.useRealTimers());

it('reports progress once a second without waiting for completion', async () => {
  vi.useFakeTimers();
  const events: Omit<AdapterEvent, 'at'>[] = [];
  const stream = new StreamOutput((event) => events.push(event));
  for (let second = 0; second < 3; second++) {
    for (let token = 0; token < 100; token++)
      stream.delta('reply', 'text', 'x');
    expect(events).toHaveLength(second);
    await vi.advanceTimersByTimeAsync(1000);
  }
  stream.complete('reply', 'text', 'x'.repeat(300));
  expect(events.map((event) => event.content)).toEqual(
    Array(3).fill('x'.repeat(100)),
  );
  expect(vi.getTimerCount()).toBe(0);
});

it('preserves thinking, reply, child and tool order and supplies a missing suffix', () => {
  const events: Omit<AdapterEvent, 'at'>[] = [];
  const stream = new StreamOutput((event) => events.push(event));
  stream.delta('thinking', 'thinking', 'Plan');
  stream.delta('reply', 'text', 'Hello');
  stream.delta('child', 'text', 'Child', { parentToolUseId: 'tool' });
  stream.flush();
  events.push({ type: 'toolUse', tool: 'shell' });
  stream.complete('reply', 'text', 'Hello world');
  expect(events.map((event) => [event.type, event.content])).toEqual([
    ['thinking', 'Plan'],
    ['text', 'Hello'],
    ['text', 'Child'],
    ['toolUse', undefined],
    ['text', ' world'],
  ]);
  expect(events[2]?.meta).toEqual({ parentToolUseId: 'tool' });
});

it('flushes a large chunk early and releases a final pending chunk', () => {
  vi.useFakeTimers();
  const emit = vi.fn();
  const stream = new StreamOutput(emit);
  stream.delta('reply', 'text', 'x'.repeat(4096));
  expect(emit).toHaveBeenCalledTimes(1);
  stream.delta('reply', 'text', 'tail');
  stream.flush();
  expect(emit).toHaveBeenLastCalledWith({ type: 'text', content: 'tail' });
  expect(vi.getTimerCount()).toBe(0);
});

it('accepts completed-only output and emits nothing for absent summaries', () => {
  const emit = vi.fn();
  const stream = new StreamOutput(emit);
  stream.complete('summary', 'thinking', '');
  stream.complete('reply', 'text', 'Hello');
  expect(emit).toHaveBeenCalledExactlyOnceWith({
    type: 'text',
    content: 'Hello',
  });
});
