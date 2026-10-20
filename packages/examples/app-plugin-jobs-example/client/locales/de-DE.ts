import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  authorization: {
    title: 'Beispielzeitpläne für Jobs',
    update: 'Start- und Stoppregeln',
  },
  navigation: {
    group: 'Jobs-Beispiel',
    jobs: 'Einmalige Aufträge',
    schedules: 'Zeitpläne',
  },
  jobs: {
    title: 'Hintergrundjobs',
    description:
      'Jeder Job wartet in der Warteschlange, arbeitet dann zehn Sekunden lang und meldet jede Sekunde 10 % des Fortschritts. Während diese Seite geöffnet ist, wird über WebSocket ein Fortschritt erzielt.',
    create: 'Job erstellen',
    creating: 'Erstellen…',
    listTitle: 'Ihre Jobs',
    count: '{{count}}-Jobs',
    empty:
      'Noch keine Jobs. Erstellen Sie eine, um den Fortschritt zu beobachten.',
    loading: 'Wird geladen…',
    job: 'Auftrag {{id}}',
    createdAt: '{{time}} erstellt',
    attempt: 'Versuch {{attempt}}',
    progress: 'Fortschritt',
    live: 'Live',
    offline: 'Verbindung wird wiederhergestellt',
  },
  schedules: {
    title: 'Zeitpläne',
    description:
      'Wiederkehrende Regeln für einen ScheduleExecutor. Jede Regel, die diese Seite starten kann, ist im Code definiert, sodass ihr Handler registriert wird, bevor der Executor startet – eine Regel, die vor einem Neustart gestartet wurde, läuft danach weiter. Während diese Seite geöffnet ist, werden Änderungen über WebSocket vorgenommen.',
    listTitle: 'Regeln',
    loading: 'Wird geladen…',
    start: 'Starten',
    stop: 'Stoppen',
    builtIn: 'Eingebaut',
    every: 'Alle {{seconds}}s',
    cron: 'Cron {{cron}} (UTC)',
    limit: 'höchstens {{limit}}-Zeiten',
    nextRun: 'Nächster Lauf in {{seconds}}s',
    nextRunDue: 'Der nächste Lauf ist jetzt fällig',
    noNextRun: 'Keine weiteren Läufe',
    firings: '{{count}} wird auf dieser Instanz ausgeführt',
    delay: '{{ms}} ms zu spät gestartet',
    noRuns: 'Noch keine Läufe.',
    live: 'Live',
    offline: 'Verbindung wird wiederhergestellt',
    rule: {
      heartbeat: 'Herzschlag',
      interval: 'Intervall',
      limited: 'Begrenzt',
      cron: 'Cron',
    },
    ruleDescription: {
      heartbeat:
        'Das Plugin schreibt diese Regel bei jedem Start und stoppt sie nie.',
      interval:
        'Schalten Sie das Intervall um, während es läuft; Der nächste Lauf ist ab dem neuen geplant.',
      limited:
        'Endet von selbst nach fünf Durchläufen. Beginnen Sie noch einmal fünf Mal damit.',
      cron: 'Läuft zu Beginn jeder Minute.',
    },
    state: {
      active: 'Aktiv',
      ended: 'Beendet',
      stopped: 'Angehalten',
    },
    outcome: {
      running: 'Wird ausgeführt',
      succeeded: 'Erfolgreich',
      failed: 'Fehlgeschlagen',
    },
  },
  status: {
    queued: 'In der Warteschlange',
    running: 'Wird ausgeführt',
    completed: 'Abgeschlossen',
    failed: 'Fehlgeschlagen',
  },
};

export default deDE;
