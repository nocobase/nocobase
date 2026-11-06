import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  templates: {
    title: 'Benachrichtigungsvorlagen',
    coverage:
      'Nur registrierte Szenarien. Dynamische Sendungen, eigene Rückrufe und private Mailvorlagen sind nicht enthalten. Definitionen und Vorschauen sind schreibgeschützt.',
    search: 'Szenarien suchen',
    category: 'Geschäftskategorie',
    channel: 'Kanal',
    all: 'Alle',
    details: 'Details anzeigen',
    close: 'Details schließen',
    trigger: 'Auslöser',
    recipients: 'Empfängerregel',
    businessRule: 'Geschäftliche Aktivierung',
    contributor: 'Quelle',
    languagePolicy: 'Sprachverhalten',
    status: 'Kanalkonfiguration',
    statusHelp:
      'Eine registrierte Definition aktiviert keine Benachrichtigungen. Eine Konfiguration bestätigt keine Verbindung.',
    configured: 'Konfiguriert',
    unconfigured: 'Nicht konfiguriert',
    enabled: 'Aktiviert',
    disabled: 'Deaktiviert',
    unknown: 'Unbekannt',
    variables: 'Verfügbare Variablen',
    language: 'Inhaltssprache',
    synthetic:
      'Nur synthetische Beispieldaten. Die Vorschau sendet nichts und ändert keine Konfiguration.',
    definition: 'Vorlagendefinition',
    preview: 'Synthetische Vorschau',
    html: 'HTML-Quelltext (inert)',
    loading: 'Wird geladen…',
    failed: 'Vorlagen konnten nicht geladen werden.',
    forbidden: 'Keine Berechtigung zum Anzeigen der Vorlagen.',
    notFound: 'Diese Vorlage ist nicht mehr registriert.',
    retry: 'Erneut versuchen',
    empty: 'Keine Szenarien registriert.',
    noResults: 'Keine Szenarien entsprechen den Filtern.',
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
