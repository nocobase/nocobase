import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  errors: {
    authenticationRequired: 'Authentification requise.',
    invalidPageToken: "pageToken n'est pas un jeton renvoyé par cette liste.",
    notFound: 'Le message de notification est introuvable.',
  },
  test: {
    channels: {
      inApp: "Dans l'application",
    },
    providers: {
      builtIn: 'Intégré',
    },
    fields: {
      route: 'Route interne (sans préfixe de déploiement)',
      url: 'HTTP complet(S) URL',
      recipientUserId: 'ID utilisateur du destinataire',
      title: 'Titre',
      message: 'Message',
    },
    placeholders: {
      currentUser: "ID utilisateur de l'application",
    },
    defaults: {
      title: 'Test de notification NocoBase',
      body: "Il s'agit d'une notification de test provenant de NocoBase.",
    },
  },
};

export default frFR;
