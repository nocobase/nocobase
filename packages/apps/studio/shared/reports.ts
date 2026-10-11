/**
 * Studio's reports: the dashboard page, as the browser and Studio's API exchange it, and the acceptance
 * metrics and usage (grouped as the agents plugin groups them, with Studio's names for its groupings) that the CLI's
 * `report` commands print, assembled from the agents plugin's run figures and the projects plugin's issue figures.
 *
 * | Method | Path                | Query                         | Answer                         |
 * | ------ | ------------------- | ----------------------------- | ------------------------------ |
 * | GET    | `reports/dashboard` | `days` (7, 30 or 90)          | `{ data: DashboardReport }`    |
 * | GET    | `reports/attention` |                               | `{ data: DashboardAttention }` |
 * | GET    | `reports/metrics`   | `from`, `to`, `projectId`     | `{ data: MetricsReport }`      |
 *
 * All need the reports grant (page `reports`); they count every run with `agents.agents` read, otherwise the runs
 * the caller started or owns, and only runs and issues the caller may see. The usage page is the agents plugin's.
 */
import type {
  Costs,
  UsageReport as AgentsUsageReport,
} from '@nocobase/app-plugin-agents/shared/reports';

export const REPORT_ROUTES = {
  dashboard: 'reports/dashboard',
  attention: 'reports/attention',
  metrics: 'reports/metrics',
} as const;

/** The periods the dashboard compares, in days; each against the same number of days before it. */
export const DASHBOARD_PERIODS = [7, 30, 90] as const;

export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

/**
 * The dashboard's figures over one period. An issue is completed when it enters a `done`-category status (the last
 * time it did, if it did more than once); it was started when it first entered a `started`-category status, or when it
 * was created in one.
 */
export interface DashboardFigures {
  /** Throughput: the issues completed in the period. */
  readonly completed: number;
  /** Median cycle time: started → completed of the issues completed in the period that were started; null without. */
  readonly cycleTimeP50Ms: number | null;
  /** Of the issues completed, the share an agent executes (the issue's executor is an agent); null without any. */
  readonly agentShare: number | null;
  /** The cost of the agents' usage reported in the period over the issues completed in it; null without either. */
  readonly costPerIssue: Costs | null;
  /** Runs queued in the period. */
  readonly runs: number;
  /** Of the runs queued in the period that ended completed or failed, the share that completed. */
  readonly successRate: number | null;
  /**
   * Rework rate: the agent-executed issues sent back in the period — from In review, or from a done status, back to an
   * unstarted or started status other than In review — over the agent-executed issues completed in it.
   */
  readonly reworkRate: number | null;
  /** All runs (any time, any outcome) on the agent-executed issues completed in the period, per such issue. */
  readonly runsPerIssue: number | null;
  /**
   * Human-intervention rate: of the runs on issues queued in the period that ended (completed or failed), the share
   * during which the agent moved its issue to Blocked, which is how an agent asks the issue's owner. Runs have no
   * waiting-for-input state of their own, so this is the only signal.
   */
  readonly interventionRate: number | null;
  /** Median queue wait: queued → claimed by a runner (or the server) of the runs queued in the period. */
  readonly queueWaitP50Ms: number | null;
}

/** One day of the dashboard's period. */
export interface DashboardDay {
  /** `YYYY-MM-DD` (UTC). */
  readonly day: string;
  readonly completed: number;
  readonly completedByAgents: number;
  /** Median cycle time of the issues completed that day; null without a started one. */
  readonly cycleTimeP50Ms: number | null;
  /** The cost of the usage reported that day, in the report's currency. */
  readonly cost: number;
  /** The runs queued that day, by how they ended so far. */
  readonly runsCompleted: number;
  readonly runsFailed: number;
  readonly runsCancelled: number;
  /** Queued, claimed or running still. */
  readonly runsOpen: number;
}

/**
 * A stretch of the period for the headline figures' sparklines: single days over 7 days, 3 days over 30 and weeks over
 * 90, the last ending today, so a sparse period still draws a line. Each figure is worked out as for the whole period.
 */
export interface DashboardBucket {
  /** `YYYY-MM-DD`, both inclusive. */
  readonly from: string;
  readonly to: string;
  readonly completed: number;
  readonly cycleTimeP50Ms: number | null;
  readonly agentShare: number | null;
  /** In the report's currency; null without a completed issue or a cost. */
  readonly costPerIssue: number | null;
}

