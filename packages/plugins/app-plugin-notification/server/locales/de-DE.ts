import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: 'Zugriff auf Benachrichtigungsprotokolle ist erforderlich.',
    logNotFound: 'Benachrichtigungsprotokoll nicht gefunden.',
  },
};

export default deDE;
