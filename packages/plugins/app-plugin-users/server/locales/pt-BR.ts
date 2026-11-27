import auditLabels from '../../locales/pt-BR.js';
import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  ...auditLabels,
  invitationEmail: {
    subject: '{{inviter}} convidou você para {{app}}',
    intro: '{{inviter}} convidou você para {{app}}.',
    summary: 'Você também ingressará em: {{items}}.',
    separator: ', ',
    action: 'Aceite o convite',
    validity:
      'Abra o link para definir seu nome e senha. Funciona uma vez, até {{date}}.',
    fallback: 'Se o link não abrir, copie-o em seu navegador:',
  },
};

export default ptBR;
