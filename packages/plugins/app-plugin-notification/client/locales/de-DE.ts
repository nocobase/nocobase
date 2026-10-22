import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
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
