/** Every key the inbox looks up, so each locale is checked against the same list. */
export interface InboxLocale {
  readonly 'inbox.title': string;
  readonly 'inbox.description': string;
  readonly 'inbox.views.all': string;
  readonly 'inbox.views.todo': string;
  readonly 'inbox.kinds.label': string;
  readonly 'inbox.kinds.all': string;
  readonly 'inbox.kinds.decision': string;
  readonly 'inbox.kinds.info': string;
  readonly 'inbox.tabs.decision': string;
  readonly 'inbox.tabs.info': string;
  readonly 'inbox.clearFilter': string;
  readonly 'inbox.noMatchDescription': string;
  readonly 'inbox.readAll': string;
  readonly 'inbox.allRead': string;
  readonly 'inbox.loading': string;
  readonly 'inbox.loadFailed': string;
  readonly 'inbox.loadFailedDescription': string;
  readonly 'inbox.retry': string;
  readonly 'inbox.loadMore': string;
  readonly 'inbox.emptyAll': string;
  readonly 'inbox.empty.todo': string;
  readonly 'inbox.empty.decision': string;
  readonly 'inbox.empty.info': string;
  readonly 'inbox.emptyDescription': string;
  readonly 'inbox.unread': string;
  readonly 'inbox.unreadCount': string;
  readonly 'inbox.pendingDecisions': string;
  readonly 'inbox.resolved': string;
  readonly 'inbox.outcomes.approved': string;
  readonly 'inbox.outcomes.rejected': string;
  readonly 'inbox.outcomes.withdrawn': string;
  readonly 'inbox.count': string;
  readonly 'inbox.actionsFor': string;
  readonly 'inbox.actions.read': string;
  readonly 'inbox.actions.unread': string;
  readonly 'inbox.actions.delete': string;
  readonly 'inbox.deleted': string;
  readonly 'inbox.requestFailed': string;
  readonly 'inbox.forbidden': string;
  readonly 'inbox.nothingSelected': string;
  readonly 'inbox.back': string;
  readonly 'inbox.open': string;
  readonly 'inbox.keyMove': string;
  readonly 'inbox.keyOpen': string;
  readonly 'inbox.cancel': string;
  readonly 'inbox.request.approve': string;
  readonly 'inbox.request.reject': string;
  readonly 'inbox.request.commentPlaceholder': string;
  readonly 'inbox.request.commentFor': string;
  readonly 'inbox.request.quickSend': string;
  readonly 'inbox.request.newLine': string;
}

const enUS: InboxLocale = {
  'inbox.title': 'Inbox',
  'inbox.description': 'Notifications and requests sent to you.',
  'inbox.views.all': 'All',
  'inbox.views.todo': 'To do',
  'inbox.kinds.label': 'Type',
  'inbox.kinds.all': 'All types',
  'inbox.kinds.decision': 'Decisions',
  'inbox.kinds.info': 'Notifications',
  'inbox.tabs.decision': 'Needs my decision',
  'inbox.tabs.info': 'Notifications',
  'inbox.clearFilter': 'Clear filter',
  'inbox.noMatchDescription': 'Clear the filter to see every type.',
  'inbox.readAll': 'Mark all as read',
  'inbox.allRead': 'All marked as read.',
  'inbox.loading': 'Loading',
  'inbox.loadFailed': 'Unable to load the inbox',
  'inbox.loadFailedDescription': 'Check your connection and try again.',
  'inbox.retry': 'Retry',
  'inbox.loadMore': 'Load more',
  'inbox.emptyAll': 'Nothing here',
  'inbox.empty.todo': 'Nothing waiting for you',
  'inbox.empty.decision': 'No decisions waiting for you',
  'inbox.empty.info': 'No notifications',
  'inbox.emptyDescription':
    'Notifications and requests sent to you show up here.',
  'inbox.unread': 'Unread',
  'inbox.unreadCount': '{{count}} unread',
  'inbox.pendingDecisions': '{{count}} waiting',
  'inbox.resolved': 'Handled',
  'inbox.outcomes.approved': 'Approved',
  'inbox.outcomes.rejected': 'Rejected',
  'inbox.outcomes.withdrawn': 'Withdrawn',
  'inbox.count': '×{{count}}',
  'inbox.actionsFor': 'Actions for {{title}}',
  'inbox.actions.read': 'Mark as read',
  'inbox.actions.unread': 'Mark as unread',
  'inbox.actions.delete': 'Delete',
  'inbox.deleted': 'Deleted.',
  'inbox.requestFailed': 'The request failed. Try again.',
  'inbox.forbidden': 'You are not allowed to do this.',
  'inbox.nothingSelected': 'Select an item to view it',
  'inbox.back': 'Back to the list',
  'inbox.open': 'Open',
  'inbox.keyMove': 'Move',
  'inbox.keyOpen': 'Open',
  'inbox.cancel': 'Cancel',
  'inbox.request.approve': 'Approve',
  'inbox.request.reject': 'Reject',
  'inbox.request.commentPlaceholder': 'Write something…',
  'inbox.request.commentFor': '{{action}}: {{title}}',
  'inbox.request.quickSend': 'to send',
  'inbox.request.newLine': 'for a new line',
};

export default enUS;
