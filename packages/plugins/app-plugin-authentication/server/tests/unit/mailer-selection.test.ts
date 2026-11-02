import { afterEach, expect, it, vi } from 'vitest';
import * as transports from '@nocobase/mailer';
import {
  MailSenderFactory,
  defineMailersConfig,
} from '@nocobase/app-server/mailers';
import { AppConfig, defaultAppConfigs } from '@nocobase/app-server/config';
import { PasswordResetPolicy } from '../../password-reset.js';
import { createPasswordResetSender } from '../../reset-sender.js';
import { defineAuthConfig } from '../../config.js';

const smtp = { provider: 'smtp', host: 'localhost', port: 25 } as const;
afterEach(() => vi.restoreAllMocks());
it.each([
  { email: { mailer: 'other' }, channel: undefined, expected: true },
  { email: undefined, channel: undefined, expected: true },
  { email: undefined, channel: 'missing', expected: false },
  { email: smtp, channel: 'missing', expected: true },
])(
  'selects explicit configurations before the default: %j',
  async ({ email, channel, expected }) => {
    const create = vi.spyOn(transports, 'createMailTransport');
    const factory = new MailSenderFactory({
      default: 'main',
      main: smtp,
      other: smtp,
    });
    const passwordReset = { enabled: true, emailChannel: channel };
    const { sender, legacy } = createPasswordResetSender(factory, {
      email,
      passwordReset,
    });
    const policy = new PasswordResetPolicy(
      passwordReset,
      { baseURL: 'https://example.test', emailAndPassword: { enabled: true } },
      {} as never,
      { sender, legacySender: legacy },
      email,
    );
    expect(policy.available).toBe(expected);
    // Selection allocates no transport before the first send.
    expect(create).not.toHaveBeenCalled();
    await policy.close();
    await sender?.close();
  },
);

it.each([undefined, false])(
  'a default never enables automatic recovery without explicit opt-in: %s',
  async (enabled) => {
    const { sender } = createPasswordResetSender(
      new MailSenderFactory({ default: 'main', main: smtp }),
      { passwordReset: { enabled } },
    );
    const policy = new PasswordResetPolicy(
      { enabled },
      { baseURL: 'https://example.test' },
      {} as never,
      { sender },
    );
    expect(policy.available).toBe(false);
    await sender?.close();
  },
);

it.each([
  { mailer: 'absent' },
  { mailer: 'main', provider: 'smtp' },
  { mailer: 'disabled' },
])(
  'rejects invalid auth references without exposing secrets: %j',
  async (email) => {
    const config = new AppConfig();
    await config.loadAll();
    const definitions = defaultAppConfigs({
      mailers: defineMailersConfig({
        defaults: { main: smtp, disabled: { ...smtp, enabled: false } },
      }),
      auth: defineAuthConfig({ defaults: { email: email as never } }),
    });
    config.mergeDefaults(definitions({} as never));
    config.defineSections(definitions.sections!);
    expect(
      (await config.validate()).some((issue) =>
        issue.path.startsWith('auth.email'),
      ),
    ).toBe(true);
  },
);

it('rejects mismatched legacy aliases instead of selecting a referenced default sender', async () => {
  const { sender } = createPasswordResetSender(
    new MailSenderFactory({ default: 'main', main: smtp }),
    {
      passwordReset: { enabled: true, emailChannel: 'selected' },
      legacyChannels: {
        selected: { type: 'email', provider: 'smtp', mailer: 'main' },
      },
    },
  );
  expect(sender).toBeUndefined();
});
