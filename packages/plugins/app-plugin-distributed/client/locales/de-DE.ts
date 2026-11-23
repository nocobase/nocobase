import type { DistributedResource } from './en-US.js';

const deDE: DistributedResource = {
  view: {
    deployment: 'Bereitstellungsmodus',
    multi: 'Mehrere Instanzen',
    configuration: 'Aktuelle Konfiguration',
    checks: 'Prüfung für mehrere Instanzen',
    backends: 'Dienst-Backends',
    readiness: 'Prüfung vor der Skalierung',
    pending: 'Zu bearbeiten',
    all: 'Alle',
    empty: 'Keine offenen Prüfpunkte.',
    blockers: 'Zu beheben · {{count}}',
    scope:
      'Konfiguration dieser Instanz. Nach Änderungen an der Anwendungskonfiguration erneut bereitstellen.',
  },
  nav: {
    title: 'Cluster und Verteilung',
    description:
      'Welche Backends diese Instanz nutzt und ob die Anwendung auf mehreren Instanzen laufen kann.',
  },
  page: {
    description:
      'Um auf mehreren Servern oder Prozessen zu laufen, müssen Cache, Sperren, Hintergrundjobs, Warteschlangen, Echtzeitnachrichten und ID-Generierung gemeinsame Backends nutzen. Diese Seite zeigt die Backends, die diese Instanz tatsächlich ausgewählt hat, und woher jede Einstellung stammt, und prüft, ob die Anwendung sicher auf mehreren Instanzen laufen kann. Die Einstellungen befinden sich in der Anwendungskonfiguration; stellen Sie nach einer Änderung neu bereit.',
    loading: 'Wird geladen…',
    loadFailed: 'Der Status konnte nicht geladen werden.',
    retry: 'Erneut versuchen',
  },
  summary: {
    single: 'Einzelne Instanz',
    singleCaption: 'Die aktuelle Konfiguration passt für eine Instanz',
    singleBlockedCaption: 'Auch für eine Instanz gibt es Punkte zu beheben',
    shared: '{{shared}} / {{total}}',
    sharedCaption: 'Dienste gemeinsam genutzt',
    requiredCaption: 'zu beheben',
    recommendedCaption: 'empfohlen',
  },
  sections: {
    scale: 'Kann sie auf mehreren Instanzen laufen?',
    services: 'Gemeinsame Dienste',
    idGeneration: 'ID-Generierung',
    checklist: 'Vor dem Go-live',
    notes: 'Hinweise',
  },
  level: {
    required: 'Erforderlich',
    recommended: 'Empfohlen',
    ok: 'OK',
  },
  singleBlocked:
    'Auch mit nur einer Instanz müssen die unten als „Beheben“ markierten Punkte erledigt werden.',
  singleHint:
    'Für eine einzelne Instanz ist keine Änderung nötig. Zum Skalieren: Redis und eine gemeinsame PostgreSQL- oder MySQL-Datenbank bereitstellen → die benötigten Redis-Plugins installieren → die Konfiguration ändern → mit zwei Instanzen prüfen.',
  fix: 'So beheben Sie es',
  table: {
    service: 'Dienst',
    backend: 'Ausgewähltes Backend',
    sharing: 'Geltungsbereich',
    plugin: 'Redis-Plugin',
    source: 'Quelle',
    adapter: 'Adapter',
  },
  services: {
    caching: {
      name: 'Cache',
      usage: 'Anmeldestatus, Berechtigungen, Konfigurationscache',
    },
    concurrency: {
      name: 'Nebenläufigkeitssperren',
      usage: 'Migrationen, Nummerierung, Idempotenz',
    },
    jobs: {
      name: 'Hintergrundjobs',
      usage: 'Geplante Aufgaben, Wissensindexierung',
    },
    queue: {
      name: 'Warteschlange',
      usage: 'Zustellung von Benachrichtigungen',
    },
    realtime: {
      name: 'Echtzeitnachrichten',
      usage: 'Posteingang, Anwesenheit',
    },
  },
  sharing: {
    shared: 'Zwischen Instanzen geteilt',
    local: 'Nur diese Instanz',
    unknown: 'Nicht deklariert',
  },
  source: { configured: 'Konfiguriert', default: 'Standard' },
  notSet: '(nicht gesetzt)',
  unavailable: 'Von dieser Anwendung nicht genutzt',
  unregistered: 'Adapter nicht registriert',
  selections: 'Nach Name ausgewählt',
  selection: '{{consumer}} → {{backend}}',
  howToChange: 'So ändern Sie es',
  howToChangeIntro:
    'Installieren Sie das Redis-Plugin jedes Dienstes, registrieren Sie dessen Server-Plugin und wählen Sie es dann in der Konfiguration aus:',
  idGeneration: {
    mode: 'Modus',
    modeHint:
      'Weisen Sie bei mehreren Instanzen die Worker-IDs automatisch zu, damit jede Instanz ihre eigene erhält.',
    auto: 'Automatisch · eine Worker-ID pro Instanz',
    manual: 'Manuell · workerId {{workerId}}',
  },
  checklist: {
    intro:
      'Diese Punkte kann die Seite nicht selbst prüfen. Bestätigen Sie sie durch Aktionen auf zwei Instanzen:',
    files:
      'Eine auf Instanz A hochgeladene Datei lässt sich von Instanz B herunterladen',
    realtime:
      'Eine auf A erzeugte Nachricht erreicht einen mit B verbundenen Benutzer in Echtzeit, und nach dem erneuten Verbinden geht nichts verloren',
    queue:
      'Eine auf A eingereihte Aufgabe kann von B verarbeitet werden, und Wiederholungen lösen keine Nebenwirkungen erneut aus',
    secrets:
      'Alle Instanzen verwenden dieselben secrets.keys, und die Anmeldung funktioniert instanzübergreifend',
    websocket:
      'Der Load Balancer leitet WebSocket-Verbindungen weiter und passt zu Pfad und Domain der Anwendung',
  },
  notes: {
    current:
      'Diese Seite zeigt nur die Instanz, mit der Sie verbunden sind. Sie kann nicht erkennen, ob andere Instanzen gleich konfiguriert sind; stellen Sie sie aus einer gemeinsamen Konfiguration bereit.',
    noTest:
      'Es gibt keinen „Verbindungstest“: Redis-Plugins verbinden sich beim Start der Anwendung, und die Anwendung startet nicht, wenn dies fehlschlägt. Verbindungsfehler während des Betriebs erscheinen in den Protokollen.',
    instances:
      'Eine Liste der laufenden Instanzen erscheint nur bei automatischen Worker-IDs, die ein kommerzielles Plugin bereitstellt.',
  },
  checks: {
    database: {
      sqlite: {
        title: 'Datenbank',
        detail:
          'SQLite bedient nur eine Instanz. Mehrere Instanzen benötigen PostgreSQL oder MySQL.',
        fix: 'Migrieren Sie die Daten nach PostgreSQL oder MySQL und richten Sie die Hauptdatenbankverbindung darauf aus.',
      },
      shared: {
        title: 'Datenbank',
        detail:
          '{{dialect}} kann von mehreren Instanzen gemeinsam genutzt werden. Prüfen Sie vor dem Go-live, dass alle Instanzen mit derselben Datenbank verbunden sind.',
      },
    },
    service: {
      unregistered: {
        title: '{{service}}',
        detail:
          '{{configPath}} wählt den Adapter „{{adapter}}“, den kein registriertes Plugin bereitstellt. Der Dienst schlägt bei der ersten Verwendung fehl.',
        fix: 'Installieren und registrieren Sie das Plugin, das „{{adapter}}“ bereitstellt, oder wählen Sie ein anderes Backend.',
      },
      local: {
        title: '{{service}} ist noch lokal auf dieser Instanz',
        detail:
          'Jede Instanz hält ihren eigenen Zustand. Installieren Sie {{plugin}} und setzen Sie {{configPath}} auf ein Redis-Backend.',
        fix: 'Installieren Sie {{plugin}}, registrieren Sie dessen Server-Plugin und wählen Sie es aus:',
      },
      undeclared: {
        title: '{{service}}',
        detail:
          'Der Adapter „{{adapter}}“ gibt nicht an, ob er zwischen Instanzen geteilt wird. Klären Sie das mit dem Plugin, das ihn bereitstellt.',
      },
      selectionUndeclared: {
        title: '{{service}}',
        detail:
          '{{consumer}} verwendet ausdrücklich das Backend „{{backend}}“, dessen Adapter nicht angibt, ob es zwischen Instanzen geteilt wird. Klären Sie das mit dem bereitstellenden Plugin.',
      },
      selectionLocal: {
        title: '{{service}}',
        detail:
          '{{consumer}} verwendet ausdrücklich das Backend „{{backend}}“, das lokal auf dieser Instanz ist.',
      },
    },
    services: {
      local: {
        title:
          'Cache, Sperren, Hintergrundjobs, Warteschlange, Echtzeitnachrichten',
        detail: 'Alles lokal auf dieser Instanz: {{services}}.',
      },
    },
    files: {
      local: {
        title: 'Dateispeicher',
        detail:
          'Dateien in {{collections}} liegen auf der Festplatte dieses Hosts; andere Instanzen können sie nicht lesen.',
        fix: 'Verwenden Sie für diese Dateisammlungen einen gemeinsamen Speicher wie S3 und verschieben Sie die vorhandenen Dateien dorthin.',
      },
      defaultLocal: {
        title: 'Dateispeicher',
        detail:
          'Der Standardspeicher legt Dateien auf der Festplatte dieses Hosts ab; andere Instanzen können sie nicht lesen.',
        fix: 'Legen Sie einen gemeinsamen Speicher wie S3 als Standardspeicher fest.',
      },
      shared: {
        title: 'Dateispeicher',
        detail:
          'Keine Dateisammlung legt Dateien auf der Festplatte dieses Hosts ab.',
      },
      unchecked: {
        title: 'Dateispeicher',
        detail:
          'Die Dateisammlungen der Verbindungen {{connections}} konnten nicht gelesen werden; ob sie Dateien auf der Festplatte dieses Hosts speichern, ist unbekannt.',
      },
    },
    idGeneration: {
      auto: {
        title: 'ID-Generierung',
        detail:
          'Automatisch zugewiesen: Jede Instanz erhält ihre eigene Worker-ID.',
      },
      manual: {
        title: 'ID-Generierung',
        detail:
          'Manuelle Worker-ID {{workerId}}. Zwei Instanzen mit derselben Worker-ID können dieselben IDs erzeugen.',
        fix: 'Geben Sie jeder Instanz eine eigene SNOWFLAKE_WORKER_ID oder installieren Sie ein Plugin, das Worker-IDs automatisch zuweist.',
      },
    },
    secrets: {
      set: {
        title: 'Geheimnisse',
        detail:
          'secrets.keys ist gesetzt. Stellen Sie sicher, dass alle Instanzen dieselben Schlüssel verwenden.',
      },
      missing: {
        title: 'Geheimnisse',
        detail:
          'secrets.keys ist nicht gesetzt. Alle Instanzen benötigen dieselben Schlüssel, um zu lesen, was die anderen verschlüsseln.',
        fix: 'Erzeugen Sie einen Schlüssel mit openssl rand -hex 32 und setzen Sie ihn auf allen Instanzen.',
      },
    },
    publicOrigin: {
      invalid: {
        title: 'Öffentliche Adresse',
        detail:
          'app.publicOrigin ist gesetzt, aber keine http- oder https-Adresse.',
        fix: 'Setzen Sie app.publicOrigin auf die Adresse, die Benutzer öffnen, etwa https://apps.example.com.',
      },
      set: {
        title: 'Öffentliche Adresse',
        detail: 'app.publicOrigin = {{origin}}',
      },
      missing: {
        title: 'Öffentliche Adresse',
        detail:
          'app.publicOrigin ist nicht gesetzt. Hinter einem Load Balancer benötigen Links und Callbacks die öffentliche Adresse.',
        fix: 'Setzen Sie app.publicOrigin auf die Adresse, die Benutzer öffnen.',
      },
    },
    checkFailed: {
      title: 'Eine Prüfung konnte nicht ausgeführt werden',
      detail: 'Die Prüfung „{{check}}“ ist fehlgeschlagen; siehe Protokolle.',
    },
  },
};

export default deDE;
