import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  test: {
    channels: {
      email: 'E-mail',
      im: 'IM',
    },
    providers: {
      smtp: 'SMTP',
      resend: 'Reenviar',
      feishuWebhook: 'Webhook Feishu',
      dingtalkWebhook: 'Webhook DingTalk',
    },
    fields: {
      subject: 'Assunto',
      text: 'Texto',
      html: 'HTML',
      url: 'HTTP(S) URL completo',
      recipient: 'Destinatário',
      title: 'Título',
      message: 'Mensagem',
    },
    placeholders: {
      email: 'nome@exemplo.com',
    },
    defaults: {
      title: 'Teste de notificação NocoBase',
      body: 'Esta é uma notificação de teste de NocoBase.',
    },
  },
};

export default ptBR;
