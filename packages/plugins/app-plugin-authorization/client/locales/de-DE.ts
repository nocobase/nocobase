import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
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
      inspect: 'Berechtigungen prüfen',
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
      inspector: 'Berechtigungsinspektor',
      'permission-sets': 'Berechtigungssätze',
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
