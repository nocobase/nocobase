import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  providers: {
    smtp: 'SMTP',
    resend: 'Reenviar',
    feishuWebhook: 'Webhook Feishu',
    dingtalkWebhook: 'Webhook DingTalk',
    sms: 'SMS',
  },
};

export default esES;
