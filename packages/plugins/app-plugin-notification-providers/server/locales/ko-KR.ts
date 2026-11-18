import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  providers: {
    smtp: 'SMTP',
    resend: 'Resend',
    feishuWebhook: 'Feishu 웹훅',
    dingtalkWebhook: 'DingTalk 웹훅',
  },
};

export default koKR;
