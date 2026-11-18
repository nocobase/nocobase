import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  roles: {
    owner: 'Verantwortlicher',
    admin: 'Admin',
    member: 'Mitglied',
  },
  access: {
    sections: {
      projects: 'Projekte',
      issues: 'Aufgaben',
      settings: 'Projekteinstellungen',
      members: 'Mitglieder und Rollen',
    },
    businesses: {
      projects: {
        title: 'Projekte',
        description: 'Projekte, ihre Mitglieder, Repositories und Fortschritt.',
        actions: {
          view: {
            title: 'Projekte anzeigen',
            description:
              'Sehen Sie sich Projekte, deren Überblick und Fortschritt an',
            related: 'Projekte anzeigen (die sie sehen können)',
            relatedLabel: 'Die, die ich sehen kann',
            relatedHint:
              'Öffentliche und private Projekte, die ich leite oder denen ich beigetreten bin',
            all: 'Projekte anzeigen (alle)',
          },
          create: {
            title: 'Projekte erstellen',
            description: 'Starten Sie ein neues Projekt und leiten Sie es',
            all: 'Projekte erstellen',
          },
          manage: {
            title: 'Projekte verwalten',
            description:
              'Umbenennen, Status, Daten und Lead ändern, Mitglieder und Repositories verwalten',
            related: 'Projekte verwalten (die sie leiten)',
            relatedLabel: 'Diejenigen, die ich führe',
            relatedHint: 'Projekte, deren Leiter ich bin',
            all: 'Projekte verwalten (alle)',
          },
          delete: {
            title: 'Projekte löschen',
            description: 'Projekte löschen und gelöschte wiederherstellen',
            all: 'Projekte löschen',
          },
        },
      },
      issues: {
        title: 'Aufgaben',
        description:
          'Aufgaben und ihre Kommentare, in einem Projekt oder eigenständig.',
        actions: {
          view: {
            title: 'Aufgaben ansehen',
            description: 'Aufgaben in Listen, Boards und ihren Details sehen',
            related: 'Aufgaben ansehen (sichtbare)',
            relatedLabel: 'In Projekten kann ich sehen',
            relatedHint:
              'Aufgaben ohne Projekt und Aufgaben in Projekten, die ich sehen kann',
            all: 'Aufgaben ansehen (alle)',
          },
          create: {
            title: 'Aufgaben erstellen',
            description:
              'Aufgaben erstellen, in einem Projekt oder eigenständig',
            related: 'Aufgaben erstellen (in sichtbaren Projekten)',
            relatedLabel: 'In Projekten kann ich sehen',
            relatedHint:
              'Aufgaben ohne Projekt oder in Projekten, die ich sehen kann',
            all: 'Aufgaben erstellen (alle)',
          },
          edit: {
            title: 'Aufgaben bearbeiten',
            description:
              'Titel, Beschreibung, Priorität, Daten, Etiketten, Bearbeiter und offene Status',
            related: 'Aufgaben bearbeiten (sichtbare)',
            relatedLabel: 'In Projekten kann ich sehen',
            relatedHint:
              'Aufgaben ohne Projekt und Aufgaben in Projekten, die ich sehen kann',
            all: 'Aufgaben bearbeiten (alle)',
          },
          comment: {
            title: 'Aufgaben kommentieren',
            description:
              'Threads kommentieren, antworten und auflösen; eigene Kommentare bearbeiten und löschen',
            related: 'Aufgaben kommentieren (sichtbare)',
            relatedLabel: 'In Projekten kann ich sehen',
            relatedHint:
              'Aufgaben ohne Projekt und Aufgaben in Projekten, die ich sehen kann',
            all: 'Aufgaben kommentieren (alle)',
          },
          moderateComments: {
            title: 'Moderate Kommentare',
            description: 'Kommentare anderer Personen löschen',
            related:
              'Kommentare moderieren (bei eigenen Aufgaben oder in geleiteten Projekten)',
            relatedLabel:
              'Bei meinen Aufgaben oder in Projekten, die ich leite',
            relatedHint:
              'Kommentare zu meinen Aufgaben und zu Aufgaben in Projekten, die ich leite',
            all: 'Moderate Kommentare (alle)',
          },
          close: {
            title: 'Aufgaben schließen',
            description: 'Eine Aufgabe als erledigt oder abgebrochen markieren',
            related: 'Aufgaben schließen (eigene oder in geleiteten Projekten)',
            relatedLabel:
              'Diejenigen, die ich besitze oder in Projekten, die ich leite',
            relatedHint:
              'Meine Aufgaben und Aufgaben in Projekten, die ich leite',
            all: 'Aufgaben schließen (alle)',
          },
          changeOwner: {
            title: 'Besitzer wechseln',
            description:
              'Eine Aufgabe an jemand anderen übergeben, der dafür verantwortlich ist',
            related:
              'Ändern Sie den Eigentümer (die Eigentümer oder deren Projekt sie leiten)',
            relatedLabel:
              'Diejenigen, die ich besitze oder in Projekten, die ich leite',
            relatedHint:
              'Meine Aufgaben und Aufgaben in Projekten, die ich leite',
            all: 'Besitzer wechseln (alle)',
          },
          delete: {
            title: 'Aufgaben löschen und wiederherstellen',
            description: 'Aufgaben löschen und gelöschte wiederherstellen',
            all: 'Aufgaben löschen und wiederherstellen',
          },
        },
      },
      attachments: {
        title: 'Anhänge',
        description: 'An Aufgaben und Kommentare angehängte Dateien.',
        actions: {
          upload: {
            title: 'Anhänge hochladen',
            description:
              'Dateien an Aufgaben, die sie bearbeiten dürfen, und an ihre Kommentare anhängen',
            related: 'Anhänge hochladen (bei sichtbaren Aufgaben)',
            relatedLabel: 'Bei Aufgaben in Projekten, die ich sehen kann',
            relatedHint:
              'Dateien bei Aufgaben ohne Projekt und bei Aufgaben in Projekten, die ich sehen kann',
            all: 'Anhänge hochladen (alle)',
          },
        },
      },
    },
    collections: {
      pmProjects: 'Projekte',
      pmIssues: 'Aufgaben',
    },
    recordAccess: {
      visible: 'Projekte und Aufgaben, die sie sehen können',
      managed:
        'Projekte, die sie leiten, und Aufgaben, für die sie verantwortlich sind',
    },
    settings: {
      pm: {
        general: 'Allgemein',
        labels: 'Etiketten',
        members: 'Mitglieder',
      },
    },
    keyScopes: {
      projects: {
        title: 'Projekte',
        description: 'Siehe Projekte; sie verwalten; erstellen und löschen.',
        objects: 'Projekte',
      },
      issues: {
        title: 'Aufgaben',
        description:
          'Aufgaben sehen; erstellen, bearbeiten, kommentieren, schließen und neu zuweisen; Kommentare moderieren und Aufgaben löschen.',
      },
      settings: {
        title: 'Projekteinstellungen',
        description: 'Allgemeine Einstellungen und Beschriftungen.',
      },
    },
    actions: {
      view: 'Anzeigen',
      create: 'Erstellen',
      manage: 'Verwalten',
      edit: 'Bearbeiten',
      close: 'Schließen',
      comment: 'Kommentar',
      moderateComments: 'Moderate Kommentare',
      changeOwner: 'Eigentümer wechseln',
      delete: 'Löschen',
      upload: 'Hochladen',
      read: 'Anzeigen',
      update: 'Bearbeiten',
      invite: 'Einladen',
      assign: 'Rollen zuweisen',
      'define-roles': 'Rollen definieren',
    },
  },
  notifications: {
    batchDone: 'Alle Unteraufgaben von {{identifier}} sind erledigt',
    batchDoneStage:
      'Phase {{stage}} der Unteraufgaben von {{identifier}} ist erledigt',
    commented: '{{actor}} hat {{identifier}} kommentiert',
    dependencyReleased:
      '{{releasedBy}} ist fertig, sodass {{identifier}} starten kann',
    executorAssigned: '{{actor}} hat Ihnen {{identifier}} zugewiesen',
    mentioned: {
      comment: '{{actor}} hat Sie auf {{identifier}} erwähnt',
      description: '{{actor}} hat Sie in {{identifier}} erwähnt',
    },
    ownerAssigned: '{{actor}} hat Sie zum Besitzer von {{identifier}} gemacht',
    someone: 'Jemand',
    statusChanged: '{{identifier}} wurde nach {{status}} verschoben',
    ownerNotified: '{{identifier}} ist jetzt {{status}}',
  },
  status: {
    backlog: 'Backlog',
    blocked: 'Blockiert',
    cancelled: 'Abgebrochen',
    done: 'Erledigt',
    in_progress: 'In Bearbeitung',
    in_review: 'In Prüfung',
  },
};

export default deDE;
