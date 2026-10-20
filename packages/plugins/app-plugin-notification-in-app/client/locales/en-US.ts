import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  inbox: {
    eyebrow: 'Personal inbox',
    title: 'Message center',
    unreadCount: '{{count}} unread',
    description: 'Updates from the applications and workflows you use.',
    markAllRead: 'Mark all read',
    messagesTitle: 'Messages',
    messagesDescription:
      'In-app messages keep an independent read state for the current user.',
    unreadFilter: 'Unread',
    unavailable: 'Inbox unavailable',
    retry: 'Retry',
    loading: 'Loading notifications…',
    emptyTitle: 'You’re all caught up',
    emptyDescription: 'New notifications will appear here.',
    loadingMore: 'Loading…',
    loadMore: 'Load more',
    scrollMore: 'Scroll down to load more',
    noMore: 'No more messages',
    expand: 'Show more',
    collapse: 'Show less',
    channel: 'In-app',
    open: 'Open',
    markUnread: 'Mark unread',
    markRead: 'Mark read',
    delete: 'Delete notification',
    errors: {
      update: 'Inbox update failed.',
      loadMore: 'Could not load more notifications.',
      markAllRead: 'Could not mark notifications as read.',
    },
  },
};

export type InAppNotificationClientResource = LocaleResource<typeof enUS>;

export default enUS;
