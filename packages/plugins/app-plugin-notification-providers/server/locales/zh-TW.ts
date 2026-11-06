import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  providers: {
    smtp: 'SMTP',
    resend: '重新傳送',
    feishuWebhook: 'Feishu Webhook',
    dingtalkWebhook: 'DingTalk Webhook',
  },
};

export default zhTW;
