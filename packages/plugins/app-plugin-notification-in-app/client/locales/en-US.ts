import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  common: {
    loading: 'Loading',
  },
  inbox: {
    actions: {
      delete: 'Delete',
      read: 'Mark as read',
      unread: 'Mark as unread',
    },
    actionsFor: 'Actions for {{title}}',
    allRead: 'All marked as read.',
    back: 'Back to the list',
    cancel: 'Cancel',
    categories: 'Categories',
    clearFilter: 'Clear filter',
    count: '×{{count}}',
    deleted: 'Deleted.',
    description: 'Notifications and requests sent to you.',
    empty: {
      decision: 'No decisions waiting for you',
      info: 'No notifications',
      todo: 'Nothing waiting for you',
      unread: 'All caught up',
    },
    emptyAll: 'Nothing here',
    emptyDescription: 'Notifications and requests sent to you show up here.',
    filters: 'Inbox filters',
    forbidden: 'You are not allowed to do this.',
    keyMove: 'Move',
    keyOpen: 'Open',
    kinds: {
      all: 'All types',
      decision: 'Decisions',
      info: 'Earlier',
      label: 'Type',
      today: 'Today',
    },
    loadFailed: 'Unable to load the inbox',
    loadFailedDescription: 'Check your connection and try again.',
    loadMore: 'Load more',
    loading: 'Loading',
    noMatchDescription: 'Clear the filter to see every type.',
    nothingSelected: 'Select an item to view it',
    notification: 'Notification',
    open: 'Open',
    outcomes: {
      approved: 'Approved',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn',
    },
    pendingDecisions: '{{count}} waiting',
    readAll: 'Mark all as read',
    request: {
      approve: 'Approve',
      commentFor: '{{action}}: {{title}}',
      commentPlaceholder: 'Write something…',
      newLine: 'for a new line',
      quickSend: 'to send',
      reject: 'Reject',
    },
    requestFailed: 'The request failed. Try again.',
    resolved: 'Handled',
    retry: 'Retry',
    tabs: {
      decision: 'Pending',
      info: 'Earlier',
      today: 'Today',
    },
    title: 'Inbox',
    unread: 'Unread',
    unreadCount: '{{count}} unread',
    views: {
      all: 'All',
      todo: 'Pending',
      unread: 'Unread',
    },
  },
  inboxButton: {
    empty: 'No messages yet',
    pending: 'Inbox, {{count}} waiting',
    recent: 'Recent messages',
    title: 'Inbox',
    unread: 'Inbox, {{count}} unread',
    viewAll: 'Open inbox',
  },
  nav: {
    inbox: 'Inbox',
  },
};

export type InAppNotificationClientResource = LocaleResource<typeof enUS>;

export default enUS;
