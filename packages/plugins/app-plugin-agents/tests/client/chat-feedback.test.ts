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
  expect(chatFeedback({ ...base, stream: { status: 'streaming' } })).toBe(
    'thinking',
  );
  expect(chatFeedback({ ...base, hasOutput: true })).toBeNull();
  expect(chatFeedback({ ...base, stopping: true, hasOutput: true })).toBe(
    'stopping',
  );
  expect(
    chatFeedback({
      ...base,
      stream: { status: 'error', error: new Error('Disconnected') },
    }),
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
it.each([undefined, 'submitted', 'streaming', 'ready'] as const)(
  'shows thinking for occupied OnlineAgent execution with SDK status %s before any body',
  (status) => {
    const input = {
      execution: { status: 'running' as const },
      running: true,
      stopping: false,
      hasOutput: false,
      ...(status ? { stream: { status } } : {}),
    };
    expect(chatFeedback(input)).toBe('thinking');
    expect(chatFeedback({ ...input, hasOutput: true })).toBeNull();
    expect(chatFeedback({ ...input, stopping: true })).toBe('stopping');
    expect(chatFeedback({ ...input, submission: { status: 'sending' } })).toBe(
      'sending',
    );
    expect(chatFeedback({ ...input, submission: { status: 'unknown' } })).toBe(
      'unknown',
    );
    expect(
      chatFeedback({
        ...input,
        stream: { status: 'error', error: new Error('Disconnected') },
      }),
    ).toBe('unknown');
  },
);

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
  'uses only trusted saved execution for Runner %s after SDK finish',
  (outcome) => {
    expect(
      chatFeedback({
        running: false,
        stopping: false,
        hasOutput: true,
        execution: { status: 'idle', outcome },
        lastSeq: 2,
        stream: { status: 'ready' },
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
      stream: { status: 'ready' },
    }),
  ).toBeNull();
});

it('does not treat SDK finish or missing transport as business success', () => {
  for (const status of ['ready', 'submitted'] as const)
    expect(
      chatFeedback({
        running: false,
        stopping: false,
        hasOutput: true,
        stream: { status },
      }),
    ).toBeNull();
  expect(
    chatFeedback({
      running: true,
      stopping: false,
      hasOutput: false,
      execution: { status: 'running', waitingApproval: true },
      stream: { status: 'ready' },
    }),
  ).toBe('thinking');
});
