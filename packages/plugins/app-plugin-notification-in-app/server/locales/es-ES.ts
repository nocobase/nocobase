import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  channels: {
    inApp: 'En la aplicación',
  },
  providers: {
    builtIn: 'Incorporado',
  },
  errors: {
    authenticationRequired: 'Se requiere autenticación.',
    invalidPageToken: 'pageToken no es un token que devolvió esta lista.',
    notFound: 'No se encontró el mensaje de notificación.',
  },
};

export default esES;
