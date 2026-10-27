import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  channels: {
    inApp: 'No aplicativo',
  },
  providers: {
    builtIn: 'Integrado',
  },
  errors: {
    authenticationRequired: 'Autenticação necessária.',
    invalidPageToken: 'pageToken não é um token retornado por esta lista.',
    notFound: 'A mensagem de notificação não foi encontrada.',
  },
};

export default ptBR;
