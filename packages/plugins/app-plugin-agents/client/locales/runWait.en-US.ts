/**
 * Why a queued run waits, by the reason code the server sends (`RUN_WAIT_REASONS`), filled with its `params`
 * (`formatRunWait`). An application overrides any of them in its own resources for this namespace.
 */
const runWaitEnUS = {
  runWait: {
    capacity:
      'Slots used here {{used}}/{{limit}}; {{detail}}; reported free across apps {{reportedFree}}',
    reasons: {
      updatePending: 'Runner waiting for update; new work is paused',
      pruning: 'Runner cleaning shared store; new work is paused',
      toolNotInstalled: 'No connected runner has this tool installed',
      incompatible:
        'Connected runners do not support this workload; upgrade required',
      restricted: 'Runner policy, directory, or variable restrictions',
      unknown: 'Workload eligibility is not established',

      agentArchived: 'The agent is archived',
      delayed: 'Scheduled for {{until}}',
      noRunnerOnline: 'No runtime online',
      runnersOffline: 'Its runtimes are offline',
      toolUnavailable:
        'Tool not signed in, disabled, or requested model unavailable ({{tool}})',
      noSharedRunner: 'Only other people’s personal runners are online',
      missingFeatures: 'No runtime supports {{features}}',
      secretsNotAllowed:
        'Needs a shared runtime: {{variables}} is for shared runtimes only',
      sameWorkActive: 'After the run already on it',
      concurrencyFull: 'Concurrency full ({{active}}/{{limit}})',
      runnersBusy: 'Compatible runners are full',
      toolSlotsFull: '{{tool}} slots full ({{used}}/{{limit}})',
      setupRetrying: 'Preparing it failed; retrying: {{detail}}',
      next: 'Next for a free runtime',
    },
    /** A reason this version does not know, such as one a newer server sends. */
    unknown: 'Queued ({{reason}})',
    /** When a parameter the text names was not sent. */
    unknownValue: '—',
  },
};

export type RunWaitLocale = typeof runWaitEnUS;

export default runWaitEnUS;
