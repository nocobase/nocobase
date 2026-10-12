import { expect, it, vi } from 'vitest';
import { createLogger } from '@nocobase/logging';
import {
  SendingManager,
  SendingRegistry,
  boundedSubmission,
  registerBuiltInSendingProviders,
} from '../src/index.js';

it('shares one transport across concurrent consumers and closes it once', async () => {
  const registry = new SendingRegistry();
  registerBuiltInSendingProviders(registry);
  const close = vi.fn(() => Promise.resolve());
  const send = vi.fn(() => Promise.resolve({ status: 'accepted' as const }));
  const create = vi.fn(() =>
    Promise.resolve({ type: 'test-email', send, close }),
  );
  registry.registerProvider({
    type: 'test-email',
    messageType: 'email',
    createProvider: create,
  });
  const manager = new SendingManager({
    registry,
    logger: createLogger({ level: 'silent' }),
    config: { channels: { system: { provider: 'test-email' } } },
  });
  const [first, second] = await Promise.all([
    manager.runtime('system'),
    manager.runtime('system'),
  ]);
  expect(first).toBe(second);
  expect(create).toHaveBeenCalledTimes(1);
  const result = await manager.send({
    channel: 'system',
    message: {
      to: ['one@example.test', 'two@example.test'],
      subject: 'Hello',
      text: 'Test',
    },
    deliveryId: 'stable',
  });
  expect(result).toEqual([{ status: 'accepted' }, { status: 'accepted' }]);
  expect(send.mock.calls).toHaveLength(2);
  await manager.close();
  expect(close).toHaveBeenCalledTimes(1);
  expect(manager.available('system')).toBe(false);
});

it('bounds a stalled submission and discards a late result without retrying', async () => {
  let finish: ((result: { status: 'accepted' }) => void) | undefined;
  let signal: AbortSignal | undefined;
  const result = await boundedSubmission((incoming) => {
    signal = incoming;
    return new Promise((resolve) => {
      finish = resolve;
    });
  }, Date.now() + 10);
  expect(result).toMatchObject({
    status: 'submission_unknown',
    error: { code: 'SEND_TIMEOUT' },
  });
  expect(signal?.aborted).toBe(true);
  finish?.({ status: 'accepted' });
});

it('does not connect during capability checks and keeps explicit disables closed', () => {
  const manager = new SendingManager({
    logger: createLogger({ level: 'silent' }),
    config: {
      channels: {
        off: { provider: 'smtp', enabled: false },
        on: { provider: 'smtp' },
        im: { provider: 'feishu-webhook' },
      },
    },
  });
  expect(manager.available('off', 'email')).toBe(false);
  expect(manager.available('on', 'email')).toBe(true);
  expect(manager.available('im', 'email')).toBe(false);
});
