import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  providers: {
    smtp: 'SMTP',
    resend: 'Renvoyer',
    feishuWebhook: 'Webhook Feishu',
    dingtalkWebhook: 'DingTalk',
  },
};

export default frFR;
