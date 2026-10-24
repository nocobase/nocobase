import { expect, it } from 'vitest';
import {
  createRedactor,
  REDACTED,
  type RunEvent,
} from '@nocobase/agent-protocol';
import { OutputPreview } from '../server/core/runs/output-preview.js';
it('redacts server-only secrets across every split before delivering a preview', () => {
  const secret = 'server-only credential with spaces 123456';
  for (let cut = 1; cut < secret.length; cut++) {
    const preview = new OutputPreview();
    let redactor = createRedactor();
    const events: RunEvent[] = [];
    // Register a credential after creating the preview service, before its output is consumed.
    redactor = redactor.with([secret]);
    const event = (seq: number, content: string): RunEvent => ({
      seq,
      at: '2026-10-24T00:00:00Z',
      type: 'text',
      content,
      meta: { output: { blockId: 'block', phase: 'delta' } },
    });
    preview.accept(
      'run',
      [event(1, 'before ' + secret.slice(0, cut))],
      () => redactor,
      (e) => events.push(e),
    );
    preview.accept(
      'run',
      [event(2, secret.slice(cut) + ' after。')],
      () => redactor,
      (e) => events.push(e),
    );
    expect(events.map((e) => e.content).join('')).toBe(
      `before ${REDACTED} after。`,
    );
    preview.accept(
      'run',
      [event(2, secret.slice(cut))],
      () => redactor,
      (e) => events.push(e),
    );
    expect(events.map((e) => e.content).join('')).toBe(
      `before ${REDACTED} after。`,
    );
  }
});
it('closes an interrupted block and never accepts a later suffix for it', () => {
  const preview = new OutputPreview();
  const redactor = createRedactor(['secret-value-123456']);
  const events: RunEvent[] = [];
  const base = {
    seq: 1,
    at: '2026-10-24T00:00:00Z',
    type: 'thinking' as const,
  };
  preview.accept(
    'run',
    [
      {
        ...base,
        content: 'secret-val',
        meta: { output: { blockId: 'block', phase: 'delta' } },
      },
    ],
    () => redactor,
    (e) => events.push(e),
  );
  preview.accept(
    'run',
    [{ ...base, seq: 2, meta: { output: { blockId: 'block', phase: 'end' } } }],
    () => redactor,
    (e) => events.push(e),
  );
  preview.accept(
    'run',
    [
      {
        ...base,
        seq: 3,
        content: 'late',
        meta: { output: { blockId: 'block', phase: 'delta' } },
      },
    ],
    () => redactor,
    (e) => events.push(e),
  );
  expect(events.map((e) => e.content).join('')).toBe(REDACTED);
  expect(events.at(-1)?.meta?.output).toMatchObject({ phase: 'end' });
});

it('ignores a preview overtaken by its canonical snapshot, including a lost first segment', () => {
  const preview = new OutputPreview();
  const redactor = createRedactor();
  const events: RunEvent[] = [];
  const base = { seq: 1, at: '2026-10-24T00:00:00Z', type: 'text' as const };
  preview.accept(
    'run',
    [
      {
        ...base,
        content: 'Complete',
        meta: { output: { blockId: 'block', phase: 'end' } },
      },
    ],
    () => redactor,
    (e) => events.push(e),
  );
  preview.accept(
    'run',
    [
      {
        ...base,
        content: 'Late first fragment',
        meta: { output: { blockId: 'block', phase: 'delta' } },
      },
    ],
    () => redactor,
    (e) => events.push(e),
  );
  expect(events).toHaveLength(0);
});

it('stops previewing after a sequence gap rather than consuming a credential suffix without context', () => {
  const preview = new OutputPreview();
  const redactor = createRedactor(['secret-value-123456']);
  const events: RunEvent[] = [];
  const event = (seq: number, content: string): RunEvent => ({
    seq,
    at: '2026-10-24T00:00:00Z',
    type: 'text',
    content,
    meta: { output: { blockId: 'block', phase: 'delta' } },
  });
  preview.accept(
    'run',
    [event(1, 'before secret-')],
    () => redactor,
    (e) => events.push(e),
  );
  preview.accept(
    'run',
    [event(3, '123456 after')],
    () => redactor,
    (e) => events.push(e),
  );
  preview.accept(
    'run',
    [event(4, 'later')],
    () => redactor,
    (e) => events.push(e),
  );
  expect(events.map((e) => e.content).join('')).toBe('before ');
});
