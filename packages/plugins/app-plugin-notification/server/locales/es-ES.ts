import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: 'Se requiere acceso a los registros de notificaciones.',
    logNotFound: 'No se encontró el registro de notificaciones.',
  },
};

export default esES;
