import { describe, expect, it, vi } from 'vitest';
import { ServiceContainer } from '@nocobase/service-provider';
import { AppConfig } from '../src/config/index.js';
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
        custom: { provider: 'custom-email' },
      },
    });
    for (const channel of ['missing', 'disabled', 'invalid', 'custom'])
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
