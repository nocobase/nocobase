import { afterEach, expect, it, vi } from 'vitest';
import { ServiceContainer } from '@nocobase/service-provider';
import {
  ApplicationMailer,
  applicationMailerToken,
} from '@nocobase/app-server/mailers';
import { AppConfig, defaultAppConfigs } from '@nocobase/app-server/config';
import { defineMailersConfig } from '@nocobase/app-server/mailers/config';
import { EmailChannel } from '../server/email/reference.js';
import { defineMailChannelsConfig } from '../server/email/config.js';

afterEach(() => vi.unstubAllGlobals());
const sender = {
  provider: 'resend',
  apiKey: 'synthetic-key',
  from: 'sender@example.test',
} as const;

it.each(['accepted', 'failed', 'submission_unknown'] as const)(
  'keeps delivery identity and the %s result through the shared service',
  async (status) => {
    const fetch = vi.fn(async (_url: string, _options: RequestInit) => {
      if (status === 'submission_unknown')
        throw new Error('synthetic-private-provider-body');
      return Response.json(
        status === 'accepted'
          ? { id: 'synthetic-id' }
          : {
              name: 'rate_limit_exceeded',
              message: 'synthetic-private-provider-body',
            },
        { status: status === 'accepted' ? 200 : 429 },
      );
    });
    vi.stubGlobal('fetch', fetch);
    const mailer = new ApplicationMailer({ default: 'shared', shared: sender });
    const container = new ServiceContainer();
    container.instance(applicationMailerToken, mailer);
    const channel = new EmailChannel(
      { channelName: 'system-email', container },
      { type: 'email' },
    );
    expect(channel.capabilities?.idempotency?.supported).toBe(true);
    const result = await channel.send({
      message: {
        to: 'synthetic@example.test',
        content: {
          to: 'synthetic@example.test',
          subject: 'Notice',
          text: 'Synthetic',
        },
      },
      deliveryId: 'synthetic-delivery',
      notificationId: 'synthetic-notification',
      attemptId: 'synthetic-attempt',
      deadline: new Date().toISOString(),
      signal: new AbortController().signal,
    });
    expect(result.status).toBe(status);
    expect(
      new Headers(fetch.mock.calls[0]?.[1]?.headers).get('idempotency-key'),
    ).toBe('synthetic-delivery');
    expect(JSON.stringify(result)).not.toMatch(
      /synthetic-key|synthetic-private-provider-body/u,
    );
    await mailer.close();
  },
);

it('checks reference shape and cross-section targets without sending or loading transports', async () => {
  for (const channel of [
    { type: 'email', mailer: 'absent' },
    { type: 'email', mailer: 'disabled' },
    { type: 'email', host: 'synthetic-private-field' },
    { type: 'email', apiKey: 'synthetic-private-field' },
  ]) {
    const config = new AppConfig();
    await config.loadAll();
    const definitions = defaultAppConfigs({
      mailers: defineMailersConfig({
        defaults: {
          default: 'shared',
          shared: sender,
          disabled: { ...sender, enabled: false },
        },
      }),
      notification: defineMailChannelsConfig({
        defaults: { channels: { selected: channel } },
      }),
    });
    config.mergeDefaults(definitions({} as never));
    config.defineSections(definitions.sections!);
    const issues = await config.validate();
    expect(
      issues.some((issue) =>
        issue.path.startsWith('notification.channels.selected'),
      ),
    ).toBe(true);
    expect(JSON.stringify(issues)).not.toContain('synthetic-private-field');
    expect(config.publicValues()).toEqual({});
  }
});
