import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: 'Zugriff auf Benachrichtigungsprotokolle ist erforderlich.',
    logNotFound: 'Benachrichtigungsprotokoll nicht gefunden.',
    testHeaderRequired:
      'Der Anforderungsheader für den Benachrichtigungstest ist erforderlich.',
    testForbidden:
      'Die Berechtigung zum Senden von Benachrichtigungstests ist erforderlich.',
    testInvalidRequest:
      'Der Anforderungstext muss ein Testziel und Feldwerte enthalten.',
    testTargetUnavailable: 'Das Benachrichtigungstestziel ist nicht verfügbar.',
    testUnknownField: 'Unbekanntes Benachrichtigungstestfeld „{{name}}“.',
    testRequiredField: 'Benachrichtigungstestfeld „{{name}}“ ist erforderlich.',
    testFieldTooLong:
      'Das Benachrichtigungstestfeld „{{name}}“ darf höchstens {{maxLength}} Zeichen enthalten.',
    testFailed: 'Benachrichtigungstest fehlgeschlagen.',
    testNotFound: 'Der Benachrichtigungstest wurde nicht gefunden.',
  },
};

export default deDE;
