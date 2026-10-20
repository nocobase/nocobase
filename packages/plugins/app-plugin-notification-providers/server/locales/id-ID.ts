import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  test: {
    channels: {
      email: 'Email',
      im: 'IM',
    },
    providers: {
      smtp: 'SMTP',
      resend: 'Kirim ulang',
      feishuWebhook: 'kait web Feishu',
      dingtalkWebhook: 'kait web DingTalk',
    },
    fields: {
      subject: 'Subjek',
      text: 'Teks',
      html: 'HTML',
      url: 'HTTP(S) URL Penuh',
      recipient: 'Penerima',
      title: 'Judul',
      message: 'Pesan',
    },
    placeholders: {
      email: 'nama@example.com',
    },
    defaults: {
      title: 'Tes notifikasi NocoBase',
      body: 'Ini adalah notifikasi pengujian dari NocoBase.',
    },
  },
};

export default idID;
