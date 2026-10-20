import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  errors: {
    authenticationRequired: 'Autenticação necessária.',
    invalidPageToken: 'pageToken não é um token retornado por esta lista.',
    notFound: 'A mensagem de notificação não foi encontrada.',
  },
  test: {
    channels: {
      inApp: 'No aplicativo',
    },
    providers: {
      builtIn: 'Integrado',
    },
    fields: {
      route: 'Rota interna (sem prefixo de implantação)',
      url: 'HTTP(S) URL completo',
      recipientUserId: 'ID do usuário destinatário',
      title: 'Título',
      message: 'Mensagem',
    },
    placeholders: {
      currentUser: 'ID do usuário do aplicativo',
    },
    defaults: {
      title: 'Teste de notificação NocoBase',
      body: 'Esta é uma notificação de teste de NocoBase.',
    },
  },
};

export default ptBR;
