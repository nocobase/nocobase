import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  test: {
    channels: {
      email: 'E-mail',
      im: 'MI',
    },
    providers: {
      smtp: 'SMTP',
      resend: 'Renvoyer',
      feishuWebhook: 'Webhook Feishu',
      dingtalkWebhook: 'DingTalk',
    },
    fields: {
      subject: 'Objet',
      text: 'Texte',
      html: 'HTML',
      url: 'HTTP complet(S) URL',
      recipient: 'Destinataire',
      title: 'Titre',
      message: 'Message',
    },
    placeholders: {
      email: 'nom@exemple.com',
    },
    defaults: {
      title: 'Test de notification NocoBase',
      body: "Il s'agit d'une notification de test provenant de NocoBase.",
    },
  },
};

export default frFR;
