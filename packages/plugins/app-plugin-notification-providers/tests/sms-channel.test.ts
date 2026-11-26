import { createNotificationRegistry } from '@nocobase/app-plugin-notification';
import { ServiceContainer } from '@nocobase/service-provider';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { registerBuiltInNotificationProviders } from '../server/bootstrap.js';
import NotificationProvidersProvider from '../server/provider.js';
import {
  SmsChannel,
  SmsProviderRegistry,
  createSmsProviderRegistry,
  smsProviderRegistryToken,
  userPhoneDirectoryToken,
  type SmsChannelConfig,
  type SmsProvider,
} from '../server/sms/index.js';

afterEach(() => vi.unstubAllGlobals());

const aliyun: SmsChannelConfig = {
  type: 'sms',
  service: 'aliyun',
  signName: 'Example',
  aliyun: { accessKeyId: 'LTAIexample', accessKeySecret: 'aliyun-secret' },
  templates: {
    code: { templateId: 'SMS_1', params: { code: 'code' } },
    notification: {
      templateId: 'SMS_2',
      params: { title: 'title', body: 'body' },
    },
  },
};

const identity = {
  notificationId: 'notification-1',
  deliveryId: 'delivery-1',
  attemptId: 'attempt-1',
  deadline: new Date(Date.now() + 10_000).toISOString(),
  signal: new AbortController().signal,
};

function channel(
  config: SmsChannelConfig = aliyun,
  container = new ServiceContainer(),
) {
  return new SmsChannel({ channelName: 'sms', container }, config);
}

async function deliver(
  instance: SmsChannel,
  message: unknown,
): Promise<ReturnType<SmsChannel['send']>> {
  const validated = instance.validateMessage(message);
  const prepared = await instance.prepare({
    ...identity,
    message: validated.message,
    recipient: validated.recipients[0]!,
  });
  return instance.send({ ...identity, message: prepared });
}

describe('SMS channel configuration', () => {
  it('registers the channel type with the built-in providers', () => {
    const registry = createNotificationRegistry();
    registerBuiltInNotificationProviders(registry);
    expect(registry.channelType('sms')?.type).toBe('sms');
    expect(() =>
      registry.validate({ channels: { sms: aliyun } }),
    ).not.toThrow();
  });

  it.each([
    [{ ...aliyun, service: '' }, /service is required/],
    [{ ...aliyun, service: 'templates' }, /not valid/],
    [{ ...aliyun, signName: ' ' }, /signName is required/],
    [{ ...aliyun, templates: {} }, /at least one template/],
    [
      { ...aliyun, templates: { code: { templateId: '' } } },
      /needs a templateId/,
    ],
    [
      { ...aliyun, templates: { code: { templateId: 'x', params: { a: 1 } } } },
      /params must map/,
    ],
    [
      { ...aliyun, aliyun: { accessKeyId: 'a' } },
      /accessKeySecret is required/,
    ],
    [
      { ...aliyun, aliyun: { ...aliyun.aliyun, endpoint: 'evil.example.com' } },
      /not allowed/,
    ],
    [
      {
        ...aliyun,
        service: 'tencent',
        tencent: { secretId: 'a', secretKey: 'b' },
      },
      /tencent.sdkAppId is required/,
    ],
  ] as const)('rejects an invalid configuration: %#', (config, message) => {
    expect(() => SmsChannel.validateConfig(config as never)).toThrow(message);
  });

  it('leaves a service it does not know to the registry at construction', () => {
    const custom = { ...aliyun, service: 'acme' } as SmsChannelConfig;
    expect(() => SmsChannel.validateConfig(custom)).not.toThrow();
    expect(() => channel(custom)).toThrow(/"acme" is not registered/);
  });

  it('summarizes the service, signature and templates without any secret', () => {
    const summary = JSON.stringify([
      SmsChannel.summarize(aliyun),
      SmsChannel.summarize({
        ...aliyun,
        service: 'tencent',
        tencent: {
          secretId: 'AKIDsecretid',
          secretKey: 'tencent-secret',
          sdkAppId: '1400000001',
        },
      } as SmsChannelConfig),
    ]);
    expect(summary).toContain('Example');
    expect(summary).toContain('1400000001');
    expect(summary).toContain('code, notification');
    expect(summary).not.toMatch(
      /LTAIexample|aliyun-secret|AKIDsecretid|tencent-secret/u,
    );
  });
});

