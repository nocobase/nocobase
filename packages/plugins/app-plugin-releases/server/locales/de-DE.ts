import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  access: {
    section: 'Releases',
    pages: {
      'rel-apps': 'Apps',
    },
    businessSection: 'Releases',
    businesses: {
      apps: {
        title: 'Apps',
        description:
          'Apps, ihre Veröffentlichungen, Bereitstellungen und Laufzeit.',
        actions: {
          view: {
            title: 'Apps anzeigen',
            description:
              'Siehe Apps, ihre Releases, Bereitstellungen und Laufzeitstatus',
            related: 'Apps anzeigen (die damit verbundenen)',
            relatedLabel: 'Die, die ich erschaffen habe',
            relatedHint:
              'Apps, die ich erstellt habe, und alle Apps, die sich auf mich beziehen',
            all: 'Apps anzeigen (alle)',
          },
          readLogs: {
            title: 'Protokolle lesen',
            description: 'App- und Bereitstellungsprotokolle lesen',
            related: 'Protokolle lesen (die damit verbundenen)',
            relatedLabel: 'Die, die ich erschaffen habe',
            relatedHint:
              'Apps, die ich erstellt habe, und alle Apps, die sich auf mich beziehen',
            all: 'Protokolle lesen (alle)',
          },
          create: {
            title: 'Apps erstellen',
            description: 'Erstellen Sie Apps in einer Umgebung',
            all: 'Apps erstellen',
          },
          configure: {
            title: 'Apps konfigurieren',
            description:
              'Lesen und ändern Sie die Konfiguration einer App, die möglicherweise Geheimnisse birgt',
            related: 'Apps konfigurieren (die damit verbundenen)',
            relatedLabel: 'Die, die ich erschaffen habe',
            relatedHint:
              'Apps, die ich erstellt habe, und alle Apps, die sich auf mich beziehen',
            all: 'Apps konfigurieren (alle)',
          },
          upload: {
            title: 'Veröffentlichungen hochladen',
            description: 'Veröffentlichungen hochladen und bewerben',
            related: 'Veröffentlichungen hochladen (die damit verbundenen)',
            relatedLabel: 'Die, die ich erschaffen habe',
            relatedHint:
              'Apps, die ich erstellt habe, und alle Apps, die sich auf mich beziehen',
            all: 'Veröffentlichungen hochladen (alle)',
          },
          deploy: {
            title: 'Bereitstellen',
            description:
              'Bereitstellung und Rollback in ungeschützten Umgebungen, Anforderung von Bereitstellungen in geschützten Umgebungen',
            related: 'Deploy (die damit verbundenen)',
            relatedLabel: 'Die, die ich erschaffen habe',
            relatedHint:
              'Apps, die ich erstellt habe, und alle Apps, die sich auf mich beziehen',
            all: 'Bereitstellen (alle)',
          },
          deployProtected: {
            title: 'Geschützte Bereitstellungen genehmigen',
            description:
              'Genehmigen Sie Bereitstellungen in geschützten Umgebungen, in denen keine Genehmiger benannt sind. Nur Menschen',
            related:
              'Geschützte Bereitstellungen genehmigen (die damit verbundenen)',
            relatedLabel: 'Die, die ich erschaffen habe',
            relatedHint:
              'Apps, die ich erstellt habe, und alle Apps, die sich auf mich beziehen',
            all: 'Geschützte Bereitstellungen genehmigen (alle)',
          },
          operate: {
            title: 'Starten und stoppen',
            description: 'Apps starten, stoppen und neu starten',
            related: 'Start und Stopp (die damit verbundenen)',
            relatedLabel: 'Die, die ich erschaffen habe',
            relatedHint:
              'Apps, die ich erstellt habe, und alle Apps, die sich auf mich beziehen',
            all: 'Start und Stopp (alle)',
          },
          delete: {
            title: 'Apps löschen',
            description: 'Löschen Sie eine App mit ihren Daten',
            related: 'Apps löschen (die damit verbundenen)',
            relatedLabel: 'Die, die ich erschaffen habe',
            relatedHint:
              'Apps, die ich erstellt habe, und alle Apps, die sich auf mich beziehen',
            all: 'Apps löschen (alle)',
          },
        },
      },
    },
    recordAccess: {
      owned: 'Apps, die sie erstellt haben',
    },
    settings: {
      rel: {
        environments: 'Umgebungen bereitstellen',
      },
    },
    keyScopes: {
      apps: {
        title: 'Apps und Bereitstellungen',
        description:
          'Lesen: Apps, Releases, Bereitstellungen und Protokolle anzeigen. Lesen und schreiben: auch Veröffentlichungen hochladen. Admin: Apps auch bereitstellen und starten oder stoppen.',
        objects: 'Apps',
      },
      environments: {
        title: 'Umgebungen bereitstellen',
        description:
          'Lesen: Umgebungen auflisten. Lesen und schreiben: Verwalten Sie sie.',
      },
      presets: {
        ciDeploy: {
          title: 'CI-Bereitstellung',
          description:
            'Laden Sie Releases auf die ausgewählten Apps hoch und stellen Sie sie 90 Tage lang bereit.',
        },
        ciUpload: {
          title: 'CI-Upload',
          description:
            'Laden Sie 90 Tage lang Releases auf die ausgewählten Apps hoch, ohne sie bereitzustellen.',
        },
      },
    },
    actions: {
      read: 'Anzeigen',
      manage: 'Verwalten',
      view: 'Anzeigen',
      'read-logs': 'Protokolle lesen',
      create: 'Erstellen',
      configure: 'Konfigurieren',
      upload: 'Veröffentlichungen hochladen',
      deploy: 'Bereitstellen',
      'deploy-protected': 'Geschützte Bereitstellungen genehmigen',
      operate: 'Starten und stoppen',
      delete: 'Löschen',
    },
  },
  drivers: {
    host: 'Dieser Server',
  },
};

export default deDE;
