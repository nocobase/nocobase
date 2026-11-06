import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  channels: {
    inApp: 'In-App',
  },
  providers: {
    builtIn: 'Eingebaut',
  },
  errors: {
    authenticationRequired: 'Authentifizierung erforderlich.',
    invalidPageToken:
      'pageToken ist kein von dieser Liste zurückgegebenes Token.',
    notFound: 'Benachrichtigungsnachricht wurde nicht gefunden.',
  },
};

export default deDE;
