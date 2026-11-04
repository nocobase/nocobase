import { afterEach, expect, it, vi } from 'vitest';
import * as transports from '@nocobase/mailer';
import {
  MailSenderFactory,
  defineMailersConfig,
} from '@nocobase/app-server/mailers';
import { AppConfig, defaultAppConfigs } from '@nocobase/app-server/config';
import { PasswordResetPolicy } from '../../password-reset.js';
import { createPasswordResetSender } from '../../reset-sender.js';
import { Auth } from '../../auth.js';
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

const factory = () =>
  new MailSenderFactory({
    default: 'main',
    main: smtp,
    other: smtp,
    disabled: { ...smtp, enabled: false },
  });

it.each([
  { email: undefined, emailChannel: undefined, valid: true },
  { email: { mailer: 'other' }, emailChannel: undefined, valid: true },
  { email: { mailer: 'main' }, emailChannel: undefined, valid: false },
  { email: smtp, emailChannel: undefined, valid: false },
  { email: undefined, emailChannel: 'legacy', valid: false },
])(
  'checks new/old selections in configuration and assembly: %j',
  async ({ email, emailChannel, valid }) => {
    const auth = {
      email,
      passwordReset: { mailer: 'other', emailChannel, enabled: false },
    };
    const config = new AppConfig();
    await config.loadAll();
    const definitions = defaultAppConfigs({
      mailers: defineMailersConfig({ defaults: { main: smtp, other: smtp } }),
      auth: defineAuthConfig({ defaults: auth }),
    });
    config.mergeDefaults(definitions({} as never));
    config.defineSections(definitions.sections!);
    const errors = (await config.validate()).filter(
      (issue) => issue.level === 'error',
    );
    if (valid) {
      expect(errors).toEqual([]);
      const { sender } = createPasswordResetSender(factory(), auth);
      expect(sender).toBeDefined();
      await sender?.close();
    } else {
      expect(errors).toContainEqual(
        expect.objectContaining({ path: 'auth.passwordReset.mailer' }),
      );
      expect(() => createPasswordResetSender(factory(), auth)).toThrow(
        'auth.passwordReset.mailer',
      );
    }
  },
);

it.each(['', ' other ', 3, null, 'missing', 'disabled'])(
  'rejects explicit invalid new references even with an injected sender: %j',
  async (mailer) => {
    const config = new AppConfig();
    await config.loadAll();
    const definitions = defaultAppConfigs({
      mailers: defineMailersConfig({
        defaults: { main: smtp, disabled: { ...smtp, enabled: false } },
      }),
      auth: defineAuthConfig({
        defaults: { passwordReset: { mailer: mailer as never } },
      }),
    });
    config.mergeDefaults(definitions({} as never));
    config.defineSections(definitions.sections!);
    expect(await config.validate()).toContainEqual(
      expect.objectContaining({
        path: 'auth.passwordReset.mailer',
        level: 'error',
      }),
    );
    const create = vi.spyOn(transports, 'createMailTransport');
    expect(
      () =>
        new Auth({
          secret: 'synthetic-secret-with-at-least-32-characters',
          connection: {} as never,
          passwordReset: { enabled: false, mailer: mailer as never },
          emailAndPassword: { sendResetPassword: async () => undefined },
          passwordResetServices: {
            mailerFactory: factory(),
            sender: { send: vi.fn() },
          },
        }),
    ).toThrow('auth.passwordReset.mailer');
    expect(create).not.toHaveBeenCalled();
  },
);

it.each([undefined, false, true])(
  'new reference retains switch and callback semantics: %s',
  async (enabled) => {
    const custom = vi.fn();
    const warning = vi.fn();
    const { sender } = createPasswordResetSender(factory(), {
      passwordReset: { mailer: 'other' },
    });
    for (const callback of [undefined, custom]) {
      const policy = new PasswordResetPolicy(
        { enabled, mailer: 'other' },
        {
          baseURL: 'https://example.test',
          emailAndPassword: { enabled: true, sendResetPassword: callback },
        },
        {} as never,
        { sender, warning },
      );
      expect(policy.available).toBe(
        enabled !== false && (enabled === true || !!callback),
      );
      await policy.close();
    }
    if (enabled !== false)
      expect(warning).toHaveBeenCalledWith(
        expect.stringContaining('sendResetPassword takes precedence'),
      );
    await sender?.close();
  },
);

it('never selects the first mailer when neither a reference nor default exists', () => {
  expect(
    createPasswordResetSender(new MailSenderFactory({ main: smtp }), {}).sender,
  ).toBeUndefined();
});

it('accepts matching old/new names and warns with a credential-free migration path', async () => {
  const warning = vi.fn();
  const email = { mailer: 'other' };
  const passwordReset = { enabled: true, mailer: 'other' };
  const { sender } = createPasswordResetSender(factory(), {
    email,
    passwordReset,
    legacyChannels: { 'system-email': smtp },
  });
  const policy = new PasswordResetPolicy(
    passwordReset,
    { baseURL: 'https://example.test' },
    {} as never,
    { sender, warning },
    email,
  );
  expect(policy.available).toBe(true);
  expect(warning).toHaveBeenCalledWith(
    'auth.email.mailer is deprecated. Remove it and use auth.passwordReset.mailer after confirming the sender identity.',
  );
  await policy.close();
  await sender?.close();
});
