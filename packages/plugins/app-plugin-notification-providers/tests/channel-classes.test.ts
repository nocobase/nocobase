import { createNotificationRegistry } from '@nocobase/app-plugin-notification';
import { ServiceContainer } from '@nocobase/service-provider';
import { afterEach, expect, it, vi } from 'vitest';
import { registerBuiltInNotificationProviders } from '../server/bootstrap.js';

afterEach(() => vi.unstubAllGlobals());

it.each([
  [
    'feishu-webhook',
    'https://open.feishu.cn/open-apis/bot/v2/hook/test',
    { code: 0 },
  ],
  [
    'dingtalk-webhook',
    'https://oapi.dingtalk.com/robot/send?access_token=test',
    { errcode: 0 },
  ],
] as const)(
  'validates, prepares and sends through the %s class',
  async (type, webhookUrl, response) => {
    const fetch = vi.fn(async () => Response.json(response));
    vi.stubGlobal('fetch', fetch);
    const registry = createNotificationRegistry();
    registerBuiltInNotificationProviders(registry);
    const config = {
      channels: { alerts: { type, webhookUrl, secret: 'test-secret' } },
    };
    registry.validate(config);
    expect(registry.testTargets(config)[0]).toMatchObject({
      channel: { name: 'alerts', type: 'im' },
      provider: { type },
    });
    const runtime = await registry
      .channelType(type)!
      .create(
        { channelName: 'alerts', container: new ServiceContainer() },
        config.channels.alerts,
      );
    const validated = runtime.channel.validateMessage({
      title: 'Notice',
      text: 'Hello',
    });
    expect(validated.recipients).toEqual([{ webhook: true }]);
    const identity = {
      notificationId: 'notification',
      deliveryId: 'delivery',
      attemptId: 'attempt',
      signal: new AbortController().signal,
      deadline: new Date(Date.now() + 10000).toISOString(),
    };
    const message = await runtime.channel.prepare({
      ...identity,
      message: validated.message,
      recipient: validated.recipients[0],
      provider: { type },
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(await runtime.provider.send({ ...identity, message })).toEqual({
      status: 'accepted',
    });
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0]).toEqual([
      expect.stringContaining(webhookUrl),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-nocobase-delivery-id': 'delivery',
        }),
      }),
    ]);
  },
);

it('validates built-in class configuration before allocating transports', () => {
  const registry = createNotificationRegistry();
  registerBuiltInNotificationProviders(registry);
  for (const config of [
    { type: 'smtp', host: '', port: 25 },
    { type: 'resend', apiKey: '', from: 'test@example.com' },
    { type: 'feishu-webhook', webhookUrl: 'https://example.com' },
    { type: 'dingtalk-webhook', webhookUrl: 'https://example.com' },
  ])
    expect(() =>
      registry.validate({ channels: { invalid: config } }),
    ).toThrow();
});
