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
      issues: 'Vorgänge',
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
        title: 'Vorgänge',
        description: 'Issues und deren Kommentare, im Projekt oder alleine.',
        actions: {
          view: {
            title: 'Probleme anzeigen',
            description:
              'Sehen Sie sich Probleme in Listen, Foren und deren Details an',
            related: 'Probleme anzeigen (die sie sehen können)',
            relatedLabel: 'In Projekten kann ich sehen',
            relatedHint:
              'Probleme ohne Projekt und Probleme in Projekten, die ich sehen kann',
            all: 'Probleme anzeigen (alle)',
          },
          create: {
            title: 'Erstellen Sie Probleme',
            description:
              'Erstellen Sie Probleme, in einem Projekt oder alleine',
            related: 'Probleme erstellen (in Projekten, die sie sehen können)',
            relatedLabel: 'In Projekten kann ich sehen',
            relatedHint:
              'Probleme ohne Projekt oder in Projekten, die ich sehen kann',
            all: 'Probleme erstellen (alle)',
          },
          edit: {
            title: 'Probleme bearbeiten',
            description:
              'Titel, Beschreibung, Priorität, Daten, Labels, Ausführende und offene Status',
            related: 'Probleme bearbeiten (die sie sehen können)',
            relatedLabel: 'In Projekten kann ich sehen',
            relatedHint:
              'Probleme ohne Projekt und Probleme in Projekten, die ich sehen kann',
            all: 'Probleme bearbeiten (alle)',
          },
          comment: {
            title: 'Kommentar zu Problemen',
            description:
              'Threads kommentieren, antworten und auflösen; eigene Kommentare bearbeiten und löschen',
            related: 'Kommentieren Sie Probleme (die sie sehen können)',
            relatedLabel: 'In Projekten kann ich sehen',
            relatedHint:
              'Probleme ohne Projekt und Probleme in Projekten, die ich sehen kann',
            all: 'Kommentar zu Problemen (alle)',
          },
          moderateComments: {
            title: 'Moderate Kommentare',
            description: 'Kommentare anderer Personen löschen',
            related:
              'Moderieren Sie Kommentare (zu Themen, die ihnen gehören oder deren Projekt sie leiten)',
            relatedLabel:
              'Zu Themen, die mir gehören, oder in Projekten, die ich leite',
            relatedHint:
              'Kommentare zu Issues, die mir gehören, und zu Issues in Projekten, die ich leite',
            all: 'Moderate Kommentare (alle)',
          },
          close: {
            title: 'Probleme schließen',
            description:
              'Markieren Sie ein Problem als erledigt oder abgebrochen',
            related:
              'Probleme schließen (die sie besitzen oder deren Projekt sie leiten)',
            relatedLabel:
              'Diejenigen, die ich besitze oder in Projekten, die ich leite',
            relatedHint:
              'Vorgänge, die mir gehören, und Vorgänge in Projekten, die ich leite',
            all: 'Probleme schließen (alle)',
          },
          changeOwner: {
            title: 'Besitzer wechseln',
            description:
              'Übergeben Sie ein Problem an jemand anderen, der dafür verantwortlich ist',
            related:
              'Ändern Sie den Eigentümer (die Eigentümer oder deren Projekt sie leiten)',
            relatedLabel:
              'Diejenigen, die ich besitze oder in Projekten, die ich leite',
            relatedHint:
              'Vorgänge, die mir gehören, und Vorgänge in Projekten, die ich leite',
            all: 'Besitzer wechseln (alle)',
          },
          delete: {
            title: 'Probleme beim Löschen und Wiederherstellen',
            description: 'Probleme löschen und gelöschte wiederherstellen',
            all: 'Probleme beim Löschen und Wiederherstellen',
          },
        },
      },
      attachments: {
        title: 'Anhänge',
        description: 'An Probleme und Kommentare angehängte Dateien.',
        actions: {
          upload: {
            title: 'Anhänge hochladen',
            description:
              'Hängen Sie Dateien an Probleme an, die sie bearbeiten können, und an ihre Kommentare',
            related: 'Anhänge hochladen (zu Problemen, die sie sehen können)',
            relatedLabel: 'Zu Problemen in Projekten kann ich sehen',
            relatedHint:
              'Dateien zu Problemen ohne Projekt und zu Problemen in Projekten, die ich sehen kann',
            all: 'Anhänge hochladen (alle)',
          },
        },
      },
    },
    collections: {
      pmProjects: 'Projekte',
      pmIssues: 'Vorgänge',
    },
    recordAccess: {
      visible: 'Projekte und Probleme, die sie sehen können',
      managed:
        'Projekte, die sie leiten, und Issues, deren Eigentümer sie sind',
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
        title: 'Vorgänge',
        description:
          'Siehe Probleme; erstellen, bearbeiten, kommentieren, schließen und neu zuordnen; Kommentare moderieren und Probleme löschen.',
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
    batchDone: 'Alle Unterausgaben von {{identifier}} sind abgeschlossen',
    batchDoneStage:
      'Stufe {{stage}} der Unterausgaben von {{identifier}} ist abgeschlossen',
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
    backlog: 'Rückstand',
    blocked: 'Blockiert',
    cancelled: 'Abgebrochen',
    done: 'Erledigt',
    in_progress: 'In Bearbeitung',
    in_review: 'In Prüfung',
  },
};

export default deDE;
