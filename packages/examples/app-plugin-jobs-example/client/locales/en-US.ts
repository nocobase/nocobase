const messages = {
  authorization: {
    title: 'Jobs example schedules',
    update: 'Start and stop rules',
  },
  navigation: {
    group: 'Jobs example',
    jobs: 'One-off jobs',
    schedules: 'Schedules',
  },
  jobs: {
    title: 'Background jobs',
    description:
      'Each job waits in the queue, then works for ten seconds and reports 10% of progress every second. Progress arrives over WebSocket while this page is open.',
    create: 'Create job',
    creating: 'Creating…',
    listTitle: 'Your jobs',
    count: '{{count}} jobs',
    empty: 'No jobs yet. Create one to watch its progress.',
    loading: 'Loading…',
    job: 'Job {{id}}',
    createdAt: 'Created {{time}}',
    attempt: 'Attempt {{attempt}}',
    progress: 'Progress',
    live: 'Live',
    offline: 'Reconnecting',
  },
  schedules: {
    title: 'Schedules',
    description:
      'Recurring rules on a ScheduleExecutor. Every rule this page can start is defined in code, so its handler is registered before the executor starts — a rule started before a restart keeps running after it. Changes arrive over WebSocket while this page is open.',
    listTitle: 'Rules',
    loading: 'Loading…',
    start: 'Start',
    stop: 'Stop',
    builtIn: 'Built in',
    every: 'Every {{seconds}}s',
    cron: 'Cron {{cron}} (UTC)',
    limit: 'at most {{limit}} times',
    nextRun: 'Next run in {{seconds}}s',
    nextRunDue: 'Next run due now',
    noNextRun: 'No further runs',
    firings: '{{count}} runs on this instance',
    delay: 'started {{ms}} ms late',
    noRuns: 'No runs yet.',
    live: 'Live',
    offline: 'Reconnecting',
    rule: {
      heartbeat: 'Heartbeat',
      interval: 'Interval',
      limited: 'Limited',
      cron: 'Cron',
    },
    ruleDescription: {
      heartbeat:
        'The plugin writes this rule on every start and never stops it.',
      interval:
        'Switch the interval while it runs; the next run is planned from the new one.',
      limited: 'Ends by itself after five runs. Start it again for five more.',
      cron: 'Runs at the start of every minute.',
    },
    state: {
      active: 'Active',
      ended: 'Ended',
      stopped: 'Stopped',
    },
    outcome: {
      running: 'Running',
      succeeded: 'Succeeded',
      failed: 'Failed',
    },
  },
  status: {
    queued: 'Queued',
    running: 'Running',
    completed: 'Completed',
    failed: 'Failed',
  },
};

export default messages;
