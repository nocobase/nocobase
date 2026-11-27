import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  inbox: {
    title: 'Posteingang',
    views: {
      all: 'Alle',
      unread: 'Ungelesen',
      todo: 'Ausstehend',
    },
    categories: 'Kategorien',
    readAll: 'Alle als gelesen markieren',
    open: 'Öffnen',
    actions: {
      read: 'Als gelesen markieren',
      unread: 'Als ungelesen markieren',
      delete: 'Löschen',
    },
    tabs: {
      today: 'Heute',
      info: 'Früher',
      decision: 'Ausstehend',
    },
    actionsFor: 'Aktionen für {{title}}',
    allRead: 'Alle als gelesen markiert.',
    back: 'Zurück zur Liste',
    cancel: 'Abbrechen',
    clearFilter: 'Filter zurücksetzen',
    count: '×{{count}}',
    deleted: 'Gelöscht.',
    description: 'An Sie gesendete Benachrichtigungen und Anfragen.',
    empty: {
      decision: 'Keine Entscheidungen warten auf Sie',
      info: 'Keine Benachrichtigungen',
      todo: 'Nichts wartet auf Sie',
      unread: 'Alles erledigt',
    },
    emptyAll: 'Hier ist nichts',
    emptyDescription:
      'Hier erscheinen an Sie gesendete Benachrichtigungen und Anfragen.',
    filters: 'Posteingangsfilter',
    forbidden: 'Sie dürfen das nicht tun.',
    keyMove: 'Bewegen',
    keyOpen: 'Offen',
    kinds: {
      all: 'Alle Typen',
      decision: 'Entscheidungen',
      info: 'Früher',
      label: 'Typ',
      today: 'Heute',
    },
    detailsUnavailable:
      'Einige Details des Posteingangs konnten nicht geladen werden.',
    loadFailed: 'Der Posteingang kann nicht geladen werden',
    loadFailedDescription:
      'Prüfen Sie die Verbindung und versuchen Sie es erneut.',
    loadMore: 'Mehr laden',
    loading: 'Wird geladen',
    noMatchDescription: 'Setzen Sie den Filter zurück, um alle Typen zu sehen.',
    nothingSelected: 'Wählen Sie einen Eintrag aus, um ihn anzusehen',
    notification: 'Benachrichtigung',
    outcomes: {
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      withdrawn: 'Zurückgezogen',
    },
    pendingDecisions: '{{count}} wartend',
    request: {
      approve: 'Genehmigen',
      commentFor: '{{action}}: {{title}}',
      commentPlaceholder: 'Schreiben Sie etwas…',
      newLine: 'für eine neue Zeile',
      quickSend: 'zum Senden',
      reject: 'Ablehnen',
    },
    requestFailed: 'Die Anfrage ist fehlgeschlagen. Versuchen Sie es erneut.',
    resolved: 'Erledigt',
    retry: 'Erneut versuchen',
    unread: 'Ungelesen',
    unreadCount: '{{count}} ungelesen',
  },
  inboxButton: {
    title: 'Posteingang',
    viewAll: 'Posteingang öffnen',
    empty: 'Noch keine Nachrichten',
    pending: 'Posteingang, {{count}} ausstehend',
    recent: 'Letzte Nachrichten',
    unread: 'Posteingang, {{count}} ungelesen',
  },
  nav: {
    inbox: 'Posteingang',
  },
  common: { loading: 'Wird geladen' },
};

export default deDE;
