import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  templates: {
    title: 'Benachrichtigungsvorlagen',
    coverage:
      'Benachrichtigungen, die das System automatisch sendet, und wie sie aussehen. Benachrichtigungen aus Workflows oder eigenem Code werden möglicherweise nicht aufgeführt. Diese Seite ist schreibgeschützt.',
    filters: 'Vorlagen filtern',
    search: 'Vorlagen durchsuchen',
    category: 'Kategorie',
    channel: 'Kanal',
    all: 'Alle',
    details: 'Vorlagendetails',
    close: 'Schließen',
    providedBy: 'Bereitgestellt von {{name}}',
    trigger: 'Wann sie gesendet wird',
    recipients: 'Wer sie erhält',
    businessRule: 'Versandbedingungen',
    languagePolicy: 'Sprache',
    combined:
      'Eine Nachricht enthält alle Sprachen ({{languages}}). Alle Empfänger erhalten denselben Inhalt.',
    singleLocale: 'Wird nur auf {{language}} gesendet.',
    status: 'Versandkanäle',
    statusHelp:
      'Zeigt, ob jeder Kanal eingerichtet ist. Die Verbindung wird nicht getestet, und es wird nicht bestätigt, dass Nachrichten zugestellt werden.',
    configured: 'Eingerichtet',
    unconfigured: 'Nicht eingerichtet',
    enabled: 'An',
    disabled: 'Aus',
    variables: 'Variablen',
    variablesHelp:
      'Platzhalter, die beim Senden der Benachrichtigung durch echte Werte ersetzt werden.',
    language: 'Sprache',
    synthetic:
      'Verwendet erfundene Beispieldaten. Die Vorschau sendet nie eine Benachrichtigung.',
    definition: 'Vorlage mit Variablen',
    preview: 'Vorschau',
    html: 'HTML-Version (als Code angezeigt)',
    technical: 'Technische Details',
    templateId: 'Vorlagen-ID',
    package: 'Paket',
    channelNames: 'Kanalnamen',
    channelTypes: {
      inApp: 'In-App-Nachricht',
      email: 'E-Mail',
    },
    loading: 'Wird geladen…',
    failed: 'Vorlagen konnten nicht geladen werden.',
    forbidden:
      'Sie haben keine Berechtigung, Benachrichtigungsvorlagen anzuzeigen.',
    notFound: 'Diese Vorlage existiert nicht mehr.',
    retry: 'Erneut versuchen',
    empty: 'Es gibt noch keine Benachrichtigungsvorlagen.',
    noResults: 'Keine Vorlage entspricht diesen Filtern.',
  },
  logs: {
    deliveryOperations: 'Lieferbetriebe',
    recipeDescription:
      'Verfolgen Sie jede Kanalübergabe und jeden Provider-Versuch.',
    redacted: 'Nachrichtentexte, Empfänger und Lease-Tokens werden geschwärzt.',
    providerAttempts: 'Provider-Versuche',
    eyebrow: 'Benachrichtigungen',
    title: 'Benachrichtigungsprotokolle',
    description:
      'Verfolgen Sie die Zustellung der Benachrichtigung und jeden Provider-Versuch. Nachrichtentexte, Empfänger und Lease-Tokens werden geschwärzt.',
    refreshing: 'Erfrischend…',
    refresh: 'Aktualisieren',
    deliveriesShown: 'Lieferungen angezeigt',
    needAttention: 'Brauche Aufmerksamkeit',
    unavailable: 'Protokolle nicht verfügbar',
    recent: 'Aktuelle Benachrichtigungen',
    loading: 'Lieferhistorie wird geladen…',
    emptyTitle: 'Noch keine Lieferungen',
    emptyDescription:
      'Zustellungsdatensätze werden hier angezeigt, nachdem Benachrichtigungen gesendet wurden.',
    expand: 'Benachrichtigung erweitern',
    collapse: 'Kollapsbenachrichtigung',
    noDeliveries: 'Keine Lieferungen verzeichnet.',
    noAttempts: 'Keine Versuche aufgezeichnet.',
    columns: {
      source: 'Quelle',
      notificationId: 'Benachrichtigungs-ID',
      status: 'Status',
      deliveries: 'Lieferungen',
      created: 'Erstellt',
      channel: 'Kanal',
      provider: 'Anbieter',
      attempts: 'Versuche',
      updated: 'Aktualisiert',
    },
  },
  status: {
    pending: 'ausstehend',
    processing: 'Verarbeitung',
    completed: 'abgeschlossen',
    partial: 'teilweise',
    failed: 'fehlgeschlagen',
    unknown: 'unbekannt',
    preparing: 'Vorbereitung',
    submitting: 'Einreichen',
    retrying: 'erneuter Versuch',
    accepted: 'akzeptiert',
  },
  errors: {
    requestFailed: 'Benachrichtigungsanforderung fehlgeschlagen.',
    inAppRecipientNotFound:
      'Der Empfänger der In-App-Benachrichtigung ist nicht vorhanden.',
  },
};

export default deDE;
