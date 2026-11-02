import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  navigation: {
    mailExample: 'Mail-Beispiel',
    workspace: 'Posteingang und Verfassen',
    accounts: 'Konten',
    allMail: 'Alle Post',
    activity: 'Aktivität senden',
    syncLogs: 'Protokolle synchronisieren',
  },
  workspace: {
    title: 'Posteingang und Verfassen',
    description:
      'Lesen Sie Beispielnachrichten, überprüfen Sie Anhänge, antworten Sie oder verfassen Sie eine neue Nachricht. Der Scheinanbieter akzeptiert Versendungen, ohne einen externen E-Mail-Dienst zu kontaktieren.',
  },
  activity: {
    title: 'Aktivität senden',
    description:
      'Überprüfen Sie die Zustellungsdatensätze, die durch den normalen Sendeablauf von Mail erstellt wurden. Der Scheinanbieter simuliert die Annahme und Mail speichert die Nachricht im lokalen Ordner „Gesendet“.',
    subject: 'Betreff',
    recipients: 'Empfänger',
    account: 'Sendekonto',
    status: 'Status',
    created: 'Eingereicht',
    noSubject: '(kein Thema)',
    loadFailed: 'Die Sendeaktivität konnte nicht geladen werden.',
    emptyTitle: 'Noch keine Sendeaktivität',
    emptyDescription:
      'Senden Sie eine Beispielnachricht aus dem Arbeitsbereich, um hier das simulierte Zustellungsergebnis zu sehen.',
    statuses: {
      pending: 'Ausstehend',
      submitting: 'Senden',
      accepted: 'Akzeptiert (simuliert)',
      failed: 'Fehlgeschlagen',
      unknown: 'Unbekannt',
      cancelled: 'Abgebrochen',
    },
  },
  providers: {
    demo: 'Gmail (Schein)',
    'demo-microsoft': 'Microsoft 365 (Schein)',
    'demo-imap-smtp': 'IMAP/SMTP (Schein)',
  },
  accounts: {
    title: 'Postfachkonten',
    description: 'Vorbereiten der Beispielpostfächer und ihrer Nachrichten.',
  },
  allMail: {
    title: 'Alle Post',
    description:
      'Durchsuchen Sie E-Mails, die aus den Scheinpostfächern importiert wurden, suchen Sie nach Schlüsselwörtern und überprüfen Sie das Konto, den Lesestatus, den Stern und die Anhangsmetadaten jeder Nachricht.',
    listTitle: 'Nachrichtenliste',
    resultCount: '{{count}}-Meldungen',
    pageCount: 'Seite {{page}} von {{pages}}',
    searchLabel: 'E-Mails durchsuchen',
    searchPlaceholder: 'Betreff, Absender oder Nachrichteninhalt suchen',
    search: 'Suchen',
    account: 'Konto',
    from: 'Von',
    subject: 'Betreff und Vorschau',
    flags: 'Nachrichtenstatus',
    date: 'Erhalten',
    unread: 'Ungelesen',
    starred: 'Mit einem Stern versehen',
    attachment: 'Anhaftung',
    previous: 'Zurück',
    next: 'Weiter',
    emptyTitle: 'Keine Nachrichten gefunden',
    emptyDescription:
      'Versuchen Sie es mit einem anderen Schlüsselwort oder löschen Sie die Suche, um alle Scheinnachrichten anzuzeigen.',
    loadFailed: 'Es konnten nicht alle E-Mails geladen werden.',
  },
  syncLogs: {
    title: 'Protokolle synchronisieren',
    description:
      'Überprüfen Sie den Verlauf und die inkrementellen Synchronisierungsläufe für die drei Scheinpostfächer, einschließlich Status, Phase, verarbeitete Anzahl und Fehler.',
    account: 'Postfachkonto',
    mode: 'Sync-Modus',
    status: 'Status',
    phase: 'Phase',
    progress: 'Fortschritt',
    started: 'Gestartet',
    completed: 'Abgeschlossen',
    error: 'Fehler',
    unknownAccount: 'Unbekanntes Konto',
    empty:
      'Es läuft noch keine Synchronisierung. Starten Sie eine Synchronisierung auf der Kontenseite.',
    loadFailed: 'Synchronisierungsprotokolle konnten nicht geladen werden.',
    pageCount: 'Seite {{page}} von {{pages}} · {{total}} wird ausgeführt',
    messages: '{{count}}-Nachrichten verarbeitet',
    batches: '{{count}}-Chargen',
    modes: {
      initial: 'Erstsynchronisierung',
      incremental: 'Inkrementelle Synchronisierung',
    },
    statuses: {
      pending: 'Ausstehend',
      running: 'Wird ausgeführt',
      completed: 'Abgeschlossen',
      partial: 'Teilweise',
      failed: 'Fehlgeschlagen',
      cancelled: 'Abgebrochen',
    },
    phases: {
      preparing: 'Vorbereitung',
      history: 'Nachrichtenverlauf',
      catchUp: 'Aufholen',
      incremental: 'Inkrementelle Updates',
      completed: 'Abgeschlossen',
    },
  },
  demo: {
    noPreview: 'Keine Vorschau verfügbar.',
    preparing: 'Demo-Postfachdaten werden vorbereitet…',
    retry: 'Wiederholen Sie die Einrichtung',
    openWorkspace: 'Mail-Arbeitsbereich öffnen',
    refresh: 'Aktualisieren',
    loading: 'Wird geladen…',
  },
};

export default deDE;
