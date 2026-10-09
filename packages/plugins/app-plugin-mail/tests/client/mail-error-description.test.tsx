import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider, NamespaceScope } from '@nocobase/i18n/client';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MailErrorDescription } from '../../client/components/mail-error-description.js';
import locales from '../../client/locales/index.js';
import { MAIL_PLUGIN_NS } from '../../client/namespace.js';
import type {
  MailProviderErrorCategory,
  MailProviderReasonCode,
  MailPublicError,
  KnownMailProviderErrorCategory,
  KnownMailProviderReasonCode,
} from '../../shared/mail.js';

type ExpectedText = { readonly en: string; readonly zh: string };

const gmailReasons = {
  gmailRateLimitExceeded: {
    en: 'temporarily limiting requests for this mailbox',
    zh: '暂时限制了此邮箱的请求频率',
  },
  gmailUserRateLimitExceeded: {
    en: 'per-user request limit',
    zh: '单用户请求频率上限',
  },
  gmailDailyLimitExceeded: {
    en: 'daily quota has been reached',
    zh: '每日配额已用尽',
  },
  gmailDomainPolicy: {
    en: 'domain policy for this app',
    zh: '域策略',
  },
  gmailInsufficientPermissions: {
    en: 'required Gmail permissions',
    zh: '所需的 Gmail 权限',
  },
  gmailAuthError: {
    en: 'rejected the mailbox credentials',
    zh: '拒绝了此邮箱凭据',
  },
  gmailApiNotEnabled: {
    en: 'Gmail API is not enabled',
    zh: '尚未启用 Gmail API',
  },
} satisfies Record<KnownMailProviderReasonCode, ExpectedText>;

const categories = {
  authentication: {
    en: 'authorization is invalid or expired',
    zh: '授权无效或已过期',
  },
  configuration: {
    en: 'configuration is incomplete or invalid',
    zh: '配置不完整或无效',
  },
  recipient: {
    en: 'rejected one or more recipients',
    zh: '拒绝了一个或多个收件人',
  },
  content: { en: 'rejected the message content', zh: '拒绝了邮件内容' },
  rate_limit: {
    en: 'temporarily limiting requests',
    zh: '暂时限制了请求频率',
  },
  network: { en: 'could not be reached', zh: '无法连接邮件服务' },
  timeout: { en: 'did not respond in time', zh: '响应超时' },
  provider: { en: 'rejected the operation', zh: '拒绝了此操作' },
  unknown: { en: 'unexpected reason', zh: '未知原因失败' },
} satisfies Record<KnownMailProviderErrorCategory, ExpectedText>;

async function renderDescription(
  error: Pick<MailPublicError, 'category' | 'reasonCode'>,
  locale: 'en-US' | 'zh-CN',
): Promise<string> {
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
    applicationNamespace: '@test/host',
  });
  runtime.registerNamespace(MAIL_PLUGIN_NS, locales);
  await runtime.init(locale);
  const { container } = render(
    <I18nProvider runtime={runtime}>
      <NamespaceScope ns='@test/host'>
        <MailErrorDescription error={error} />
      </NamespaceScope>
    </I18nProvider>,
  );
  return container.textContent ?? '';
}

describe('mail error descriptions', () => {
  it.each(['en-US', 'zh-CN'] as const)(
    'renders actionable text for every Gmail reason in %s',
    async (locale) => {
      for (const [reasonCode, expected] of Object.entries(gmailReasons)) {
        const text = await renderDescription(
          {
            category: 'provider',
            reasonCode: reasonCode as MailProviderReasonCode,
          },
          locale,
        );
        expect(text).toContain(locale === 'en-US' ? expected.en : expected.zh);
      }
    },
  );

  it.each(['en-US', 'zh-CN'] as const)(
    'renders actionable fallbacks for every provider category in %s',
    async (locale) => {
      for (const [category, expected] of Object.entries(categories)) {
        const text = await renderDescription(
          { category: category as MailProviderErrorCategory },
          locale,
        );
        expect(text).toContain(locale === 'en-US' ? expected.en : expected.zh);
      }
    },
  );
});
