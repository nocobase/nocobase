import type { SchedulerResource } from './en-US.js';

const deDE: SchedulerResource = {
  // Titles the server registers with the authorization catalog, which resolve in this plugin's namespace.
  authorization: {
    title: 'Geplante Aufgaben',
    read: 'Lesen',
    manage: 'Verwalten',
  },
  nav: { automation: 'Automatisierung', schedules: 'Geplante Aufgaben' },
  page: {
    title: 'Geplante Aufgaben',
    description:
      'Aufgaben, die Plugins und die Anwendung im Code definieren und nach Zeitplan ausführen. Hier sehen Sie, wann sie laufen und wie jede Ausführung endete, und können sie pausieren oder fortsetzen. Ihre Regeln stehen im Code; diese Seite kann sie weder anlegen noch ändern.',
    loadFailed: 'Die geplanten Aufgaben konnten nicht geladen werden.',
    retry: 'Erneut versuchen',
    close: 'Schließen',
    copy: 'Kopieren',
    copied: 'Kopiert',
    loadMore: 'Mehr laden',
    none: '—',
    tabs: { tasks: 'Aufgaben', runs: 'Ausführungen', config: 'Konfiguration' },
  },
  tasks: {
    attention: {
      title_one: '{{count}} Eintrag erfordert Aufmerksamkeit',
      title_other: '{{count}} Einträge erfordern Aufmerksamkeit',
      target:
        'Das Ziel {{target}} von „{{title}}“ ist nicht verfügbar ({{state}}), daher wird jede Auslösung als übersprungen erfasst.',
      waiting:
        'Die Ausführung von „{{title}}“, gestartet {{time}}, wartet noch auf ihr Ergebnis.',
      failed: 'Die letzte Ausführung von „{{title}}“ endete mit {{status}}.',
    },
    stats: {
      total: 'Geplante Aufgaben',
      running: 'Aktiv',
      attention: 'Erfordern Aufmerksamkeit',
      next: 'Nächste Ausführung',
      nextOf: 'Nächste Ausführung · {{title}}',
    },
    filters: {
      all: 'Alle',
      running: 'Aktiv',
      attention: 'Erfordern Aufmerksamkeit',
      paused: 'Pausiert',
      removed: 'Aus dem Code entfernt',
      search: 'Nach Name oder Key suchen',
    },
    columns: {
      task: 'Aufgabe',
      rule: 'Regel',
      next: 'Nächste Ausführung',
      last: 'Letzte Ausführung',
      totals: 'Summen',
      state: 'Status',
      enabled: 'Aktiviert',
    },
    totals: '{{runs}} ausgeführt · {{succeeded}} erfolgreich',
    noMatch: 'Keine geplante Aufgabe entspricht diesen Filtern.',
    enable: '„{{title}}“ fortsetzen',
    disable: '„{{title}}“ pausieren',
    toggleFailed: 'Die geplante Aufgabe konnte nicht geändert werden.',
    readOnly:
      'Sie können geplante Aufgaben ansehen, aber nicht pausieren oder fortsetzen.',
    notes: {
      running:
        '„Aktiv“ bedeutet nur, dass die Aufgabe aktiviert ist und ihr Ziel existiert; ob die Arbeit gelungen ist, zeigt das Ergebnis jeder Ausführung. Die Summen zählen jede Auslösung, einschließlich Fehlschlägen und übersprungenen.',
      pause:
        'Pausieren wirkt sich nur auf spätere Ausführungen aus. Code-Updates und erneute Deployments lassen den Schalter unverändert.',
      removed:
        '„Aus dem Code entfernt“: Nach `scheduler sync --finalize` werden Aufgaben, die nicht mehr im Code stehen, so markiert; ihr Verlauf bleibt erhalten und sie können nicht fortgesetzt werden.',
      internal:
        'Interne Hintergrundjobs wie erneute Benachrichtigungsversuche, E-Mail-Synchronisierung, Wissensindizierung und das Aufräumen von Agent-Ausführungen werden hier nicht aufgeführt; ihre Plugins verwalten sie.',
    },
  },
  state: {
    running: 'Aktiv',
    paused: 'Pausiert',
    unavailable: 'Ziel nicht verfügbar',
    removed: 'Aus dem Code entfernt',
  },
  targetState: {
    ready: 'Verfügbar',
    disabled: 'Deaktiviert',
    missing: 'Fehlt',
    invalid: 'Ungültige Konfiguration',
  },
  pause: {
    title: '„{{title}}“ pausieren?',
    description:
      'Sie wird nicht mehr planmäßig ausgeführt, bis jemand sie fortsetzt.',
    running:
      'Bereits gestartete oder auf ein Ergebnis wartende Ausführungen werden nicht abgebrochen.',
    missed:
      'Nach dem Fortsetzen geht es mit dem nächsten geplanten Zeitpunkt weiter; während der Pause verpasste Ausführungen werden nicht nachgeholt.',
    redeploy: 'Ein erneutes Deployment setzt sie nicht fort.',
    limit:
      'Bei einer Aufgabe mit Ausführungslimit zählen die bisherigen Ausführungen weiter.',
    cancel: 'Abbrechen',
    confirm: 'Pausieren',
  },
  empty: {
    title: 'Noch keine geplanten Aufgaben',
    description:
      'Geplante Aufgaben werden von Plugins oder der Anwendung im Code mit `defineSchedule` definiert. Installieren Sie ein Plugin, das geplante Aufgaben definiert, oder definieren Sie eine in der Anwendung und starten Sie neu – dann erscheinen sie hier.',
    internal:
      'Interne Hintergrundjobs wie erneute Benachrichtigungsversuche, E-Mail-Synchronisierung und Wissensindizierung werden hier nicht aufgeführt; sie laufen weiter nach ihren eigenen Regeln.',
  },
  detail: {
    back: 'Geplante Aufgaben',
    notFound: 'Diese geplante Aufgabe existiert nicht.',
    key: 'Key',
    rule: 'Regel',
    upcoming: 'Nächste Ausführungen',
    noUpcoming: 'Keine geplant',
    window: 'Zeitraum · Ausführungslimit',
    unlimited: 'Unbegrenzt',
    windowFrom: 'ab {{time}}',
    windowTo: 'bis {{time}}',
    limit_one: '{{count}} Ausführung',
    limit_other: '{{count}} Ausführungen',
    target: 'Ziel',
    totals: 'Summen',
    source: 'Definiert in',
    sourceCode:
      'Code (`defineSchedule`). Um die Regel oder das Ziel zu ändern, ändern Sie den Code und deployen Sie erneut.',
    runs: 'Ausführungen',
    noRuns: 'Noch keine Ausführungen.',
    runsNote:
      'Ausführungen werden mit der neuesten zuerst aufgeführt. Die Zielkonfiguration einer Ausführung wird nie zurückgegeben oder angezeigt. Eine Zustellungsanzahl über 1 bedeutet, dass dieselbe Ausführung erneut zugestellt wurde; sie zählt dennoch als eine Ausführung.',
  },
  runs: {
    allTasks: 'Alle geplanten Aufgaben',
    groups: {
      all: 'Alle',
      failed: 'Fehlgeschlagen · Zeitüberschreitung',
      waiting: 'Wartet auf Ergebnis',
      skipped: 'Übersprungen',
      succeeded: 'Erfolgreich',
    },
    ranges: {
      day: 'Letzte 24 Stunden',
      week: 'Letzte 7 Tage',
      month: 'Letzte 30 Tage',
      quarter: 'Letzte 90 Tage',
    },
    columns: {
      planned: 'Geplante Zeit',
      task: 'Geplante Aufgabe',
      result: 'Ergebnis',
      reason: 'Grund · Bezug',
      executions: 'Zustellungen',
      duration: 'Dauer',
      summary: 'Ergebniszusammenfassung',
    },
    noRuns: 'Keine Ausführungen entsprechen diesen Filtern.',
    notes: {
      order:
        'Ausführungen aller geplanten Aufgaben, die neueste zuerst. Fehlschläge, Zeitüberschreitungen und lange Wartezeiten erscheinen auch oben im Tab Aufgaben.',
      removed: 'Aus dem Code entfernte Aufgaben behalten hier ihren Verlauf.',
    },
  },
  status: {
    pending: 'In Warteschlange',
    running: 'Läuft',
    waiting: 'Wartet auf Ergebnis',
    succeeded: 'Erfolgreich',
    failed: 'Fehlgeschlagen',
    skipped: 'Übersprungen',
    cancelled: 'Abgebrochen',
    timed_out: 'Zeitüberschreitung',
    triggered: 'Ausgelöst (älterer Eintrag)',
  },
  reason: {
    'target-missing': 'Das Ziel existiert nicht',
    'target-disabled': 'Das Ziel ist deaktiviert',
    'target-invalid': 'Die Konfiguration des Ziels ist ungültig',
    'target-not-found': 'Der Zieltyp ist nicht registriert',
    'invalid-config': 'Die Konfiguration des Ziels ist ungültig',
    'dispatch-failed': 'Beim Start fehlgeschlagen; siehe Serverprotokoll',
    'observer-failed':
      'Die Prüfung des Ergebnisses des Ziels ist fehlgeschlagen',
    'observer-unavailable': 'Das Ziel kann sein Ergebnis nicht melden',
  },
  run: {
    title: '{{title}} · {{time}}',
    timeline: 'Zeitverlauf',
    started: 'Gestartet',
    accepted: 'Vom Ziel angenommen',
    finished: 'Beendet',
    notYet: 'Noch kein Ergebnis',
    executions: 'Zustellungen',
    target: 'Ziel',
    related: 'Bezug',
    receipt: 'Empfangsbestätigung',
    summary: 'Ergebniszusammenfassung',
    reason: 'Grund',
    waitingNote:
      'Solange eine Ausführung auf ihr Ergebnis wartet, fragt der Scheduler das Ziel nach seinem Zustand, bis es Erfolg, Fehlschlag, Abbruch oder Zeitüberschreitung meldet. Der Scheduler setzt selbst kein Zeitlimit; das entscheidet das Ziel. Wartet eine Ausführung lange, öffnen Sie den zugehörigen Eintrag, um den Fortschritt zu sehen.',
  },
  config: {
    memory:
      'Geplante Aufgaben laufen im Speicher dieser Instanz: nur für eine einzelne Instanz geeignet.',
    memoryHint:
      'Bei einer Instanz ist nichts zu ändern; für mehrere folgen Sie „Zu Redis wechseln“ unten.',
    shared:
      'Geplante Aufgaben laufen auf {{adapter}}: mehrere Instanzen können sie ausführen.',
    columns: {
      setting: 'Einstellung',
      value: 'Aktueller Wert',
      effect: 'Auswirkung auf geplante Aufgaben',
      source: 'Quelle',
    },
    sources: {
      environment: 'Umgebungsvariable',
      config: 'config.yml',
      default: 'Standard',
      backend: 'Vom Backend festgelegt',
    },
    rows: {
      configuration: 'Jobs-Konfiguration',
      backend: 'Backend',
      multiInstance: 'Mehrere Instanzen',
      concurrency: 'Parallelität',
      attempts: 'Versuche',
      connection: 'Verbindung',
    },
    builtIn: 'Integrierter memory',
    selectedByScheduler:
      'Durch `scheduler.jobs` (`SCHEDULER_JOBS`) eigens für geplante Aufgaben gewählt.',
    selectedByDefault:
      '`scheduler.jobs` ist nicht gesetzt, daher folgen geplante Aufgaben `jobs.default`.',
    selectedByBuiltIn:
      'Weder `scheduler.jobs` noch `jobs.default` ist gesetzt, daher gilt der integrierte Standard.',
    memoryBackend: 'memory (diese Instanz)',
    memoryEffect:
      'Die Regeln liegen im Speicher dieses Prozesses und werden bei normalem Beenden nach {{path}} geschrieben.',
    sharedEffect:
      'Die Regeln liegen in {{adapter}}, gemeinsam für alle Instanzen.',
    plugin: '{{plugin}} registriert',
    supported: 'Unterstützt',
    unsupported: 'Nicht unterstützt',
    multiSupported:
      'Jede Auslösung läuft auf genau einer Instanz; stürzt eine Instanz ab, kann eine Ausführung gelegentlich erneut zugestellt werden.',
    multiUnsupported:
      'Jede Instanz führt jede geplante Aufgabe selbst aus, daher läuft dieselbe Aufgabe mehrfach.',
    concurrencyEffect_one:
      'Eine Ausführung gleichzeitig; eine langsame Ausführung lässt andere fällige warten.',
    concurrencyEffect_other:
      'Bis zu {{count}} Ausführungen gleichzeitig; weitere warten in der Schlange.',
    attemptsOk: 'Korrekt',
    attemptsWarn: 'Sollte 1 sein',
    attemptsEffect:
      'Eine fehlgeschlagene Ausführung wird als fehlgeschlagen erfasst und die Aufgabe läuft zum nächsten Zeitpunkt erneut; belassen Sie den Wert bei 1.',
    attemptsWarnEffect:
      'Eine fehlgeschlagene Ausführung ist bereits erfasst, daher bewirkt ein Wiederholen derselben Ausführung nichts; setzen Sie die Versuche auf 1.',
    connectionValue: '{{connection}} · namespace {{namespace}}',
    namespaceOnly: 'namespace {{namespace}}',
    connectionEffect: 'Das Passwort wird nie angezeigt.',
    redis: {
      title: 'Zu Redis wechseln (für mehrere Instanzen)',
      step1:
        'Installieren Sie das kommerzielle Plugin `@nocobase/app-plugin-jobs-redis` und registrieren Sie es auf jeder Instanz.',
      step2:
        'Fügen Sie in `config.yml` ein Redis-Backend hinzu und lassen Sie die geplanten Aufgaben darauf verweisen (Ausschnitt unten).',
      step3:
        'Deployen Sie alle Instanzen erneut, kommen Sie dann zurück und prüfen Sie, dass „Mehrere Instanzen“ Unterstützt anzeigt.',
      warning:
        'Ist der Name falsch, das Plugin nicht registriert oder Redis nicht erreichbar, startet die Anwendung nicht; sie fällt nie auf memory zurück.',
    },
    removed: {
      title: 'Aus dem Code entfernte geplante Aufgaben',
      consistent: 'Konsistent, nichts zu tun.',
      consistentHint:
        'Wird eine geplante Aufgabe aus dem Code gelöscht und deployt, erscheint sie hier mit einer Anleitung zum Aufräumen.',
      warning_one:
        '{{count}} geplante Aufgabe ist nicht mehr im Code dieser Version, wurde aber noch nicht aufgeräumt.',
      warning_other:
        '{{count}} geplante Aufgaben sind nicht mehr im Code dieser Version, wurden aber noch nicht aufgeräumt.',
      warningHint:
        'Sie laufen bei Fälligkeit nicht (das Protokoll zeigt „A schedule fired that this instance has no definition for“), die Aufgabenliste zeigt sie aber wie gewohnt an.',
      columns: {
        task: 'Geplante Aufgabe',
        last: 'Letzte Ausführung',
        after: 'Nach dem Aufräumen',
      },
      after:
        'Als „Aus dem Code entfernt“ markiert, wird nie wieder ausgelöst, Verlauf bleibt erhalten.',
      neverRan: 'Nie ausgeführt',
      how: 'So räumen Sie auf',
      howHint:
        'Sobald alle Instanzen die neue Version ausführen, führen Sie dies einmal auf einem beliebigen Server aus:',
      why: 'Warum nicht automatisch: Während eines Rolling Deployments laufen alte und neue Versionen nebeneinander, und ein automatisches Aufräumen könnte Aufgaben entfernen, die die alte Version noch nutzt.',
      full: 'Führen Sie es nur auf einem vollständigen Build mit allen Plugins aus; andernfalls werden auch die Aufgaben nicht geladener Plugins als entfernt markiert.',
    },
    readOnly:
      'Diese Seite ist schreibgeschützt: Diese Einstellungen stehen in der Konfiguration der Anwendung und werden beim erneuten Deployment wirksam. Caches, Warteschlangen und andere Dienste werden in den Cluster- und verteilten Einstellungen behandelt.',
  },
  cron: {
    everyMinute: 'Jede Minute',
    everyMinutes: 'Alle {{count}} Minuten',
    everyHour: 'Stündlich zur Minute {{minute}}',
    everyHours: 'Alle {{count}} Stunden',
    daily: 'Täglich um {{time}}',
    weekdays: 'Montags bis freitags um {{time}}',
    weekly: 'Jeden {{day}} um {{time}}',
    monthly: 'Am {{day}}. jeden Monats um {{time}}',
  },
};

export default deDE;
