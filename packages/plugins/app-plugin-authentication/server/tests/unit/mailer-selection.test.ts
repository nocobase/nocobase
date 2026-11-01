import { afterEach, expect, it, vi } from 'vitest';
import {
  ApplicationMailer,
  defineMailersConfig,
} from '@nocobase/app-server/mailers';
import { AppConfig, defaultAppConfigs } from '@nocobase/app-server/config';
import { PasswordResetPolicy } from '../../password-reset.js';
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
    const mailer = new ApplicationMailer({
      default: 'main',
      main: smtp,
      other: smtp,
    });
    const send = vi.spyOn(mailer, 'send');
    const policy = new PasswordResetPolicy(
      { enabled: true, emailChannel: channel },
      { baseURL: 'https://example.test', emailAndPassword: { enabled: true } },
      {} as never,
      { mailer },
      email,
    );
    expect(policy.available).toBe(expected);
    expect(send).not.toHaveBeenCalled();
    await policy.close();
    await mailer.close();
  },
);

it.each([undefined, false])(
  'a default never enables automatic recovery without explicit opt-in: %s',
  async (enabled) => {
    const mailer = new ApplicationMailer({ default: 'main', main: smtp });
    const policy = new PasswordResetPolicy(
      { enabled },
      { baseURL: 'https://example.test' },
      {} as never,
      { mailer },
    );
    expect(policy.available).toBe(false);
    await mailer.close();
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
  const mailer = new ApplicationMailer({ default: 'main', main: smtp });
  const policy = new PasswordResetPolicy(
    { enabled: true, emailChannel: 'selected' },
    { baseURL: 'https://example.test' },
    {} as never,
    {
      mailer,
      legacyChannels: {
        selected: { type: 'email', provider: 'smtp', mailer: 'main' },
      },
    },
  );
  expect(policy.available).toBe(false);
  await mailer.close();
});
