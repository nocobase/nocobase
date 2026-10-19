import { expect, it, vi } from 'vitest';
import {
  createWebPushService,
  pushTarget,
  type PreparedPush,
} from '../../server/service.js';

const input: PreparedPush = {
  device: { id: 'device', userId: 'alice' },
  message: {
    title: 'Review',
    body: 'Please review',
    url: '/main/tasks',
    dedupeKey: 'task:1',
    beforeSend: { name: 'policy', context: { task: '1' } },
  },
};
function fixture() {
  const row = { id: 'device', userId: 'alice', enabled: true };
  const remove = vi.fn();
  const transport = vi.fn(async () => 201);
  const service = createWebPushService({
    subscriptions: {
      get: async (owner) => (owner === 'alice' ? row : null),
      open: () => ({}),
      remove,
    } as never,
    notifications: () => null as never,
    transport,
    base: '/main',
  });
  return { row, remove, transport, service };
}
it('fails closed without a hook and rechecks current business permission and device state on every attempt', async () => {
  const f = fixture();
  const signal = new AbortController().signal;
  expect(await f.service.deliver(input, signal)).toMatchObject({
    status: 'failed',
    disposition: 'never',
  });
  const hook = vi.fn(async () => false as const);
  f.service.beforeSend('policy', hook);
  expect(await f.service.deliver(input, signal)).toEqual({
    status: 'accepted',
  });
  expect(hook).toHaveBeenCalledOnce();
  f.row.enabled = false;
  await f.service.deliver(input, signal);
  expect(hook).toHaveBeenCalledOnce();
  expect(f.transport).not.toHaveBeenCalled();
});
it.each([404, 410])(
  'sends generic fields without queue context and cleans up HTTP %s subscriptions',
  async (status) => {
    const f = fixture();
    f.service.beforeSend('policy', async () => ({ title: 'Localized title' }));
    f.transport.mockResolvedValue(status);
    expect(
      await f.service.deliver(input, new AbortController().signal),
    ).toMatchObject({ status: 'failed', disposition: 'never' });
    expect(f.transport).toHaveBeenCalledWith(
      {},
      {
        title: 'Localized title',
        body: 'Please review',
        url: '/main/tasks',
        dedupeKey: 'task:1',
      },
      expect.any(AbortSignal),
    );
    expect(f.remove).toHaveBeenCalledWith('alice', 'device');
  },
);
it('rejects external, traversal and sibling-base click destinations', () => {
  for (const url of [
    'https://evil.test/main/a',
    '//evil.test/main/a',
    '/main/../outside',
    '/main-other/',
  ])
    expect(() => pushTarget(url, '/main')).toThrow();
  expect(pushTarget('/main/tasks?a=1#details', '/main')).toBe(
    '/main/tasks?a=1#details',
  );
});

it.each(['fr-FR', 'zh-CN', 'de-DE-u-co-phonebk'])(
  'uses a supported test title or English fallback for %s',
  async (locale) => {
    const send = vi.fn(async () => ({}));
    const service = createWebPushService({
      subscriptions: { get: async () => ({ enabled: true, locale }) } as never,
      notifications: () => ({ send }) as never,
      transport: async () => 201,
      base: '/',
    });
    await service.test('alice', 'device');
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: {
          webPush: expect.objectContaining({
            title: locale === 'zh-CN' ? '测试通知' : 'Test notification',
          }),
        },
      }),
    );
  },
);
it('rejects hook-produced oversized payloads without transport or retries', async () => {
  const f = fixture();
  f.service.beforeSend('policy', async () => ({ body: '中'.repeat(1400) }));
  expect(
    await f.service.deliver(input, new AbortController().signal),
  ).toMatchObject({ status: 'failed', disposition: 'never' });
  expect(f.transport).not.toHaveBeenCalled();
});
