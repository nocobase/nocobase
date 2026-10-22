import { describe, expect, it, vi } from 'vitest';
import { ServiceContainer } from '@nocobase/service-provider';
import {
  AppConfig,
  buildVariablesManifest,
  envString,
} from '../src/config/index.js';
import {
  createMailer,
  defineMailChannelsConfig,
  MailerProvider,
  mailerToken,
  validateMailChannels,
} from '../src/mailer/index.js';
import type { AppPluginApplication } from '../src/plugins/index.js';

const created = vi.hoisted(() => ({ count: 0, closed: 0 }));
vi.mock('@nocobase/mailer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/mailer')>()),
  createMailTransport: () => {
    created.count++;
    return new (class {
      #closed = false;
      async send() {
        return { status: 'accepted' as const };
      }
      async close() {
        if (!this.#closed) {
          this.#closed = true;
          created.closed++;
        }
      }
    })();
  },
}));

describe('host mailer ownership', () => {
  it('creates transports lazily and closes prototype methods exactly once with their receiver', async () => {
    created.count = 0;
    created.closed = 0;
    const mailer = createMailer({
      channels: {
        'system-email': { provider: 'smtp', host: 'localhost', port: 25 },
      },
    });
    expect(mailer.available('system-email')).toBe(true);
    expect(created.count).toBe(0);
    await mailer.send('system-email', {
      to: 'synthetic@example.test',
      subject: 'Synthetic',
    });
    expect(created.count).toBe(1);
    await mailer.close();
    await mailer.close();
    expect(created.closed).toBe(1);
    expect(mailer.available('system-email')).toBe(false);
  });

  it.each([
    { type: 'smtp' },
    { provider: 'smtp' },
    { type: 'smtp', provider: 'smtp' },
  ])('accepts a channel discriminator %j', async (discriminator) => {
    const channels = {
      email: { ...discriminator, host: 'localhost', port: 25 },
    };
    const error = vi.fn();
    validateMailChannels(
      { channels },
      { error, warning: vi.fn(), isUserProvided: () => true },
    );
    expect(error).not.toHaveBeenCalled();
    const mailer = createMailer({ channels });
    try {
      expect(mailer.available('email')).toBe(true);
      expect(
        await mailer.send('email', {
          to: 'synthetic@example.test',
          subject: 'Test',
        }),
      ).toEqual({ status: 'accepted' });
    } finally {
      await mailer.close();
    }
  });

  it.each([true, false])(
    'rejects conflicting aliases before constructing a transport (enabled=%s)',
    async (enabled) => {
      const channels = {
        email: {
          type: 'smtp',
          provider: 'resend',
          enabled,
          host: 'localhost',
          port: 25,
        },
      };
      const error = vi.fn();
      validateMailChannels(
        { channels },
        { error, warning: vi.fn(), isUserProvided: () => true },
      );
      expect(error).toHaveBeenCalledExactlyOnceWith(
        'channels.email',
        'Channel type and provider must match when both are configured.',
      );
      const mailer = createMailer({ channels });
      expect(mailer.available('email')).toBe(false);
      expect(
        await mailer.send('email', {
          to: 'synthetic@example.test',
          subject: 'Test',
        }),
      ).toMatchObject({ status: 'failed' });
      await mailer.close();
    },
  );

  it('recognizes a Resend channel selected by type', async () => {
    const channels = {
      marketing: {
        type: 'resend',
        apiKey: 'synthetic-key',
        from: 'synthetic@example.test',
      },
    };
    const error = vi.fn();
    validateMailChannels(
      { channels },
      { error, warning: vi.fn(), isUserProvided: () => true },
    );
    expect(error).not.toHaveBeenCalled();
    const mailer = createMailer({ channels });
    expect(mailer.available('marketing')).toBe(true);
    expect(
      await mailer.send('marketing', {
        to: 'synthetic@example.test',
        subject: 'Test',
      }),
    ).toEqual({ status: 'accepted' });
    await mailer.close();
  });

  it('does not offer missing, invalid, disabled or custom notification channels', () => {
    const mailer = createMailer({
      channels: {
        disabled: {
          provider: 'smtp',
          enabled: false,
          host: 'localhost',
          port: 25,
        },
        invalid: { provider: 'resend', apiKey: '' },
        ...Object.fromEntries(
          [false, null, 0, ''].map((auth, index) => [
            `invalidAuth${index}`,
            { provider: 'smtp', host: 'localhost', port: 25, auth },
          ]),
        ),
        custom: { provider: 'custom-email' },
      },
    });
    for (const channel of [
      'missing',
      'disabled',
      'invalid',
      'custom',
      'invalidAuth0',
      'invalidAuth1',
      'invalidAuth2',
      'invalidAuth3',
    ])
      expect(mailer.available(channel)).toBe(false);
  });

  it('registers without creating unused resources at shutdown', async () => {
    created.count = 0;
    const container = new ServiceContainer();
    const provider = new MailerProvider({
      container,
      config: new AppConfig(),
    } as AppPluginApplication);
    provider.register();
    expect(container.has(mailerToken)).toBe(true);
    await provider.shutdown();
    expect(created.count).toBe(0);
  });

  it('declares secret mappings and reports fixed configuration errors without their values', () => {
    const declaration = defineMailChannelsConfig({
      defaults: { channels: {} },
    });
    expect(declaration.rules?.public).toEqual([]);
    expect(declaration.rules?.env?.SMTP_PASSWORD).toMatchObject({
      secret: true,
    });
    const error = vi.fn();
    validateMailChannels(
      {
        channels: {
          broken: {
            provider: 'smtp',
            host: 'synthetic-secret',
            port: 'synthetic-secret',
          },
          custom: { provider: 'custom-email' },
        },
      },
      { error, warning: vi.fn(), isUserProvided: () => true },
    );
    expect(error).toHaveBeenCalledExactlyOnceWith(
      'channels.broken',
      'Invalid built-in email channel configuration.',
    );
  });
});

