import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  test: {
    channels: {
      email: 'Correo electrónico',
      im: 'mensajería instantánea',
    },
    providers: {
      smtp: 'SMTP',
      resend: 'Reenviar',
      feishuWebhook: 'Webhook Feishu',
      dingtalkWebhook: 'Webhook DingTalk',
    },
    fields: {
      subject: 'Asunto',
      text: 'Texto',
      html: 'HTML',
      url: 'Completo HTTP(S) URL',
      recipient: 'Destinatario',
      title: 'Título',
      message: 'Mensaje',
    },
    placeholders: {
      email: 'nombre@ejemplo.com',
    },
    defaults: {
      title: 'Prueba de notificación NocoBase',
      body: 'Esta es una notificación de prueba de NocoBase.',
    },
  },
};

export default esES;
