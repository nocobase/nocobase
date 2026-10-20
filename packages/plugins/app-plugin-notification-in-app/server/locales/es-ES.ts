import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  errors: {
    authenticationRequired: 'Se requiere autenticación.',
    invalidPageToken: 'pageToken no es un token que devolvió esta lista.',
    notFound: 'No se encontró el mensaje de notificación.',
  },
  test: {
    channels: {
      inApp: 'En la aplicación',
    },
    providers: {
      builtIn: 'Incorporado',
    },
    fields: {
      route: 'Ruta interna (sin prefijo de implementación)',
      url: 'Completo HTTP(S) URL',
      recipientUserId: 'ID de usuario del destinatario',
      title: 'Título',
      message: 'Mensaje',
    },
    placeholders: {
      currentUser: 'ID de usuario de la aplicación',
    },
    defaults: {
      title: 'Prueba de notificación NocoBase',
      body: 'Esta es una notificación de prueba de NocoBase.',
    },
  },
};

export default esES;