describe('SMS messages', () => {
  it.each([
    [{ to: '13800138000', template: 'code' }, /E\.164/],
    [{ to: [], template: 'code' }, /E\.164/],
    [
      { to: '+8613800138000', template: 'missing' },
      /"missing" is not configured/,
    ],
    [{ to: '+8613800138000' }, /template is required/],
    [{ to: '+8613800138000', template: 'code', params: { code: 1 } }, /string/],
    [{ to: '+8613800138000', template: 'code', body: 'x' }, /Unsupported/],
  ])('rejects an invalid message: %#', (message, error) => {
    expect(() => channel().validateMessage(message)).toThrow(error);
  });

  it('gives each distinct number its own recipient', () => {
    expect(
      channel().validateMessage({
        to: ['+8613800138000', '+8613900139000', '+8613800138000'],
        template: 'code',
        params: { code: '1' },
      }).recipients,
    ).toEqual([{ phone: '+8613800138000' }, { phone: '+8613900139000' }]);
  });

  it('does not take a template name from the prototype chain', () => {
    expect(() =>
      channel().validateMessage({
        to: '+8613800138000',
        template: 'constructor',
      }),
    ).toThrow(/not configured/);
  });

  it('maps message variables to the provider variable names when it sends', async () => {
    const fetch = vi.fn(async () => Response.json({ Code: 'OK', BizId: 'b1' }));
    vi.stubGlobal('fetch', fetch);
    const result = await deliver(channel(), {
      to: '+8613800138000',
      template: 'code',
      params: { code: '246810' },
    });
    expect(result).toEqual({ status: 'accepted', providerMessageId: 'b1' });
    const body = new URLSearchParams(String(fetch.mock.calls[0]![1]!.body));
    expect(body.get('TemplateCode')).toBe('SMS_1');
    expect(body.get('TemplateParam')).toBe('{"code":"246810"}');
  });

  it('reports a message variable the template needs and the message lacks', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const result = await deliver(channel(), {
      to: '+8613800138000',
      template: 'code',
      params: { other: '1' },
    });
    expect(result).toMatchObject({
      status: 'failed',
      disposition: 'never',
      error: { code: 'SMS_PARAMS_INVALID', category: 'content' },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [
      'isv.SMS_SIGNATURE_ILLEGAL',
      'SMS_SIGNATURE_INVALID',
      'configuration',
      'failed',
    ],
    [
      'isv.SMS_TEMPLATE_ILLEGAL',
      'SMS_TEMPLATE_INVALID',
      'configuration',
      'failed',
    ],
    ['isv.BUSINESS_LIMIT_CONTROL', 'SMS_RATE_LIMITED', 'rate_limit', 'failed'],
    ['isv.AMOUNT_NOT_ENOUGH', 'SMS_INSUFFICIENT_BALANCE', 'provider', 'failed'],
    ['SignatureDoesNotMatch', 'SMS_AUTH_FAILED', 'authentication', 'failed'],
    [
      'isp.SYSTEM_ERROR',
      'SMS_PROVIDER_UNAVAILABLE',
      'provider',
      'submission_unknown',
    ],
  ])(
    'turns the provider code %s into %s with a readable message',
    async (providerCode, code, category, status) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () =>
          Response.json({ Code: providerCode, RequestId: 'req-7' }),
        ),
      );
      const result = await deliver(channel(), {
        to: '+8613800138000',
        template: 'code',
        params: { code: '246810' },
      });
      expect(result).toMatchObject({
        status,
        error: { code, category },
      });
      const message = (result as { error: { message: string } }).error.message;
      expect(message).toContain(providerCode);
      expect(message).toContain('req-7');
      expect(message.length).toBeGreaterThan(40);
      expect(JSON.stringify(result)).not.toContain('246810');
      if (code === 'SMS_RATE_LIMITED')
        expect(result).toMatchObject({ disposition: 'same_provider' });
    },
  );

  it('does not claim a failure when the request was aborted', async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        controller.abort();
        throw new DOMException('aborted', 'AbortError');
      }),
    );
    const instance = channel();
    const prepared = await instance.prepare({
      ...identity,
      message: {
        to: '+8613800138000',
        template: 'code',
        params: { code: '1' },
      },
      recipient: { phone: '+8613800138000' },
    });
    const result = await instance.send({
      ...identity,
      signal: controller.signal,
      message: prepared,
    });
    expect(result.status).toBe('submission_unknown');
  });
});

