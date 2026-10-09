/**
 * Every word the agent queue shows, English by default. A consumer passes its own `AgentQueueLabels` (from its locale
 * resources, for instance) to `AgentQueue`. `{name}` placeholders are filled in by the item; single braces, so a
 * consumer's i18n library that interpolates `{{name}}` leaves them alone.
 */
import type {
  AgentQueueIdle,
  AgentQueueWaitKind,
  AgentQueueWaitReason,
} from './types.js';

export interface AgentQueueLabels {
  readonly summary: {
    readonly running: string;
    readonly queued: string;
    readonly waitingForMe: string;
    readonly runtimes: string;
    /** `{busy}`, `{online}`. */
    readonly runtimesValue: string;
    readonly noRuntimes: string;
    /** `{time}`. */
    readonly updated: string;
  };
  readonly onlyMine: string;
  readonly agentSwitcher: string;
  readonly lane: {
    readonly working: string;
    readonly queued: string;
    readonly waiting: string;
    readonly idle: string;
    readonly archived: string;
    readonly offline: string;
    /** `{active}`, `{max}`. */
    readonly load: string;
    readonly loadHint: string;
    readonly empty: string;
  };
  readonly sections: {
    readonly now: string;
    readonly next: string;
    readonly waiting: string;
    /** `{count}`. */
    readonly idle: string;
  };
  readonly run: {
    readonly starting: string;
    readonly hidden: string;
    readonly noActivity: string;
    /** `{tool}`. */
    readonly toolUse: string;
    /** `{text}`. */
    readonly error: string;
    /** `{attempt}`, `{max}`. */
    readonly attempt: string;
  };
  readonly queue: {
    /** `{issues}`. */
    readonly blockedBy: string;
    /** `{count}`. */
    readonly blockedCount: string;
    /** `{duration}`. */
    readonly waited: string;
    /** `{max}` for `concurrencyFull`, `{tool}` for tool waits, `{features}`, `{time}` for `delayed`. */
    readonly reasons: Readonly<
      Record<Exclude<AgentQueueWaitReason, 'toolSlotsFull'>, string> & {
        /** Optional for existing translations; falls back to the English default. */
        readonly toolSlotsFull?: string;
      }
    >;
  };
  readonly wait: {
    readonly kinds: Readonly<Record<AgentQueueWaitKind, string>>;
    /** `{names}`. */
    readonly waitingFor: string;
    readonly you: string;
    readonly forYou: string;
    readonly handle: string;
  };
  readonly idle: {
    readonly backlog: string;
    readonly noAutoRun: string;
    readonly neverRan: string;
    /** `{time}`, how long ago it ended. */
    readonly lastRun: Readonly<
      Record<NonNullable<AgentQueueIdle['lastRun']>['status'], string>
    >;
    /** Instead of "Start" where nothing may start: what to do first. */
    readonly backlogHint: string;
    readonly start: string;
  };
  readonly mine: string;
  readonly truncated: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly emptyMineTitle: string;
  readonly showAll: string;
}

export const defaultAgentQueueLabels: AgentQueueLabels = {
  summary: {
    running: 'Running',
    queued: 'Queued',
    waitingForMe: 'Waiting for you',
    runtimes: 'Runtimes',
    runtimesValue: '{busy} busy · {online} online',
    noRuntimes: 'None online',
    updated: 'Updated {time}',
  },
  onlyMine: 'Only mine',
  agentSwitcher: 'Agents',
  lane: {
    working: 'Working',
    queued: 'Queued',
    waiting: 'Waiting for reply',
    idle: 'Idle',
    archived: 'Archived',
    offline: 'No runtime online',
    load: '{active}/{max}',
    loadHint: 'Runs it holds now, of the most it may hold at once',
    empty: 'Nothing running or queued',
  },
  sections: {
    now: 'Now',
    next: 'Up next',
    waiting: 'Waiting for reply',
    idle: 'Assigned, idle · {count}',
  },
  run: {
    starting: 'Starting',
    hidden: 'Someone else’s run',
    noActivity: 'No activity reported yet',
    toolUse: 'Using {tool}',
    error: 'Error: {text}',
    attempt: 'Attempt {attempt}/{max}',
  },
  queue: {
    blockedBy: 'Blocked by {issues}',
    blockedCount: 'Blocked by {count} issues',
    waited: 'Queued {duration}',
    reasons: {
      agentArchived: 'The agent is archived',
      delayed: 'Scheduled for {time}',
      noRunnerOnline: 'No runtime online',
      runnersOffline: 'Its runtimes are offline',
      toolUnavailable: 'No runtime has {tool} signed in',
      noSharedRunner: 'Only other people’s runtimes are online',
      missingFeatures: 'No runtime supports {features}',
      sameWorkActive: 'After the run already on it',
      concurrencyFull: 'Concurrency full ({max})',
      runnersBusy: 'Every fitting runtime is busy',
      toolSlotsFull: 'Every fitting runtime has its {tool} slots full',
      setupRetrying: 'Preparing it failed; retrying',
      next: 'Next for a free runtime',
    },
  },
  wait: {
    kinds: {
      failedRun: 'Failed run',
      approval: 'Approval',
      proposal: 'Proposal',
      question: 'Question',
      review: 'Review',
    },
    waitingFor: 'Waiting for {names}',
    you: 'you',
    forYou: 'Waiting for you',
    handle: 'Handle',
  },
  idle: {
    backlog: 'In backlog; it does not start on its own',
    noAutoRun: 'This status does not wake the agent',
    neverRan: 'Not run yet',
    lastRun: {
      completed: 'Last run completed · {time}',
      failed: 'Last run failed · {time}',
      cancelled: 'Last run cancelled · {time}',
    },
    backlogHint: 'Move it out of backlog first',
    start: 'Start',
  },
  mine: 'Yours',
  truncated:
    'Showing the most recently updated issues only. Narrow the filters to see the rest.',
  emptyTitle: 'No agents yet',
  emptyDescription:
    'Agents you may give work to show here with what they are doing.',
  emptyMineTitle: 'Nothing of yours is with an agent',
  showAll: 'Show everything',
};

/** Fills `{name}` placeholders. */
export function fill(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/gu, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}
