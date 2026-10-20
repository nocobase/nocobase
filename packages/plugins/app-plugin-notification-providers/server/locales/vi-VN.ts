import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  test: {
    channels: {
      email: 'Email',
      im: 'Tôi',
    },
    providers: {
      smtp: 'SMTP',
      resend: 'Gửi lại',
      feishuWebhook: 'Feishu',
      dingtalkWebhook: 'DingTalk webhook\nWebhook',
    },
    fields: {
      subject: 'Chủ đề',
      text: 'Văn bản',
      html: 'HTML',
      url: 'HTTP(S) URL đầy đủ',
      recipient: 'Người nhận',
      title: 'Tiêu đề',
      message: 'Tin nhắn',
    },
    placeholders: {
      email: 'tên@example.com',
    },
    defaults: {
      title: 'Kiểm tra thông báo NocoBase',
      body: 'Đây là thông báo thử nghiệm từ NocoBase.',
    },
  },
};

export default viVN;