describe('SMS notifications', () => {
  const content = {
    kind: 'approval.requested',
    category: 'approvals',
    title: 'Approve budget',
    body: 'Alice asks for approval.',
    key: 'request-1',
  };

  function containerWith(phones: Record<string, string>) {
    const container = new ServiceContainer();
    container.instance(userPhoneDirectoryToken, {
      find: vi.fn(
        async (userIds: readonly string[]) =>
          new Map(
            userIds.flatMap((id) => (phones[id] ? [[id, phones[id]!]] : [])),
          ),
      ),
    });
    return container;
  }

  it('resolves users to their verified numbers and skips those without one', async () => {
    const found = await channel(
      aliyun,
      containerWith({ alice: '+8613800138000', bob: 'not-a-number' }),
    ).resolveUsers(['alice', 'bob', 'carol']);
    expect(Object.fromEntries(found)).toEqual({
      alice: [{ phone: '+8613800138000' }],
    });
  });

  it('reaches nobody without the verification directory or a notification template', async () => {
    expect((await channel().resolveUsers(['alice'])).size).toBe(0);
    const noTemplate = {
      ...aliyun,
      templates: { code: aliyun.templates.code! },
    };
    expect(
      (
        await channel(
          noTemplate,
          containerWith({ alice: '+8613800138000' }),
        ).resolveUsers(['alice'])
      ).size,
    ).toBe(0);
  });

  it('composes the title and body, shortened, into the notification template', () => {
    const message = channel().compose(
      { ...content, title: 'T'.repeat(100), body: 'B'.repeat(500) },
      [{ phone: '+8613800138000' }],
    );
    expect(message).toMatchObject({
      to: ['+8613800138000'],
      template: 'notification',
    });
    expect(message.params!.title).toHaveLength(60);
    expect(message.params!.body).toHaveLength(200);
    expect(
      channel().compose({ ...content, body: ' ' }, [
        { phone: '+8613800138000' },
      ]).params!.body,
    ).toBe('Approve budget');
  });

  it('files a delivery under the phone number', () => {
    expect(channel().recipientKey({ phone: '+8613800138000' })).toBe(
      '+8613800138000',
    );
  });
});

describe('SMS service registry', () => {
  it('registers another service through the container token', async () => {
    const container = new ServiceContainer();
    new NotificationProvidersProvider({ container } as never).register();
    const registry = container.resolve(smsProviderRegistryToken);
    expect(registry.list()).toEqual(['aliyun', 'tencent']);

    const sent = vi.fn(async () => ({ messageId: 'acme-1' }));
    registry.register({
      service: 'acme',
      validate(options) {
        if (!options.apiKey) throw new Error('acme.apiKey is required.');
      },
      summarize: () => [{ label: 'acme.apiKey', value: '••••••' }],
      create: (): SmsProvider => ({ send: sent }),
    });
    const config = {
      ...aliyun,
      service: 'acme',
      acme: { apiKey: 'k' },
    } as SmsChannelConfig;
    const result = await deliver(channel(config, container), {
      to: '+8613800138000',
      template: 'code',
      params: { code: '246810' },
    });
    expect(result).toEqual({ status: 'accepted', providerMessageId: 'acme-1' });
    expect(sent).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '+8613800138000',
        templateId: 'SMS_1',
        params: { code: '246810' },
        signName: 'Example',
      }),
    );
    expect(() =>
      channel({ ...config, acme: {} } as SmsChannelConfig, container),
    ).toThrow(/acme.apiKey is required/);
  });

  it('refuses a duplicate or nameless service', () => {
    const registry = createSmsProviderRegistry();
    expect(() => registry.register(registry.get('aliyun')!)).toThrow(
      /already registered/,
    );
    expect(() =>
      new SmsProviderRegistry().register({
        service: ' ',
        validate: () => undefined,
        summarize: () => [],
        create: () => ({ send: async () => ({}) }),
      }),
    ).toThrow(/needs a name/);
  });
});
