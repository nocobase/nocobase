// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { sdkController } from './sdk-controller.js';
import { agentsQueryClient } from '../../client/query.js';
import { chatKeys } from '../../client/chat/keys.js';
afterEach(() => {
  vi.useRealTimers();
  agentsQueryClient().clear();
});
it('shares one durable poll between surfaces and removes it when the last surface unmounts', async () => {
  vi.useFakeTimers();
  const f = sdkController();
  f.state.detail = { ...f.state.detail, execution: { status: 'idle' } };
  f.output(); // Keep the running execution's stream open; only durable poll reads are counted.
  const detailReads = () =>
    f.request.mock.calls.filter(
      ([request]) => request.path === 'agents/conversations/c1',
    );
  agentsQueryClient().setQueryData(chatKeys.conversation('c1'), {
    ...f.state.detail,
    execution: { status: 'idle' },
  });
  const first = f.controller.watch('c1'),
    second = f.controller.watch('c1');
  await vi.advanceTimersByTimeAsync(25000);
  expect(f.request).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(5000);
  expect(detailReads()).toHaveLength(1);
  first();
  f.state.detail = { ...f.state.detail, execution: { status: 'running' } };
  agentsQueryClient().setQueryData(chatKeys.conversation('c1'), f.state.detail);
  await vi.advanceTimersByTimeAsync(5000);
  expect(detailReads()).toHaveLength(2);
  second();
  await vi.advanceTimersByTimeAsync(30000);
  expect(detailReads()).toHaveLength(2);
  f.controller.dispose();
});

it('uses one snapshot and one revision read per idle poll without losing missed messages', async () => {
  vi.useFakeTimers();
  const f = sdkController();
  f.state.detail = {
    ...f.state.detail,
    execution: { status: 'idle' },
    lastSeq: 1,
  };
  f.state.messages = [
    {
      id: 'answer',
      role: 'assistant',
      metadata: {
        seq: 1,
        revision: 1,
        conversationId: 'c1',
        createdAt: '2026-10-30T00:00:00Z',
      },
      parts: [{ type: 'text', text: 'Initial' }],
    },
  ];
  await f.controller.refresh('c1');
  f.request.mockClear();
  const stop = f.controller.watch('c1');
  try {
    await vi.advanceTimersByTimeAsync(120000);
    expect(f.request).toHaveBeenCalledTimes(8);
    expect(
      f.request.mock.calls.filter(
        ([r]) => r.path === 'agents/conversations/c1',
      ),
    ).toHaveLength(4);
    expect(
      f.request.mock.calls.filter(([r]) => r.query?.ids === 'answer'),
    ).toHaveLength(4);
    // Same-cursor edits still arrive through the revision fallback.
    f.state.messages = [
      {
        ...f.state.messages[0]!,
        metadata: { ...f.state.messages[0]!.metadata!, revision: 2 },
        parts: [{ type: 'text', text: 'Edited' }],
      },
    ];
    await vi.advanceTimersByTimeAsync(30000);
    expect(f.controller.chat('c1').messages[0]?.parts).toEqual([
      { type: 'text', text: 'Edited' },
    ]);
    f.state.detail = { ...f.state.detail, lastSeq: 2 };
    f.state.messages.push({
      id: 'new',
      role: 'assistant',
      metadata: { ...f.state.messages[0]!.metadata!, seq: 2 },
      parts: [{ type: 'text', text: 'Missed announcement' }],
    });
    await vi.advanceTimersByTimeAsync(30000);
    expect(f.controller.chat('c1').messages.map((m) => m.id)).toContain('new');
    expect(f.controller.history('c1').loadedThrough).toBe(2);
  } finally {
    stop();
    f.controller.dispose();
  }
});
