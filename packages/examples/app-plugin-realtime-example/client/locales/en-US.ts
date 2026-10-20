import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  business: {
    scenarios: 'Realtime scenarios',
    tabs: {
      tasks: 'Tasks',
      inbox: 'Inbox',
      exports: 'Exports',
      lab: 'Capability lab',
    },
    assignee: 'Assignee',
    creator: 'Created by',
    updated: 'Last updated',
    statusLabel: 'Status',
    detail: 'Task details',
    saving: 'Saving…',
    saved: 'Task status updated',
    updating: 'Updating…',
    previous: 'Previous',
    next: 'Next',
    close: 'Close',
    cancel: 'Cancel',
    create: 'Create',
    created: 'Created task "{{title}}"',
    status: {
      open: 'To do',
      'in-progress': 'In progress',
      done: 'Done',
    },
    actions: {
      'in-progress': 'Start',
      done: 'Complete',
      open: 'Reopen',
    },
    form: {
      help: 'Describe the work and choose who should handle it.',
      title: 'Title',
      description: 'Description',
      choose: 'Choose an assignee',
      titleRequired: 'Enter a title of 1–200 characters.',
      descriptionRequired: 'Describe what needs to be done.',
      assigneeRequired: 'Choose an active assignee.',
    },
    errors: {
      session: 'Your session has ended. Sign in again.',
      forbidden:
        'You no longer have access to this task. Close it and check with its creator.',
      missing:
        'This record no longer exists. Close it or return to the current list.',
      failed: 'The request failed. Please try again.',
      active: 'An export is still running. Wait for it to finish.',
    },
    read: 'Read',
    unread: 'Unread',
    markRead: 'Mark read',
    markUnread: 'Mark unread',
    markedRead: 'Notification marked read',
    markedUnread: 'Notification marked unread',
    loadMore: 'Load more',
    jobs: {
      queued: 'Queued',
      running: 'Exporting',
      completed: 'Ready to download',
      failed: 'Failed',
    },
    tasks: {
      title: 'Task collaboration',
      description: 'Assign work and follow its progress together in real time.',
      try: 'Try two windows: create a task here, then watch it appear and change status in the other window. Only tasks you created or are assigned are visible.',
      create: 'New task',
      empty: 'No tasks yet',
      emptyHelp:
        'Create a real task, assign it to yourself or a colleague, and follow it here.',
      stageEmpty: 'No tasks in this stage on this page',
      page: 'Page {{page}} · {{count}} tasks in total. Columns show up to 30 tasks on this page.',
    },
    inbox: {
      title: 'Personal inbox',
      description:
        'Receive task assignments and updates, and keep read status in sync across windows.',
      try: 'Assign a task to yourself to receive a notification. For collaboration, use another account: updates notify the other participants. This inbox includes all your application notifications.',
      empty: 'No notifications yet',
      emptyHelp:
        'Create a task assigned to yourself in Tasks, then come back here.',
    },
    exports: {
      missing:
        'This export file is no longer available. Create a new export to download your current tasks.',
      title: 'Task exports',
      description:
        'Export your visible tasks in the background and download the resulting CSV.',
      try: 'Start an export, switch pages, then return to download it. Another window follows the same job. Progress counts real rows; a small export may finish immediately.',
      create: 'Export tasks',
      empty: 'No exports yet',
      emptyHelp:
        'Generate a CSV snapshot of your tasks, including their descriptions, status and assignees.',
      accepted: 'Export started',
      active:
        'An export is in progress. You can leave this page and come back later.',
      file: 'Tasks CSV',
      rows: '{{processed}} / {{total}} rows processed',
      progress: 'Export progress',
      limit:
        'The export exceeds 5,000 tasks. This example supports at most 5,000 rows per export.',
      failed: 'The export failed. Use Export tasks to start a new attempt.',
      download: 'Download',
      downloaded: 'CSV download started',
      retention:
        'Your latest 20 exports are retained. Each file is a snapshot of the tasks you could access when it was generated.',
    },
  },
  routeOverlay: { close: 'Close' },
  title: 'Realtime examples',
  description:
    'Explore subscriptions, access control and recovery with live events and observable snapshots.',
  scope:
    'Demo values belong to your account, live in this process only, and reset after one hour of inactivity or a server restart.',
  account: 'Current account',
  loading: 'Loading',
  working: 'Working…',
  retry: 'Retry',
  reload: 'Reload demonstration',
  signIn: 'Sign in again',
  cancel: 'Cancel',
  connection: 'Connection',
  subscription: 'Subscription',
  events: 'Events received',
  ready: 'Acknowledgements',
  snapshot: 'Observed snapshot',
  reads: 'Completed snapshot reads',
  readAt: 'Last successful read',
  waiting: 'Waiting for the first event…',
  none: 'Not available yet',
  topic: 'Topic',
  receipt: 'Last publication receipt',
  pause: 'Pause subscription',
  resume: 'Resume subscription',
  reconnect: 'Reconnect',
  states: {
    idle: 'Idle',
    connecting: 'Connecting',
    open: 'Open',
    reconnecting: 'Reconnecting',
    closed: 'Closed',
    pending: 'Pending',
    subscribing: 'Subscribing',
    subscribed: 'Subscribed',
    error: 'Error',
  },
  clock: {
    title: '1. Public topic and React hook',
    description:
      'useRealtimeTopic subscribes to the public clock. Pausing releases this card’s watch.',
    latest: 'Latest server time',
    paused: 'This card is paused. Resume to receive new ticks.',
    initial:
      'The clock starts publishing when its first subscriber is acknowledged.',
  },
  personal: {
    title: '2. Personal events',
    description:
      'publishFor targets your account. Another tab of this account receives the event; another account does not.',
    send: 'Send to my account',
    empty: 'No personal events yet. Send one to observe delivery.',
    recovery:
      'onReady reads the latest personal snapshot after every acknowledgement.',
  },
  room: {
    title: '3. Dynamic resource authorization',
    description:
      'This room uses the same owner-and-access policy for HTTP reads and realtime delivery.',
    allowed: 'Access granted',
    denied: 'Access denied',
    grant: 'Grant access',
    revoke: 'Revoke access',
    retry: 'Retry subscription',
    send: 'Publish room change',
    grantHint: 'Grant access, then retry the denied subscription.',
    retryHint: 'Access is granted. Retry to obtain a new acknowledgement.',
    revokeTitle: 'Revoke access to your demo room?',
    revokeDescription:
      'Existing subscriptions lose access and clear the room snapshot. You can grant access again.',
    blocked: 'The room snapshot is hidden while access is denied.',
    success: 'Room access updated',
  },
  counter: {
    title: '4. Coalesced refresh and catch-up',
    description:
      'Five invalidations update one counter. useRealtimeRefresh coalesces reads; compare count increases after initial readiness.',
    burst: 'Publish 5 changes',
    pause: 'Pause live refresh',
    resume: 'Resume live refresh',
    paused:
      'Snapshot refresh is paused; the event observer stays active. Publish again, then resume to catch up.',
    running:
      'Snapshot refresh is active. Hidden tabs refresh when visible again.',
    refreshing: 'Refreshing snapshot…',
    note: 'This value comes only from the read API, never from the publication response.',
  },
  unknown: {
    title: '5. Subscription errors',
    description:
      'An undeclared topic is rejected without stopping permitted topics.',
    try: 'Try an unknown topic',
    explanation:
      'TOPIC_NOT_FOUND is expected here. The server must declare a topic before it can be subscribed to.',
    initial: 'Start the attempt to observe a real protocol error.',
  },
  recovery: {
    title: '6. Connection recovery',
    description:
      'Disconnect this account’s local sockets, including other tabs. The client reconnects automatically and onReady refetches missed changes.',
    disconnect: 'Simulate disconnect',
    history: 'Recent connection states',
    note: 'Reconnect at the top reopens the shared application connection. Events are transient: snapshots recover state without replay.',
    instruction:
      'Publish changes from another tab. Resume a paused refresh to catch up; reconnect refetches snapshots while refresh is active.',
    disconnected: 'Realtime sockets disconnected',
  },
  published: 'Publication accepted',
  errors: {
    request: 'The request failed. Try again.',
    session: 'Your session has ended. Sign in again.',
    forbidden: 'Access is denied. Check your current permissions.',
    expired: 'The demonstration has expired. Reload it to create a new room.',
    capacity: 'The demonstration is busy. Try again later.',
    subscription:
      'The subscription failed. Reconnect or retry after access is restored.',
  },
};
export type RealtimeExampleResource = LocaleResource<typeof enUS>;
export default enUS;
