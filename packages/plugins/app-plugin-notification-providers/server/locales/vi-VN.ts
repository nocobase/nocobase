import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  providers: {
    smtp: 'SMTP',
    resend: 'Gửi lại',
    feishuWebhook: 'Feishu',
    dingtalkWebhook: 'Webhook DingTalk',
    sms: 'SMS',
  },
};

export default viVN;
