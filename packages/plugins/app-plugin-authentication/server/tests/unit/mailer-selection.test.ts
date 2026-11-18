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
      { passwordReset: { enabled, mailer: 'main' } },
    );
    const policy = new PasswordResetPolicy(
      { enabled, mailer: 'main' },
      { baseURL: 'https://example.test' },
      {} as never,
      { sender },
    );
    expect(policy.available).toBe(false);
    await sender?.close();
  },
);

it.each(['absent', 'disabled', '', ' main ', 7])(
  'rejects an invalid direct reference during validation and assembly: %j',
  async (mailer) => {
    const mailers = {
      default: 'main',
      main: smtp,
      disabled: { ...smtp, enabled: false },
    };
    const config = new AppConfig();
    await config.loadAll();
    const definitions = defaultAppConfigs({
      mailers: defineMailersConfig({ defaults: mailers }),
      auth: defineAuthConfig({
        defaults: {
          passwordReset: { mailer: mailer as never, enabled: false },
          emailAndPassword: { sendResetPassword: async () => {} },
        },
      }),
    });
    config.mergeDefaults(definitions({} as never));
    config.defineSections(definitions.sections!);
    expect(await config.validate()).toContainEqual(
      expect.objectContaining({
        level: 'error',
        path: 'auth.passwordReset.mailer',
      }),
    );
    expect(() =>
      createPasswordResetSender(new MailSenderFactory(mailers), {
        passwordReset: { mailer: mailer as never, enabled: false },
      }),
    ).toThrow('auth.passwordReset.mailer');
  },
);

it('selects the direct reference before inline, channel and default choices without allocating a transport', async () => {
  const factory = new MailSenderFactory({
    default: 'main',
    main: smtp,
    other: smtp,
  });
  const create = vi.spyOn(factory, 'create');
  const inline = vi.spyOn(factory, 'createFromConfig');
  const transport = vi.spyOn(transports, 'createMailTransport');
  const { sender } = createPasswordResetSender(factory, {
    email: smtp,
    passwordReset: { enabled: true, mailer: 'other', emailChannel: 'legacy' },
  });
  expect(create).toHaveBeenCalledWith('other', 'auth.passwordReset.mailer');
  expect(inline).not.toHaveBeenCalled();
  expect(transport).not.toHaveBeenCalled();
  await sender?.close();
});

it('does not select the first named service without a default', () => {
  expect(
    createPasswordResetSender(new MailSenderFactory({ main: smtp }), {}).sender,
  ).toBeUndefined();
});

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
