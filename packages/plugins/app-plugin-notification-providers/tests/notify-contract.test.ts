import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import {
  MailSenderFactory,
  mailSenderFactoryToken,
} from '@nocobase/app-server/mailers';
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it, vi } from 'vitest';

import { ResendChannel } from '../server/email/providers/resend.js';
import { SmtpChannel } from '../server/email/providers/smtp.js';
import { EmailChannel } from '../server/email/reference.js';
import { DingTalkWebhookChannel } from '../server/im/providers/dingtalk.js';
import { FeishuWebhookChannel } from '../server/im/providers/feishu.js';

const content = {
  kind: 'approval.requested',
  category: 'approvals',
  title: 'Approve budget',
  body: 'Alice asks for approval.',
  key: 'request-1',
};

function container(withUsers: boolean) {
  const services = new ServiceContainer();
  services.instance(
    mailSenderFactoryToken,
    new MailSenderFactory({
      default: 'shared',
      shared: { provider: 'resend', apiKey: 'key', from: 'a@example.test' },
    }),
  );
  const list = vi.fn(async ({ userIds }: { userIds: readonly string[] }) => ({
    items: userIds
      .filter((id) => id !== 'nobody')
      .map((id) => ({ id, email: id === 'bob' ? null : `${id}@example.test` })),
  }));
  if (withUsers)
    services.instance(userAdministrationServiceToken, { list } as never);
  return { services, list };
}

it('resolves users to their account email and composes one email to them', async () => {
  const { services, list } = container(true);
  const email = new EmailChannel(
    { channelName: 'mail', container: services },
    { type: 'email' },
  );
  const found = await email.resolveUsers(['alice', 'bob', 'nobody']);
  expect(Object.fromEntries(found)).toEqual({
    alice: [{ address: 'alice@example.test' }],
  });
  expect(list).toHaveBeenCalledWith(
    expect.objectContaining({ status: 'enabled', kind: 'person' }),
  );
  expect(
    email.compose({ ...content, html: '<p>Hi</p>' }, [
      { address: 'alice@example.test' },
    ]),
  ).toEqual({
    subject: 'Approve budget',
    to: ['alice@example.test'],
    text: 'Alice asks for approval.',
    html: '<p>Hi</p>',
  });
  await email.close?.();
});

it('reaches nobody by email without the authentication plugin', async () => {
  const { services } = container(false);
  const email = new EmailChannel(
    { channelName: 'mail', container: services },
    { type: 'email' },
  );
  expect((await email.resolveUsers(['alice'])).size).toBe(0);
  await email.close?.();
});

it('summarizes channel settings without any secret', () => {
  const summaries = JSON.stringify([
    EmailChannel.summarize({ type: 'email', mailer: 'support' }),
    SmtpChannel.summarize({
      type: 'smtp',
      host: 'smtp.example.test',
      port: 465,
      secure: true,
      auth: { user: 'robot', pass: 'smtp-password' },
      from: 'robot@example.test',
    } as never),
    ResendChannel.summarize({
      type: 'resend',
      apiKey: 're_secret',
      from: 'robot@example.test',
    } as never),
    FeishuWebhookChannel.summarize({
      type: 'feishu-webhook',
      webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/hook-token',
      secret: 'sign-secret',
    } as never),
    DingTalkWebhookChannel.summarize({
      type: 'dingtalk-webhook',
      webhookUrl: 'https://oapi.dingtalk.com/robot/send?access_token=tk',
    } as never),
  ]);
  expect(summaries).toContain('smtp.example.test:465');
  expect(summaries).toContain('https://open.feishu.cn/…');
  expect(summaries).not.toMatch(
    /smtp-password|re_secret|hook-token|sign-secret|access_token/u,
  );
  expect(EmailChannel.contributor).toBe(
    '@nocobase/app-plugin-notification-providers',
  );
});

it('composes a group message with the title, the body and an external link', () => {
  const feishu = new FeishuWebhookChannel(
    { channelName: 'ops', container: new ServiceContainer() },
    {
      type: 'feishu-webhook',
      webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/x',
    } as never,
  );
  expect(
    feishu.compose({
      ...content,
      target: { type: 'url', url: 'https://example.test/a' },
    }),
  ).toEqual({
    title: 'Approve budget',
    text: 'Alice asks for approval.',
    target: { type: 'url', url: 'https://example.test/a' },
  });
  expect('resolveUsers' in feishu).toBe(false);
});