describe('host mailer deployment variables', () => {
  it.each([
    ['no channels', {}],
    ['disabled placeholder', { placeholder: { enabled: false } }],
    [
      'disabled channel',
      { 'system-email': { provider: 'smtp', enabled: false } },
    ],
    [
      'SMTP only',
      { 'system-email': { provider: 'smtp', host: 'localhost', port: 2525 } },
    ],
    [
      'Resend only',
      {
        'system-email': {
          provider: 'resend',
          apiKey: 'synthetic-key',
          from: 'synthetic@example.test',
        },
      },
    ],
  ])(
    'keeps default credentials optional and secret with %s',
    (_scenario, channels) => {
      const declaration = defineMailChannelsConfig({ defaults: { channels } });
      const manifest = buildVariablesManifest({
        app: { name: 'synthetic-mailer' },
        variables: Object.fromEntries(
          Object.entries(declaration.rules?.env ?? {}).map(
            ([name, mapping]) => [
              name,
              { ...mapping, path: `notification.${mapping.path}` },
            ],
          ),
        ),
        defaults: { notification: { channels } },
      });
      const credentials = manifest.variables.filter(({ name }) =>
        ['SMTP_PASSWORD', 'RESEND_API_KEY'].includes(name),
      );
      expect(credentials).toHaveLength(2);
      for (const credential of credentials)
        expect(credential).toMatchObject({ required: false, secret: true });
      const error = vi.fn();
      validateMailChannels(
        { channels },
        { error, warning: vi.fn(), isUserProvided: () => true },
      );
      expect(error).not.toHaveBeenCalled();
    },
  );

  it('preserves application overrides that explicitly require a credential', () => {
    const declaration = defineMailChannelsConfig({
      defaults: { channels: {} },
      env: {
        SMTP_PASSWORD: envString('channels.system-email.auth.pass', {
          required: true,
          secret: true,
        }),
      },
    });
    const manifest = buildVariablesManifest({
      app: { name: 'synthetic-mailer' },
      variables: declaration.rules?.env ?? {},
      defaults: {},
    });
    expect(
      manifest.variables.find(({ name }) => name === 'SMTP_PASSWORD'),
    ).toMatchObject({ required: true, secret: true });
    expect(
      manifest.variables.find(({ name }) => name === 'RESEND_API_KEY'),
    ).toMatchObject({ required: false, secret: true });
  });

  it.each([
    {
      provider: 'smtp',
      host: 'localhost',
      port: 2525,
      auth: { user: 'synthetic' },
    },
    { provider: 'resend', from: 'synthetic@example.test' },
  ])(
    'still rejects an enabled channel with missing credentials: $provider',
    (channel) => {
      const declaration = defineMailChannelsConfig({
        defaults: { channels: {} },
      });
      const error = vi.fn();
      expect(declaration.rules?.validators).toContain(validateMailChannels);
      validateMailChannels(
        { channels: { 'system-email': channel } },
        { error, warning: vi.fn(), isUserProvided: () => true },
      );
      expect(error).toHaveBeenCalledExactlyOnceWith(
        'channels.system-email',
        'Invalid built-in email channel configuration.',
      );
      expect(
        createMailer({ channels: { 'system-email': channel } }).available(
          'system-email',
        ),
      ).toBe(false);
    },
  );
});
