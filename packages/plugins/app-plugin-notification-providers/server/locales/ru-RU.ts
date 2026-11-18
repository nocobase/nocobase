import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ruRU: LocaleResource<typeof enUS> = {
  providers: {
    smtp: 'SMTP',
    resend: 'Resend',
    feishuWebhook: 'Вебхук Feishu',
    dingtalkWebhook: 'Вебхук DingTalk',
  },
};

export default ruRU;
