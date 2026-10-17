import { expect, it } from 'vitest';
import {
  chatFeedback,
  chatIsRunning,
  chatNearBottom,
} from '../../client/chat/feedback.js';
import type { ConversationSummary } from '../../shared/conversations.js';

it('closes waiting after first body for Native and Runner and reports safe terminal keys', () => {
  const base = {
    running: true,
    stopping: false,

    hasOutput: false,
  };
  expect(chatFeedback(base)).toBe('waiting');
  expect(
    chatFeedback({ ...base, stream: { phase: 'streaming', items: [] } }),
  ).toBe('thinking');
  expect(chatFeedback({ ...base, hasOutput: true })).toBeNull();
  expect(chatFeedback({ ...base, stopping: true, hasOutput: true })).toBe(
    'stopping',
  );
  expect(
    chatFeedback({ ...base, stream: { phase: 'interrupted', items: [] } }),
  ).toBe('unknown');
  for (const outcome of ['completed', 'cancelled', 'failed'] as const) {
    expect(
      chatFeedback({
        ...base,
        running: false,
        execution: { status: 'idle', outcome },
      }),
    ).toBe(outcome);
  }
  expect(
    chatFeedback({
      ...base,
      running: false,
      execution: { status: 'idle', requiresEffectReview: true },
    }),
  ).toBe('effectReview');
  expect(
    chatFeedback({
      ...base,
      submission: { status: 'sending' },
    }),
  ).toBe('sending');
});
it('uses execution occupancy before legacy run and follows only near the bottom', () => {
  const run = { id: 'r' } as ConversationSummary['run'];
  expect(chatIsRunning({ execution: { status: 'running' }, run: null })).toBe(
    true,
  );
  expect(chatIsRunning({ execution: { status: 'idle' }, run })).toBe(false);
  expect(chatIsRunning({ run })).toBe(true);
  expect(
    chatNearBottom({ scrollHeight: 1000, clientHeight: 400, scrollTop: 550 }),
  ).toBe(true);
  expect(
    chatNearBottom({ scrollHeight: 1000, clientHeight: 400, scrollTop: 300 }),
  ).toBe(false);
});

it('releases an uncertain old input without masking the next turn or resending it', () => {
  const base = { running: true, stopping: false, hasOutput: false };
  expect(chatFeedback({ ...base, submission: { status: 'unknown' } })).toBe(
    'unknown',
  );
  expect(
    chatFeedback({
      ...base,
      submission: { status: 'unknown', released: true },
    }),
  ).toBe('waiting');
  expect(chatFeedback({ ...base, submission: { status: 'confirmed' } })).toBe(
    'waiting',
  );
  expect(
    chatFeedback({ ...base, submission: { status: 'notSubmitted' } }),
  ).toBe('failed');
});

it.each(['completed', 'cancelled', 'failed'] as const)(
  'uses the existing saved event for Runner %s without manufacturing a server outcome',
  (outcome) => {
    expect(
      chatFeedback({
        running: false,
        stopping: false,
        hasOutput: true,
        execution: { status: 'idle' },
        lastSeq: 2,
        stream: { phase: 'saved', items: [], lastSeq: 2, outcome },
      }),
    ).toBe(outcome);
  },
);

it('never applies a previous saved outcome to a newer canonical turn', () => {
  expect(
    chatFeedback({
      running: false,
      stopping: false,
      hasOutput: true,
      lastSeq: 4,
      stream: { phase: 'saved', items: [], lastSeq: 2, outcome: 'cancelled' },
    }),
  ).toBeNull();
});
