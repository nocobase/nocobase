import auditLabels from '../../locales/es-ES.js';
import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  ...auditLabels,
  invitationEmail: {
    subject: '{{inviter}} te invitó a {{app}}',
    intro: '{{inviter}} te invitó a {{app}}.',
    summary: 'También te unirás: {{items}}.',
    separator: ', ',
    action: 'Acepta la invitación',
    validity:
      'Abra el enlace para configurar su nombre y contraseña. Funciona una vez, hasta {{date}}.',
    fallback: 'Si el enlace no se abre, cópielo en su navegador:',
  },
};

export default esES;
