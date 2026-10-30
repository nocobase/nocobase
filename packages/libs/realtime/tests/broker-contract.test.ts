import { expect, it, vi } from 'vitest';
import {
  createRealtimeService,
  type RealtimeBroker,
  type RealtimeBrokerCallbacks,
} from '../src/server/index.js';

it('keeps recovery and remote user/session controls transport-independent', async () => {
  let callbacks: RealtimeBrokerCallbacks | undefined;
  const shutdown = vi.fn(async () => {});
  const broker: RealtimeBroker = {
    setup: async (_receive, hooks) => {
      callbacks = hooks;
      hooks?.onStateChange('ready');
    },
    publish: async () => {},
    shutdown,
  };
  const service = createRealtimeService({ namespace: 'shared', broker });
  const topic = service.defineTopic('test:contract', { audience: 'user' });
  const first = { readyState: 1, send: vi.fn(), close: vi.fn() };
  const second = { readyState: 1, send: vi.fn(), close: vi.fn() };
  await service.subscribe(
    service.connect(first, { principal: { userId: 'a', sessionId: 'one' } }),
    topic.name,
  );
  await service.subscribe(
    service.connect(second, { principal: { userId: 'a', sessionId: 'two' } }),
    topic.name,
  );
  callbacks?.onStateChange('recovering');
  expect(service.diagnostics().brokerState).toBe('recovering');
  callbacks?.onStateChange('ready');
  callbacks?.onRecovery();
  expect(first.send).toHaveBeenCalledWith(JSON.stringify({ type: 'resync' }));
  callbacks?.onControl({
    namespace: 'other',
    origin: 'remote',
    kind: 'disconnect-user',
    subjectId: 'a',
  });
  expect(first.close).not.toHaveBeenCalled();
  callbacks?.onControl({
    namespace: 'shared',
    origin: 'remote',
    kind: 'disconnect-session',
    subjectId: 'one',
  });
  expect(first.close).toHaveBeenCalledOnce();
  expect(second.close).not.toHaveBeenCalled();
  callbacks?.onControl({
    namespace: 'shared',
    origin: 'remote',
    kind: 'disconnect-user',
    subjectId: 'a',
  });
  expect(second.close).toHaveBeenCalledOnce();
  await service.close();
  expect(shutdown).toHaveBeenCalledOnce();
});
