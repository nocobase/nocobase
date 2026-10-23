import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'Demodaten',
    read: 'Anzeigen',
    manage: 'Erzeugen und löschen',
    configuration: 'Demokonfiguration',
    configure: 'Konfigurieren',
  },
  accounts: {
    menu: 'Demo-Konto: {{name}}',
    title: 'Demo-Konten',
    description:
      'Öffnen Sie die Demo mit einem dieser Konten, um zu sehen, was jedes davon sieht.',
    enter: 'Öffnen',
    signedInAs: 'Angemeldet als {{name}} · Wechseln',
    current: 'Aktuell',
    entering: 'Wird geöffnet…',
    failed: 'Dieses Demo-Konto konnte nicht geöffnet werden.',
    unavailable: 'Derzeit sind keine Demo-Konten verfügbar.',
    password: 'Mit Passwort anmelden',
  },
  refused: {
    title: 'Dies ist eine Demo. Änderungen können nicht gespeichert werden.',
    description: 'Alle anderen Funktionen sind wie gewohnt verfügbar.',
  },
  settings: {
    title: 'Demo-Umgebung',
    refresh: 'Aktualisieren',
    retry: 'Erneut versuchen',
    busy: 'Demo-Daten werden erzeugt oder gelöscht',
    busyHelp: 'Danach lassen sich die Einstellungen wieder speichern.',
    disabled: {
      title: 'Diese Anwendung ist keine Demo',
      help: 'Der Demo-Modus ist aus. Eine Bereitstellung schaltet ihn mit NOCOBASE_DEMO_MODE=true ein.',
    },
    cancel: 'Abbrechen',
    save: 'Speichern',
    apply: 'Änderungen übernehmen',
    unsaved: 'Ungespeicherte Änderungen',
    discardAndReload: 'Meine Änderungen verwerfen und neu laden',
    switch: {
      on: 'Ein',
      off: 'Aus',
    },
    status: {
      help: 'Im Demo-Modus können Sie jede Seite öffnen, aber Änderungen werden nicht gespeichert, außer eine Ausnahme unten erlaubt sie.',
    },
    tabs: {
      overview: 'Übersicht',
      schedule: 'Tägliches Zurücksetzen',
      writes: 'Schreiben durch Besucher',
      simulation: 'Simulation & KI',
    },
    leave: {
      title: 'Ohne Speichern verlassen?',
      description:
        'Nicht gespeicherte Änderungen auf dieser Seite gehen verloren.',
      stay: 'Weiter bearbeiten',
      discard: 'Änderungen verwerfen',
    },
    errors: {
      failed: 'Die Anfrage wurde nicht abgeschlossen. Versuchen Sie es erneut.',
      conflict:
        'Ein anderer Administrator hat diese Einstellung zuerst gespeichert.',
      busy: 'Demo-Daten werden erzeugt oder gelöscht. Versuchen Sie es danach erneut.',
      exists:
        'Die Demo-Daten sind bereits erzeugt. Setzen Sie sie stattdessen zurück.',
      demoModeRequired: 'Das geht nur bei eingeschaltetem Demo-Modus.',
      accountConflict:
        'Ein Demo-Benutzername gehört zu einem Konto, das nicht der Demo gehört.',
      unavailable: 'Diese Anwendung stellt keine Demo-Daten bereit.',
      signedOut: 'Ihre Sitzung ist abgelaufen. Melden Sie sich erneut an.',
      denied: 'Sie dürfen die Demo nicht verwalten.',
    },
    data: {
      title: 'Demo-Daten',
      state: {
        importing: 'Wird erzeugt',
        clearing: 'Wird gelöscht',
        resetting: 'Wird zurückgesetzt',
        failed: 'Fehlgeschlagen',
        ready: 'Bereit',
        none: 'Nicht erzeugt',
      },
      presentSummary: 'Erzeugt auf {{language}} · {{time}}',
      resettingSummary:
        'Die aktuellen Daten werden gelöscht und auf {{language}} neu erzeugt.',
      phase: {
        clearing: 'Wird gelöscht',
        generating: 'Wird neu erzeugt',
      },
      absentSummary:
        'Erzeugen Sie die Demo-Daten, damit Besucher die Anwendung anhand einer vollständigen Geschichte erkunden können.',
      language: 'Sprache',
      clear: 'Löschen',
      reset: 'Zurücksetzen',
      generate: 'Erzeugen',
      failed: 'Der letzte Lauf wurde nicht abgeschlossen',
      readOnly:
        'Sie können die Demo-Daten ansehen; Erzeugen, Zurücksetzen und Löschen erfordern die Verwaltungsberechtigung.',
      unavailable: 'Keine Demo-Daten',
      unavailableHelp: 'Diese Anwendung registriert keinen Demo-Datensatz.',
      cleared: 'Demo-Daten gelöscht',
      resetStarted: 'Demo-Daten werden zurückgesetzt',
      importStarted: 'Demo-Daten werden erzeugt',
      confirm: {
        import: {
          title: 'Demo-Daten erzeugen?',
          description:
            'Die Demo-Daten werden auf {{language}} erzeugt und ihre Demo-Konten eingeschaltet.',
        },
        reset: {
          title: 'Demo-Daten zurücksetzen?',
          description:
            'Alle Geschäftsdaten dieser Instanz werden gelöscht, auch was Besucher hinzugefügt haben, und die Demo-Daten auf {{language}} neu erzeugt.',
        },
        clear: {
          title: 'Demo-Daten löschen?',
          description:
            'Alle Geschäftsdaten dieser Instanz werden gelöscht, auch was Besucher hinzugefügt haben, und die Demo-Konten ausgeschaltet. Einstellungen und Administratoren bleiben.',
        },
      },
    },
    visitors: {
      title: 'Demokonten',
      off: 'Die Schnellanmeldung ist in dieser Bereitstellung ausgeschaltet.',
      pending: 'Die Konten erscheinen hier, sobald die Demodaten bereit sind.',
      noData:
        'Erzeugen Sie zuerst die Demo-Daten; ihre Konten erscheinen dann hier.',
      credentials: 'Benutzername {{username}} · Passwort {{password}}',
      copyLink: 'Link kopieren',
      copyLinkFor: 'Zugangslink für {{name}} kopieren',
      openFor: 'Demo als {{name}} öffnen',
      copied: 'Kopiert',
      copyFailed:
        'Kopieren fehlgeschlagen. Kopieren Sie den Link aus der Adressleiste.',
    },
    schedule: {
      confirmTitle: 'Tägliches Zurücksetzen speichern?',
      confirmDescription:
        'Zur unten genannten Zeit werden alle Geschäftsdaten dieser Instanz gelöscht und neu erzeugt.',
      summary: 'Täglich um {{time}} ({{timezone}}), auf {{language}}',
      off: 'Nicht geplant',
      enabled: 'Täglich zurücksetzen',
      enabledHelp:
        'Verwendet den Administrator, der die Demo-Daten zuletzt erzeugt hat.',
      time: 'Uhrzeit',
      hour: 'Stunde',
      minute: 'Minute',
      language: 'Sprache',
      timezone: 'Zeitzone',
      noTimezone: 'Keine passende Zeitzone',
      invalidTimezone: 'Wählen Sie eine Zeitzone aus der Liste.',
      next: 'Nächstes Zurücksetzen: {{time}}',
    },
    writes: {
      intro:
        'Bei aktivierter Demo werden Schreibzugriffe standardmäßig abgelehnt. Wählen Sie die Sammlungen aus, die Besucher bearbeiten dürfen; die Anwendungsberechtigungen steuern die Vorgänge und den Zugriff auf Datensätze.',
      allow: 'Erlauben',
      revoke: 'Wieder ablehnen',
      confirmTitle: 'Ändern, was Besucher schreiben dürfen?',
      confirmDescription:
        'Änderungen der Besucher daran werden tatsächlich gespeichert und bleiben bis zum nächsten Zurücksetzen.',
      collections: {
        title: 'Collections',
        description:
          'Von der Anwendung autorisierte Anfragen dürfen diese Sammlungen ändern.',
        label: 'Collections, die Besucher schreiben dürfen',
        placeholder: 'Collections suchen',
        noMatch: 'Keine passende Collection',
        fixed: 'Immer beschreibbar',
        fixedHelp:
          'Anmeldesitzungen und die eigenen Ausnahmen der Bereitstellung (NOCOBASE_DEMO_WRITABLE_COLLECTIONS); sie lassen sich hier nicht ändern.',
      },
    },
    simulation: {
      kind: {
        model: 'Modell',
        tool: 'Werkzeug',
        runner: 'Runner',
      },
      mocks: {
        title: 'Simulationen',
        description: 'Was in dieser Demo anstelle externer Dienste antwortet.',
        confirmTitle: 'Simulationen ändern?',
        confirmDescription:
          'Eine ausgeschaltete Simulation lässt diese Arbeit fehlschlagen; sie wird nie an den echten Dienst gesendet.',
        empty: 'Keine Simulationen registriert',
        emptyHelp: 'Die Anwendung hat keinen simulierten Dienst registriert.',
        onHelp: 'Antwortet mit simulierten Ergebnissen.',
        offHelp: 'Ausgeschaltet: Die Arbeit wird abgelehnt.',
      },
      chat: {
        title: 'Online-Chat',
        description: 'Lässt Besucher mit der KI der Anwendung sprechen.',
        confirmTitle: 'Online-Chat-Einstellungen speichern?',
        confirmDescription:
          'Unterhaltungen von Besuchern folgen diesen Einstellungen ab ihrer nächsten Nachricht.',
        enabled: 'Besucher dürfen chatten',
        enabledHelp: 'Aus: Der Chat lehnt Nachrichten von Besuchern ab.',
        tools: 'Werkzeuge',
        noTools: 'Die Anwendung deklariert keine Chat-Werkzeuge.',
        policy: {
          deny: 'Ablehnen',
          read: 'Daten lesen',
          mock: 'Simulieren',
        },
      },
    },
  },
};
export default resource;
