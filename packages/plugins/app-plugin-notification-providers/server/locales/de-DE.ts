import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  test: {
    channels: {
      email: 'E-Mail',
      im: 'IM',
    },
    providers: {
      smtp: 'SMTP',
      resend: 'Erneut senden',
      feishuWebhook: 'Feishu Webhook',
      dingtalkWebhook: 'DingTalk Webhook',
    },
    fields: {
      subject: 'Betreff',
      text: 'Text',
      html: 'HTML',
      url: 'Vollständig HTTP(S) URL',
      recipient: 'Empfänger',
      title: 'Titel',
      message: 'Nachricht',
    },
    placeholders: {
      email: 'name@example.com',
    },
    defaults: {
      title: 'NocoBase-Benachrichtigungstest',
      body: 'Dies ist eine Testbenachrichtigung von NocoBase.',
    },
  },
};

export default deDE;
