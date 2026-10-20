import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  test: {
    channels: {
      email: '電子郵件',
      im: '即時通訊',
    },
    providers: {
      smtp: 'SMTP',
      resend: '重新傳送',
      feishuWebhook: 'Feishu Webhook',
      dingtalkWebhook: 'DingTalk Webhook',
    },
    fields: {
      subject: '主旨',
      text: '文字',
      html: 'HTML',
      url: '全 HTTP(S) URL',
      recipient: '收件人',
      title: '標題',
      message: '留言',
    },
    placeholders: {
      email: 'name@example.com',
    },
    defaults: {
      title: 'NocoBase 通知測試',
      body: '這是 NocoBase 的測試通知。',
    },
  },
};

export default zhTW;
