import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  // Titles the server registers with the authorization catalog, which resolve in this plugin's namespace.
  authorization: { title: 'Schedules', read: 'Read', manage: 'Manage' },
  nav: { automation: 'Automation', schedules: 'Schedules' },
  page: {
    title: 'Schedules',
    description:
      'Tasks that plugins and the application define in code and run on a timetable. See when they run and how each run ended, and pause or resume them. Their rules live in code; this page cannot create or change them.',
    loadFailed: 'Could not load the schedules.',
    retry: 'Retry',
    close: 'Close',
    copy: 'Copy',
    copied: 'Copied',
    loadMore: 'Load more',
    none: '—',
    tabs: { tasks: 'Tasks', runs: 'Runs', config: 'Configuration' },
  },
  tasks: {
    attention: {
      title_one: '{{count}} item needs attention',
      title_other: '{{count}} items need attention',
      target:
        'The target {{target}} of “{{title}}” is unavailable ({{state}}), so every firing is recorded as skipped.',
      waiting:
        'The run of “{{title}}” started {{time}} is still waiting for its result.',
      failed: 'The latest run of “{{title}}” ended as {{status}}.',
    },
    stats: {
      total: 'Schedules',
      running: 'Running',
      attention: 'Need attention',
      next: 'Next run',
      nextOf: 'Next run · {{title}}',
    },
    filters: {
      all: 'All',
      running: 'Running',
      attention: 'Need attention',
      paused: 'Paused',
      removed: 'Removed from code',
      search: 'Search by name or key',
    },
    columns: {
      task: 'Task',
      rule: 'Rule',
      next: 'Next run',
      last: 'Last run',
      totals: 'Totals',
      state: 'Status',
      enabled: 'Enabled',
    },
    totals: 'Ran {{runs}} · succeeded {{succeeded}}',
    noMatch: 'No schedule matches these filters.',
    enable: 'Resume “{{title}}”',
    disable: 'Pause “{{title}}”',
    toggleFailed: 'Could not change the schedule.',
    readOnly: 'You can view schedules but not pause or resume them.',
    notes: {
      running:
        '“Running” only means the schedule is enabled and its target exists; each run’s result tells whether the work succeeded. Totals count every firing, including failures and skips.',
      pause:
        'Pausing affects later runs only. Code updates and redeployments keep the switch as it is.',
      removed:
        '“Removed from code”: after `scheduler sync --finalize`, schedules no longer in code are marked so; their history stays and they cannot be resumed.',
      internal:
        'Internal background jobs, such as notification retries, mail synchronization, knowledge indexing and agent run cleanup, are not listed here; their plugins manage them.',
    },
  },
  state: {
    running: 'Running',
    paused: 'Paused',
    unavailable: 'Target unavailable',
    removed: 'Removed from code',
  },
  targetState: {
    ready: 'Available',
    disabled: 'Disabled',
    missing: 'Missing',
    invalid: 'Invalid configuration',
  },
  pause: {
    title: 'Pause “{{title}}”?',
    description: 'It stops running on time until someone resumes it.',
    running: 'Runs already started or waiting for a result are not cancelled.',
    missed:
      'After resuming it continues from the next planned time; runs missed while paused are not made up.',
    redeploy: 'A redeployment does not resume it.',
    limit: 'For a schedule with a run limit, the runs so far keep counting.',
    cancel: 'Cancel',
    confirm: 'Pause',
  },
  empty: {
    title: 'No schedules yet',
    description:
      'Schedules are defined in code with `defineSchedule` by plugins or the application. Install a plugin that defines schedules, or define one in the application and restart, and they appear here.',
    internal:
      'Internal background jobs, such as notification retries, mail synchronization and knowledge indexing, are not listed here; they keep running on their own rules.',
  },
  detail: {
    back: 'Schedules',
    notFound: 'This schedule does not exist.',
    key: 'Key',
    rule: 'Rule',
    upcoming: 'Next runs',
    noUpcoming: 'None planned',
    window: 'Window · run limit',
    unlimited: 'Unlimited',
    windowFrom: 'from {{time}}',
    windowTo: 'until {{time}}',
    limit_one: '{{count}} run',
    limit_other: '{{count}} runs',
    target: 'Target',
    totals: 'Totals',
    source: 'Defined in',
    sourceCode:
      'Code (`defineSchedule`). To change the rule or the target, change the code and redeploy.',
    runs: 'Runs',
    noRuns: 'No runs yet.',
    runsNote:
      'Runs are listed newest first. A run’s target configuration is never returned or shown. An execution count above 1 means the same run was delivered again; it still counts as one run.',
  },
  runs: {
    allTasks: 'All schedules',
    groups: {
      all: 'All',
      failed: 'Failed · timed out',
      waiting: 'Waiting for result',
      skipped: 'Skipped',
      succeeded: 'Succeeded',
    },
    ranges: {
      day: 'Last 24 hours',
      week: 'Last 7 days',
      month: 'Last 30 days',
      quarter: 'Last 90 days',
    },
    columns: {
      planned: 'Planned time',
      task: 'Schedule',
      result: 'Result',
      reason: 'Reason · related',
      executions: 'Executions',
      duration: 'Duration',
      summary: 'Result summary',
    },
    noRuns: 'No runs match these filters.',
    notes: {
      order:
        'Runs of every schedule, newest first. Failures, timeouts and long waits also show at the top of the Tasks tab.',
      removed: 'Schedules removed from code keep their history here.',
    },
  },
  status: {
    pending: 'Queued',
    running: 'Running',
    waiting: 'Waiting for result',
    succeeded: 'Succeeded',
    failed: 'Failed',
    skipped: 'Skipped',
    cancelled: 'Cancelled',
    timed_out: 'Timed out',
    triggered: 'Triggered (older record)',
  },
  reason: {
    'target-missing': 'The target does not exist',
    'target-disabled': 'The target is disabled',
    'target-invalid': 'The target’s configuration is invalid',
    'target-not-found': 'The target type is not registered',
    'invalid-config': 'The target’s configuration is invalid',
    'dispatch-failed': 'Failed while starting; see the server log',
    'observer-failed': 'Checking the target’s result failed',
    'observer-unavailable': 'The target cannot report its result',
  },
  run: {
    title: '{{title}} · {{time}}',
    timeline: 'Timeline',
    started: 'Started',
    accepted: 'Accepted by the target',
    finished: 'Finished',
    notYet: 'No result yet',
    executions: 'Executions',
    target: 'Target',
    related: 'Related',
    receipt: 'Receipt',
    summary: 'Result summary',
    reason: 'Reason',
    waitingNote:
      'While a run waits for its result, the scheduler asks the target for its state until it reports success, failure, cancellation or a timeout. The scheduler sets no timeout itself; the target decides. When a run waits long, open the related item to see its progress.',
  },
  config: {
    memory:
      'Schedules run in this instance’s memory: suited to a single instance only.',
    memoryHint:
      'With one instance there is nothing to change; to run several, follow “Switch to Redis” below.',
    shared: 'Schedules run on {{adapter}}: several instances can run them.',
    columns: {
      setting: 'Setting',
      value: 'Current value',
      effect: 'Effect on schedules',
      source: 'Source',
    },
    sources: {
      environment: 'Environment variable',
      config: 'config.yml',
      default: 'Default',
      backend: 'Set by the backend',
    },
    rows: {
      configuration: 'Jobs configuration',
      backend: 'Backend',
      multiInstance: 'Multiple instances',
      concurrency: 'Concurrency',
      attempts: 'Attempts',
      connection: 'Connection',
    },
    builtIn: 'Built-in memory',
    selectedByScheduler:
      'Chosen by `scheduler.jobs` (`SCHEDULER_JOBS`) for schedules alone.',
    selectedByDefault:
      '`scheduler.jobs` is not set, so schedules follow `jobs.default`.',
    selectedByBuiltIn:
      'Neither `scheduler.jobs` nor `jobs.default` is set, so the built-in default applies.',
    memoryBackend: 'memory (this instance)',
    memoryEffect:
      'Rules live in this process’s memory and are written to {{path}} when it stops normally.',
    sharedEffect: 'Rules live in {{adapter}}, shared by every instance.',
    plugin: '{{plugin}} registered',
    supported: 'Supported',
    unsupported: 'Not supported',
    multiSupported:
      'Each firing runs on one instance; when an instance crashes, a run may occasionally be delivered again.',
    multiUnsupported:
      'Every instance runs each schedule on its own, so the same task runs several times.',
    concurrencyEffect_one:
      'One run at a time; a slow run makes others that fall due wait.',
    concurrencyEffect_other:
      'Up to {{count}} runs at a time; more wait in line.',
    attemptsOk: 'Correct',
    attemptsWarn: 'Should be 1',
    attemptsEffect:
      'A failed run is recorded as failed and the schedule runs again at its next time; keep this at 1.',
    attemptsWarnEffect:
      'A failed run is already recorded, so a retry of the same run does nothing; set attempts to 1.',
    connectionValue: '{{connection}} · namespace {{namespace}}',
    namespaceOnly: 'namespace {{namespace}}',
    connectionEffect: 'The password is never shown.',
    redis: {
      title: 'Switch to Redis (for several instances)',
      step1:
        'Install the commercial plugin `@nocobase/app-plugin-jobs-redis` and register it on every instance.',
      step2:
        'Add a Redis backend to `config.yml` and point schedules at it (snippet below).',
      step3:
        'Redeploy every instance, then come back and check that “Multiple instances” says Supported.',
      warning:
        'If the name is wrong, the plugin is not registered or Redis cannot be reached, the application does not start; it never falls back to memory.',
    },
    removed: {
      title: 'Schedules removed from code',
      consistent: 'Consistent, nothing to do.',
      consistentHint:
        'When a schedule is deleted from code and deployed, it is listed here with how to clean it up.',
      warning_one:
        '{{count}} schedule is no longer in this version’s code but has not been cleaned up.',
      warning_other:
        '{{count}} schedules are no longer in this version’s code but have not been cleaned up.',
      warningHint:
        'They do not run when due (the log shows “A schedule fired that this instance has no definition for”), yet the task list shows them as usual.',
      columns: { task: 'Schedule', last: 'Last run', after: 'After cleanup' },
      after: 'Marked “Removed from code”, never fires again, history kept.',
      neverRan: 'Never ran',
      how: 'How to clean up',
      howHint:
        'Once every instance runs the new version, run this once on any server:',
      why: 'Why not automatically: during a rolling deployment old and new versions run side by side, and an automatic cleanup could remove schedules the old version still uses.',
      full: 'Run it only on a complete build that includes every plugin; otherwise the schedules of plugins it did not load are marked removed too.',
    },
    readOnly:
      'This page is read-only: these settings live in the application’s configuration and take effect on redeployment.',
  },
  cron: {
    everyMinute: 'Every minute',
    everyMinutes: 'Every {{count}} minutes',
    everyHour: 'Every hour at minute {{minute}}',
    everyHours: 'Every {{count}} hours',
    daily: 'Every day at {{time}}',
    weekdays: 'Every weekday at {{time}}',
    weekly: 'Every {{day}} at {{time}}',
    monthly: 'Day {{day}} of every month at {{time}}',
  },
};

/** English is the source of truth for this plugin's locale shape. */
export type SchedulerResource = LocaleResource<typeof enUS>;

export default enUS;