/** How many days a sparkline point covers, by period. */
export const BUCKET_DAYS: Readonly<Record<DashboardPeriod, number>> = {
  7: 1,
  30: 3,
  90: 7,
};

/** One visible project over the period (the dashboard's "By project"). */
export interface DashboardProject {
  readonly id: string;
  readonly name: string;
  /** The live issues now, but those closed (cancelled), and of them those done. */
  readonly total: number;
  readonly done: number;
  /** Issues completed in the period. */
  readonly completed: number;
  readonly cycleTimeP50Ms: number | null;
  /** Live issues now in Blocked. */
  readonly blocked: number;
}

/** `GET reports/dashboard`: the last `days` days up to today (UTC), against the `days` before them. */
export interface DashboardReport {
  readonly days: DashboardPeriod;
  readonly from: string;
  readonly to: string;
  /** False without issue figures (no projects plugin): the issue figures stay empty. */
  readonly subjects: boolean;
  /** The currency of the costs (the first in use; US dollars without any). */
  readonly currency: string;
  readonly current: DashboardFigures;
  readonly previous: DashboardFigures;
  /** Every day of the period, oldest first. */
  readonly daily: readonly DashboardDay[];
  /** The period in stretches of `BUCKET_DAYS`, oldest first. */
  readonly buckets: readonly DashboardBucket[];
  /** Every project the viewer may see but cancelled ones, those with work completed in the period first. */
  readonly projects: readonly DashboardProject[];
}

/** The most items each list of `DashboardAttention` carries. */
export const ATTENTION_LIMIT = 5;

/** A pull request waits for review once it has been open longer than this many days. */
export const REVIEW_WAIT_DAYS = 2;

/** An issue the dashboard points at. */
export interface AttentionIssueItem {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  /** Blocked: its last activity; overdue: its due date (`YYYY-MM-DD`). */
  readonly since: string;
}

export interface AttentionPullRequest {
  readonly id: string;
  /** `owner/name`. */
  readonly repo: string;
  readonly number: number;
  readonly title: string;
  readonly url: string;
  /** When Studio first saw it open: the host's own creation time and review state are not kept. */
  readonly since: string;
  /** The issue it is linked to (the first visible one). */
  readonly issue: { readonly id: string; readonly identifier: string };
}

export interface AttentionRun {
  readonly id: string;
  readonly agentId: string;
  readonly agentName: string | null;
  readonly failureReason: string | null;
  readonly finishedAt: string;
  readonly issue: {
    readonly id: string;
    readonly identifier: string;
    readonly title: string;
  };
}

export interface AttentionList<T> {
  readonly total: number;
  /** At most `ATTENTION_LIMIT`. */
  readonly items: readonly T[];
}

/**
 * `GET reports/attention`: the exceptions now, over what the viewer may see — issues in Blocked (the longest first),
 * issues past their due date that are neither done nor closed (the earliest due first), open non-draft pull requests
 * linked to an issue and open longer than `REVIEW_WAIT_DAYS` (the oldest first), and runs on issues that failed in the
 * last 24 hours and were not retried (the newest first).
 */
export interface DashboardAttention {
  /** False without issue figures (no projects plugin): every list stays empty. */
  readonly subjects: boolean;
  readonly blocked: AttentionList<AttentionIssueItem>;
  readonly overdue: AttentionList<AttentionIssueItem>;
  readonly reviewWaits: AttentionList<AttentionPullRequest>;
  readonly failedRuns: AttentionList<AttentionRun>;
}

/**
 * How the usage report groups runs; `person` is who woke the agent (the run's actor), `type` the agent's type (`online`
 * on the server, `runner` on a runner).
 */
export const USAGE_GROUP_BYS = [
  'agent',
  'person',
  'project',
  'issue',
  'day',
  'model',
  'tool',
  'type',
] as const;

export type UsageGroupBy = (typeof USAGE_GROUP_BYS)[number];

/** Studio's grouping as the agents plugin names it: a project is a run's group, an issue its subject. */
export const AGENTS_GROUP_BY: Readonly<
  Record<UsageGroupBy, AgentsUsageReport['groupBy']>
> = {
  agent: 'agent',
  person: 'person',
  project: 'group',
  issue: 'subject',
  day: 'day',
  model: 'model',
  tool: 'tool',
  type: 'type',
};

/** The CLI's `report usage`. */
export type UsageReport = Omit<AgentsUsageReport, 'groupBy'> & {
  readonly groupBy: UsageGroupBy;
};

