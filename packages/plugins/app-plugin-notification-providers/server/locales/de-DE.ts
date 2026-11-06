import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  providers: {
    smtp: 'SMTP',
    resend: 'Erneut senden',
    feishuWebhook: 'Feishu Webhook',
    dingtalkWebhook: 'DingTalk Webhook',
  },
};

export default deDE;
