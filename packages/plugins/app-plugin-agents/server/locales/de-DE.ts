import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  access: {
    section: 'Agententeam',
    businessSection: 'Agententeam',
    businesses: {
      agents: {
        title: 'Agenten und Fähigkeiten',
        description:
          'Die Agenten des Teams und die von ihnen eingesetzten Fähigkeiten.',
        actions: {
          edit: {
            title: 'Change Agents und Fähigkeiten',
            description:
              'Ändern Sie die Einstellungen, Fähigkeiten und Variablen eines Agenten, archivieren, wiederherstellen und löschen Sie ihn und bearbeiten Sie Fähigkeiten. Einem Agenten werden keine Befugnisse eingeräumt, die über die des Herausgebers hinausgehen',
            related:
              'Agenten und Fähigkeiten ändern (Agenten, die sie besitzen, und Fähigkeiten, die sie erstellt haben)',
            relatedLabel:
              'Agenten, die ich besitze, und Fähigkeiten, die ich erstellt habe',
            relatedHint:
              'Agenten, deren Eigentümer ich bin, und von mir erstellte Fähigkeiten',
            all: 'Change Agents und Fähigkeiten (alle)',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: 'Agenten',
        runners: 'Laufzeitumgebungen',
        prices: 'Modellpreise',
        services: 'Musterdienste',
      },
    },
    actions: {
      read: 'Anzeigen',
      manage: 'Verwalten',
    },
    keyScopes: {
      agents: {
        title: 'Agenten',
        description:
          'Siehe Agenten, Fähigkeiten und Läufe; Agenten und Fähigkeiten ändern, Läufe abbrechen und wiederholen.',
      },
      runners: {
        title: 'Laufzeitumgebungen',
        description: 'Siehe Runner und Registrierungsmarken; Runner verwalten.',
      },
      prices: {
        title: 'Modellpreise',
        description:
          'Siehe die Modellpreise, anhand derer die Kosten geschätzt werden; ändere sie.',
      },
      services: {
        title: 'Musterdienste',
        description:
          'Sehen Sie sich die Modeldienste und die von ihnen angebotenen Models an, niemals deren Schlüssel.',
      },
    },
  },
  runnerConversation: {
    title: 'Unterhaltung: {{title}}',
    other: 'Unterhaltung einer anderen Person',
    untitled: 'Neue Unterhaltung',
  },
};

export default deDE;
