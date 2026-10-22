import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  providers: {
    smtp: 'SMTP',
    resend: '再送信',
    feishuWebhook: 'Feishu ウェブフック',
    dingtalkWebhook: 'DingTalk ウェブフック',
  },
};

export default jaJP;
