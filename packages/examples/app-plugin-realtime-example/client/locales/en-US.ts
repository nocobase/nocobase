import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
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
    forbidden: 'Access is denied. Check the room access setting.',
    expired: 'The demonstration has expired. Reload it to create a new room.',
    capacity: 'The demonstration is busy. Try again later.',
    subscription:
      'The subscription failed. Reconnect or retry after access is restored.',
  },
};
export type RealtimeExampleResource = LocaleResource<typeof enUS>;
export default enUS;
