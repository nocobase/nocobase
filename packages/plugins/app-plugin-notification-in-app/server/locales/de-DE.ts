import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  errors: {
    authenticationRequired: 'Authentifizierung erforderlich.',
    invalidPageToken:
      'pageToken ist kein von dieser Liste zurückgegebenes Token.',
    notFound: 'Benachrichtigungsnachricht wurde nicht gefunden.',
  },
  test: {
    channels: {
      inApp: 'In-App',
    },
    providers: {
      builtIn: 'Eingebaut',
    },
    fields: {
      route: 'Interne Route (ohne Bereitstellungspräfix)',
      url: 'Vollständig HTTP(S) URL',
      recipientUserId: 'Benutzer-ID des Empfängers',
      title: 'Titel',
      message: 'Nachricht',
    },
    placeholders: {
      currentUser: 'Anwendungsbenutzer-ID',
    },
    defaults: {
      title: 'NocoBase-Benachrichtigungstest',
      body: 'Dies ist eine Testbenachrichtigung von NocoBase.',
    },
  },
};

export default deDE;
