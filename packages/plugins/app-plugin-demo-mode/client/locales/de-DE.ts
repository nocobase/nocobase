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
      help: 'Der Demo-Modus ist aus. Eine Bereitstellung schaltet ihn mit NOCOBASE_DEMO_MODE ein.',
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
    mode: {
      readOnly: 'Schreibgeschützt',
      observe: 'Beobachten',
      readOnlyHelp:
        'Besucher können jede Seite öffnen, aber Änderungen werden nicht gespeichert, außer eine Ausnahme unten erlaubt sie.',
      observeHelp:
        'Nichts wird abgelehnt: Schreibvorgänge, die der schreibgeschützte Modus ablehnen würde, werden nur protokolliert, um herauszufinden, was erlaubt werden soll.',
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
      title: 'Zugang für Besucher',
      description:
        'Besucher öffnen jedes dieser Konten ohne Passwort und können in der Ecke jeder Seite zwischen ihnen wechseln.',
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
      embed: 'In eine Webseite einbetten',
      copyEmbed: 'Einbettungscode kopieren',
      embedHelp:
        'Die Seite muss auf derselben Website wie diese Demo liegen, etwa einer anderen Subdomain derselben Domain; sonst hält der Browser Besucher im Rahmen nicht angemeldet.',
    },
    schedule: {
      title: 'Tägliches Zurücksetzen',
      description:
        'Einmal am Tag löschen, was Besucher geändert haben, und die Demo-Daten neu erzeugen.',
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
        'Im schreibgeschützten Modus wird jede Änderung abgelehnt. Öffnen Sie nur, was Besucher ausprobieren sollen, und nur für Datensätze der Demo; Geschäftsberechtigungen gelten weiterhin.',
      allow: 'Erlauben',
      revoke: 'Wieder ablehnen',
      scope: 'Bereich',
      confirmTitle: 'Ändern, was Besucher schreiben dürfen?',
      confirmDescription:
        'Änderungen der Besucher daran werden tatsächlich gespeichert und bleiben bis zum nächsten Zurücksetzen.',
      operation: {
        insert: 'Erstellen',
        update: 'Bearbeiten',
        delete: 'Löschen',
      },
      capabilities: {
        title: 'Geschäftsvorgänge',
        description:
          'Vorgänge, die die Anwendung als sicher zum Öffnen markiert hat, jeweils auf einen Bereich begrenzt.',
        empty: 'Keine Vorgänge registriert',
        emptyHelp:
          'Die Anwendung hat keinen Vorgang registriert, der in einer Demo geöffnet werden kann.',
      },
      tables: {
        title: 'Tabellen',
        description:
          'Jede berechtigte Anfrage darf in diese Tabellen schreiben. Nur für Zustand, den niemand missbrauchen kann, etwa Ansichtseinstellungen.',
        label: 'Tabellen, die Besucher schreiben dürfen',
        placeholder: 'Tabellen suchen',
        noMatch: 'Keine passende Tabelle',
        fixed: 'Immer beschreibbar',
        fixedHelp:
          'Anmeldesitzungen und die eigenen Ausnahmen der Bereitstellung (NOCOBASE_DEMO_WRITABLE_TABLES); sie lassen sich hier nicht ändern.',
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
        confirmLive:
          'Ein echtes Modell antwortet Besuchern, und jede Unterhaltung wird über seinen Modelldienst abgerechnet.',
        enabled: 'Besucher dürfen chatten',
        enabledHelp: 'Aus: Der Chat lehnt Nachrichten von Besuchern ab.',
        model: 'Antworten von',
        simulated: 'Simuliertes Modell',
        live: 'Ein echtes Modell',
        simulatedHelp: 'Antworten nach Skript; keine Kosten.',
        liveHelp:
          'Ein vorhandener Modelldienst antwortet; seine Zugangsdaten bleiben dort.',
        service: 'Modelldienst',
        modelId: 'Modell',
        cost: 'Jede Unterhaltung eines Besuchers verbraucht Tokens dieses Dienstes.',
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
