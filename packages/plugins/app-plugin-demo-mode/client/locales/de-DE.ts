import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'Demodaten',
    read: 'Anzeigen',
    manage: 'Erzeugen und löschen',
    configuration: 'Demokonfiguration',
    configure: 'Konfigurieren',
  },
  menu: {
    label: 'Demomodus',
    switchAccount: 'Konto wechseln',
    title: 'Dies ist eine Demoumgebung',
    description:
      'Die Daten werden täglich automatisch zurückgesetzt. Änderungen werden nicht gespeichert.',
    accountsDescription:
      'Wechseln Sie zu einem der folgenden Konten, um zu sehen, worauf die einzelnen Rollen zugreifen können.',
    loading: 'Konten werden geladen…',
  },
  status: {
    loading: 'Wird geladen',
  },
  accounts: {
    title: 'Konten',
    description:
      'Öffnen Sie die Demo mit einem dieser Konten, um zu sehen, was jedes davon sieht.',
    enter: 'Öffnen',
    current: 'Aktuell',
    entering: 'Wird geöffnet…',
    failed: 'Die Anmeldung mit diesem Konto ist fehlgeschlagen.',
    unavailable: 'Derzeit sind keine Konten verfügbar.',
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
    busyHelp:
      'Bitte warten Sie, bis der aktuelle Datenvorgang abgeschlossen ist.',
    disabled: {
      title: 'Diese Anwendung ist keine Demo',
      help: 'Der Demo-Modus ist aus. Eine Bereitstellung schaltet ihn mit NOCOBASE_DEMO_MODE=true ein.',
    },
    errors: {
      failed: 'Die Anfrage wurde nicht abgeschlossen. Versuchen Sie es erneut.',
      demoModeRequired: 'Das geht nur bei eingeschaltetem Demo-Modus.',
      signedOut: 'Ihre Sitzung ist abgelaufen. Melden Sie sich erneut an.',
      denied:
        'Sie haben keine Berechtigung, die Demo-Einstellungen anzuzeigen.',
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
      absentSummary: 'Es wurden noch keine Demodaten generiert.',
      failed: 'Der letzte Lauf wurde nicht abgeschlossen',
      unavailable: 'Keine Demo-Daten',
      unavailableHelp: 'Diese Anwendung registriert keinen Demo-Datensatz.',
    },
    visitors: {
      unavailable: 'Derzeit sind keine Konten verfügbar.',
      title: 'Konten',
      username: 'Benutzername {{username}}',
      copyLink: 'Link kopieren',
      copyLinkFor: 'Zugangslink für {{name}} kopieren',
      openFor: 'Demo als {{name}} öffnen',
      copied: 'Kopiert',
      copyFailed:
        'Kopieren fehlgeschlagen. Kopieren Sie den Link aus der Adressleiste.',
    },
    schedule: {
      title: 'Tägliches Zurücksetzen',
      description:
        'Die Demodaten werden täglich automatisch zurückgesetzt. Der Zeitplan wird über Umgebungsvariablen konfiguriert.',
      time: 'Uhrzeit',
      language: 'Sprache',
      timezone: 'Zeitzone',
      next: 'Nächstes Zurücksetzen: {{time}}',
    },
  },
};
export default resource;
