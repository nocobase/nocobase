import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: 'O acesso aos logs de notificação é necessário.',
    logNotFound: 'Log de notificação não encontrado.',
  },
};

export default ptBR;
