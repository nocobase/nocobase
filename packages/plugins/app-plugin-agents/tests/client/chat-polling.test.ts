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
