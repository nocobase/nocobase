import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  providers: {
    smtp: 'SMTP',
    resend: 'Kirim ulang',
    feishuWebhook: 'kait web Feishu',
    dingtalkWebhook: 'kait web DingTalk',
  },
};

export default idID;
