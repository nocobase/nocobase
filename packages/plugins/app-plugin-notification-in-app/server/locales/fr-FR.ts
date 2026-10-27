import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  channels: {
    inApp: "Dans l'application",
  },
  providers: {
    builtIn: 'Intégré',
  },
  errors: {
    authenticationRequired: 'Authentification requise.',
    invalidPageToken: "pageToken n'est pas un jeton renvoyé par cette liste.",
    notFound: 'Le message de notification est introuvable.',
  },
};

export default frFR;