export interface UsageQuery {
  readonly from?: string;
  readonly to?: string;
  readonly groupBy?: UsageGroupBy;
  readonly projectId?: string;
  readonly agentId?: string;
  readonly userId?: string;
}

/** The metrics a target is set for. */
export type MetricTargetKey =
  | 'aiShare'
  | 'reviewPassRate'
  | 'claimLatencyP50Ms'
  | 'lostRuns'
  | 'decisionResolveP50Ms';

/** A metric's target: the value must be at least (`min`) or at most (`max`) `value`. */
export interface MetricTarget {
  readonly rule: 'min' | 'max';
  readonly value: number;
}

export const METRIC_TARGETS: Readonly<Record<MetricTargetKey, MetricTarget>> = {
  aiShare: { rule: 'min', value: 0.5 },
  reviewPassRate: { rule: 'min', value: 0.7 },
  claimLatencyP50Ms: { rule: 'max', value: 3_000 },
  lostRuns: { rule: 'max', value: 0 },
  decisionResolveP50Ms: { rule: 'max', value: 24 * 3600 * 1000 },
};

/** `ok` on target, `warn` off it, `n/a` without data. */
export type MetricStatus = 'ok' | 'warn' | 'n/a';

export interface MetricsReport {
  readonly from: string;
  readonly to: string;
  readonly projectId: string | null;
  readonly generatedAt: string;
  /** False when the issue figures are not available (no projects plugin): only runs and cost are measured. */
  readonly subjects: boolean;
  /** Whether the team works here: days and ISO weeks with an issue, a comment or a run; issues; comments; people. */
  readonly adoption: {
    readonly activeWeeks: number;
    readonly activeDays: number;
    readonly issuesCreated: number;
    readonly commentsCreated: number;
    readonly activeMembers: number;
  };
  /** Issues that entered a done status, and those of them an agent executed. */
  readonly aiShare: {
    readonly share: number | null;
    readonly deliveredByAgent: number;
    readonly deliveredTotal: number;
    readonly byAgent: readonly {
      readonly agentId: string;
      readonly name: string | null;
      readonly count: number;
    }[];
  };
  /** How often what agents hand in is accepted. */
  readonly trust: {
    /** Exits from review to a done status, over every exit from review. */
    readonly reviewPassRate: number | null;
    /** Approval requests approved, over those approved or rejected. */
    readonly approvalApproveRate: number | null;
    /** Exits from review back to in progress, over every exit from review. */
    readonly reworkRate: number | null;
  };
  /** Runs started in the range: failures, how fast a runner took them, how long they ran, and runs lost. */
  readonly reliability: {
    readonly runs: number;
    readonly completedRuns: number;
    readonly failedRuns: number;
    readonly failuresByReason: Readonly<Record<string, number>>;
    /** Created → dispatched (time to first claim). */
    readonly claimLatencyP50Ms: number | null;
    readonly claimLatencyP95Ms: number | null;
    /** Started → finished, of runs that completed or failed. */
    readonly runDurationP50Ms: number | null;
    /** Held by a runner with nothing reported for three hours. */
    readonly lostRuns: number;
  };
  readonly cost: {
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly estimatedCost: Costs | null;
    readonly costPerDeliveredIssue: Costs | null;
    readonly byAgent: readonly {
      readonly agentId: string;
      readonly name: string | null;
      readonly cost: Costs | null;
    }[];
    /** By agent type: Online (on the server, by token) and Runner (on runners), each when it ran in the range. */
    readonly byType: readonly {
      readonly type: 'online' | 'runner';
      readonly runs: number;
      readonly inputTokens: number;
      readonly outputTokens: number;
      readonly cost: Costs | null;
    }[];
  };
  /**
   * The decisions people take — approval requests, operation plans, deployment requests, pull requests to merge,
   * failed runs — how fast they are decided, and how they end.
   */
  readonly humanLoad: {
    readonly decisionsCreated: number;
    readonly decisionsResolved: number;
    readonly decisionResolveP50Ms: number | null;
    readonly openDecisions: number;
    readonly byOutcome: Readonly<Record<string, number>>;
    /** The decisions asked in the range, by kind (`approvals`, `plans`, `deployRequests`, `merges`, `failedRuns`, `other`). */
    readonly byKind: Readonly<Record<string, number>>;
  };
  readonly statuses: Readonly<Record<MetricTargetKey, MetricStatus>>;
}

export interface MetricsQuery {
  readonly from?: string;
  readonly to?: string;
  readonly projectId?: string;
}
