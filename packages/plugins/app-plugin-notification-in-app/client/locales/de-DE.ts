import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  inbox: {
    eyebrow: 'Persönlicher Posteingang',
    title: 'Nachrichtenzentrum',
    unreadCount: '{{count}} ungelesen',
    description:
      'Aktualisierungen der von Ihnen verwendeten Anwendungen und Arbeitsabläufe.',
    markAllRead: 'Alle als gelesen markieren',
    messagesTitle: 'Nachrichten',
    messagesDescription:
      'In-App-Nachrichten behalten einen unabhängigen Lesestatus für den aktuellen Benutzer.',
    unreadFilter: 'Ungelesen',
    unavailable: 'Posteingang nicht verfügbar',
    retry: 'Erneut versuchen',
    loading: 'Benachrichtigungen werden geladen…',
    emptyTitle: 'Ihr seid alle beschäftigt',
    emptyDescription: 'Hier werden neue Benachrichtigungen angezeigt.',
    loadingMore: 'Wird geladen…',
    loadMore: 'Mehr laden',
    scrollMore: 'Scrollen Sie nach unten, um mehr zu laden',
    noMore: 'Keine Nachrichten mehr',
    expand: 'Mehr anzeigen',
    collapse: 'Weniger anzeigen',
    channel: 'In-App',
    open: 'Öffnen',
    markUnread: 'Als ungelesen markieren',
    markRead: 'Mark las',
    delete: 'Benachrichtigung löschen',
    errors: {
      update: 'Die Aktualisierung des Posteingangs ist fehlgeschlagen.',
      loadMore: 'Es konnten keine weiteren Benachrichtigungen geladen werden.',
      markAllRead:
        'Benachrichtigungen konnten nicht als gelesen markiert werden.',
    },
  },
};

export default deDE;
