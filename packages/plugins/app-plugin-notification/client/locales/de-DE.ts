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
    sendTest: 'Testbenachrichtigung senden',
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
  test: {
    title: 'Testbenachrichtigung senden',
    description:
      'Wählen Sie eine Zustellungsmethode und klicken Sie dann auf Senden. Die Nachricht wird an den von Ihnen angegebenen Empfänger gesendet und unten aufgezeichnet.',
    close: 'Testbenachrichtigungsdialog schließen',
    loadingProviders: 'Konfigurierte Anbieter werden geladen…',
    noProviders: 'Es sind keine aktivierten Anbieter konfiguriert.',
    channelProvider: 'Versandart',
    selectProvider: 'Wählen Sie eine Versandart',
    singleProviderLabel: '{{channel}} ({{provider}})',
    recipient: 'Empfänger',
    userIdPlaceholder: 'Benutzer-ID',
    emailHelp: 'Die E-Mail-Adresse, die diesen Test erhalten soll.',
    userHelp: 'Die Benutzer-ID, die diese In-App-Nachricht erhalten soll.',
    messageTitle: 'Titel',
    message: 'Nachricht',
    cancel: 'Abbrechen',
    sending: 'Senden…',
    send: 'Senden',
    defaultTitle: 'NocoBase-Benachrichtigungstest',
    defaultBody: 'Dies ist eine Testbenachrichtigung von NocoBase.',
    accepted: 'Testbenachrichtigung {{id}} akzeptiert.',
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
