/**
 * Why a queued run waits, by the reason code the server sends (`RUN_WAIT_REASONS`), filled with its `params`
 * (`formatRunWait`). An application overrides any of them in its own resources for this namespace.
 */
const runWaitEnUS = {
  runWait: {
    reasons: {
      agentArchived: 'The agent is archived',
      delayed: 'Scheduled for {{until}}',
      noRunnerOnline: 'No runtime online',
      runnersOffline: 'Its runtimes are offline',
      toolUnavailable: 'No runtime has {{tool}} signed in',
      noSharedRunner: 'Only other people’s runtimes are online',
      missingFeatures: 'No runtime supports {{features}}',
      secretsNotAllowed:
        'Needs a team runtime: {{variables}} is for team runtimes only',
      sameWorkActive: 'After the run already on it',
      concurrencyFull: 'Concurrency full ({{active}}/{{limit}})',
      runnersBusy: 'Every fitting runtime is busy',
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
