import type { InAppNotificationClientResource } from './en-US.js';

const deDE: InAppNotificationClientResource = {
  common: {
    loading: 'Wird geladen',
  },
  inbox: {
    actions: {
      delete: 'Löschen',
      read: 'Als gelesen markieren',
      unread: 'Als ungelesen markieren',
    },
    actionsFor: 'Aktionen für {{title}}',
    allRead: 'Alle als gelesen markiert.',
    back: 'Zurück zur Liste',
    cancel: 'Abbrechen',
    categories: 'Kategorien',
    clearFilter: 'Filter zurücksetzen',
    count: '×{{count}}',
    deleted: 'Gelöscht.',
    description: 'Benachrichtigungen und Anfragen an Sie.',
    empty: {
      decision: 'Keine Entscheidungen, die auf Sie warten',
      info: 'Keine Benachrichtigungen',
      todo: 'Nichts wartet auf Sie',
      unread: 'Alles erledigt',
    },
    emptyAll: 'Hier ist nichts',
    emptyDescription:
      'Benachrichtigungen und Anfragen an Sie werden hier angezeigt.',
    filters: 'Posteingangsfilter',
    forbidden: 'Das ist Ihnen nicht gestattet.',
    keyMove: 'Bewegen',
    keyOpen: 'Öffnen',
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
      'Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    loadMore: 'Mehr laden',
    loading: 'Wird geladen',
    noMatchDescription: 'Setzen Sie den Filter zurück, um alle Typen zu sehen.',
    nothingSelected: 'Wählen Sie einen Eintrag aus, um ihn anzuzeigen',
    notification: 'Benachrichtigung',
    open: 'Öffnen',
    outcomes: {
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      withdrawn: 'Zurückgezogen',
    },
    pendingDecisions: '{{count}} ausstehend',
    readAll: 'Alle als gelesen markieren',
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
    tabs: {
      decision: 'Ausstehend',
      info: 'Früher',
      today: 'Heute',
    },
    title: 'Posteingang',
    unread: 'Ungelesen',
    unreadCount: '{{count}} ungelesen',
    views: {
      all: 'Alle',
      todo: 'Ausstehend',
      unread: 'Ungelesen',
    },
  },
  inboxButton: {
    empty: 'Noch keine Nachrichten',
    pending: 'Posteingang, {{count}} ausstehend',
    recent: 'Neueste Nachrichten',
    title: 'Posteingang',
    unread: 'Posteingang, {{count}} ungelesen',
    viewAll: 'Posteingang öffnen',
  },
  nav: {
    inbox: 'Posteingang',
  },
};

export default deDE;
