import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  providers: {
    smtp: 'SMTP',
    resend: 'Resend',
    feishuWebhook: 'Feishu webhook',
    dingtalkWebhook: 'DingTalk webhook',
  },
};

export type NotificationProvidersResource = LocaleResource<typeof enUS>;
export default enUS;
