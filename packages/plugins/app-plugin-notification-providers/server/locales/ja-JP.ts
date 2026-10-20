import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  test: {
    channels: {
      email: 'メール',
      im: 'IM',
    },
    providers: {
      smtp: 'SMTP',
      resend: '再送信',
      feishuWebhook: 'Feishu ウェブフック',
      dingtalkWebhook: 'DingTalk ウェブフック',
    },
    fields: {
      subject: '件名',
      text: 'テキスト',
      html: 'HTML',
      url: 'フル HTTP(S) URL',
      recipient: '受信者',
      title: 'タイトル',
      message: 'メッセージ',
    },
    placeholders: {
      email: '名前@example.com',
    },
    defaults: {
      title: 'NocoBase 通知テスト',
      body: 'NocoBaseからのテスト通知です。',
    },
  },
};

export default jaJP;
