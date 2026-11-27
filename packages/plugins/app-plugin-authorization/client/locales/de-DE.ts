import auditLabels from '../../locales/de-DE.js';
import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';
import components from './components-en-US.js';
import settings from './settings-en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  audit: auditLabels.audit,
  // The Roles and permissions pages are not translated into this language yet and show in English.
  ...components,
  settings,
  permissionSets: {
    builtIn: {
      root: 'Systemadministrator',
      member: 'Mitglied',
    },
  },
  sections: {
    pages: 'Seitenberechtigungen',
    page: 'Seiten',
    business: 'Geschäftsgenehmigungen',
    administration: 'Verwaltung',
    other: 'Sonstiges',
  },
  options: {
    defaultAndSharing: 'Standarddatenbereich verwenden',
    actions: {
      assign: 'Aufgaben verwalten',
      configure: 'Konfigurieren',
      read: 'Lesen',
      create: 'Erstellen',
      update: 'Aktualisieren',
      delete: 'Löschen',
      access: 'Zugriff',
    },
    settingsModules: {
      authorization: 'Autorisierung',
    },
    pages: {
      all: 'Alle Seiten',
      allDescription:
        'Erlauben Sie den Zugriff auf jede Seite, einschließlich später hinzugefügter Seiten.',
    },
    settings: {
      'permission-sets': 'Berechtigungssätze',
      'authentication-settings': 'Anmeldung und Authentifizierung',
    },
    subjectTypes: {
      authenticated: 'Alle angemeldeten Benutzer',
      authenticatedDescription:
        'Gilt für jeden Benutzer mit einer gültigen angemeldeten Sitzung.',
      user: 'Benutzer',
    },
    recordAccessPolicies: {
      allRecords: 'Alle Datensätze',
      recordsIOwn: 'Aufzeichnungen, die ich besitze',
      recordsICreated: 'Von mir erstellte Datensätze',
      customFilter: 'Benutzerdefinierter Filter',
      customFilterHint:
        'Wählen Sie Datensätze mit einer benutzerdefinierten Filterbedingung aus.',
    },
  },
};

export default deDE;
