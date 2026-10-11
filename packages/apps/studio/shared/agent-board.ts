/**
 * What the agents are doing (`GET /api/agentBoard`), for the issues pages' Agent queue: the issues agents are
 * involved in, seen from the agents' side, with where each agent stands on them: waiting for a person, working,
 * queued, or assigned with nothing going on; and the agents the viewer may see, those with nothing to do included.
 * Issues no agent is involved in are not part of it. Studio composes it, because only Studio knows that a run
 * on an issue is an agent working on that issue: the issues come from the projects plugin, the runs and the queue from
 * the agents plugin, the decisions from Studio's inbox (`server/agents/board.ts`).
 */
import type { I18nText } from '@nocobase/app-plugin-agents/shared/i18n';
import type {
  RunActivity,
  RunnerLoad,
  RunWait,
} from '@nocobase/app-plugin-agents/shared/runs';
import type {
  IssueListItem,
  StatusDefinition,
} from '@nocobase/app-plugin-projects/shared/issues';

/**
 * Where agents stand with an issue, in the order the view shows its sections: waiting for a person first (the most
 * actionable), then working, queued, and assigned with nothing going on. An issue shows once, in the first of these
 * that holds for it.
 */
export const AGENT_BOARD_STATES = [
  'waiting',
  'working',
  'queued',
  'idle',
] as const;

export type AgentBoardState = (typeof AGENT_BOARD_STATES)[number];

/**
 * What an agent waits for a person on, in the order one is chosen when several hold:
 *
 * - `failedRun`: its run failed for good and the failed-run card waits for a decision (retry, reassign or cancel);
 * - `approval`: it asked to move the issue and the move waits for an approver;
 * - `proposal`: its design proposal waits in Proposal review for the owner, decided in the issue's design section;
 * - `question`: it put the issue in Blocked, its way of asking the owner;
 * - `review`: it handed the issue over for review (In review) and nobody answered yet.
 */
export const AGENT_WAIT_KINDS = [
  'failedRun',
  'approval',
  'proposal',
  'question',
  'review',
] as const;

export type AgentWaitKind = (typeof AGENT_WAIT_KINDS)[number];

/**
 * Why an agent is assigned an issue with nothing going on, in the order one is chosen when several hold:
 *
 * - `backlog`: the issue is in backlog, where nothing starts; it starts when it leaves backlog;
 * - `lastRun`: the agent ran on it and the run ended (completed, failed with its card settled, or cancelled), and
 *   nothing woke it since;
 * - `noAutoRun`: it never ran, and its status has no rule that runs an agent on entering it;
 * - `neverRan`: it never ran (it was given without starting).
 *
 * An issue an agent executes that waits for unfinished issues is queued behind them, not idle.
 */
export const AGENT_IDLE_REASONS = [
  'backlog',
  'lastRun',
  'noAutoRun',
  'neverRan',
] as const;

export type AgentIdleReason = (typeof AGENT_IDLE_REASONS)[number];

export interface AgentBoardIdle {
  readonly reason: AgentIdleReason;
  /** For `lastRun`: how the agent's newest run on the issue ended, and when. */
  readonly lastRun: {
    readonly status: 'completed' | 'failed' | 'cancelled';
    readonly at: string;
  } | null;
  /**
   * Whether the viewer may start the agent's work now (`POST /api/agentBoard/issues/:issueId/start`): not in backlog,
   * and they may edit issues and wake the agent.
   */
  readonly mayStart: boolean;
}

/** What "Start" on an idle issue did: whether the agent's work started, else why not (`RunAttemptSkip`). */
export interface AgentBoardStartResult {
  readonly started: boolean;
  readonly skipped: string | null;
}

/** Filters that narrow the issues, by the issue list's own names. */
export interface AgentBoardQuery {
  readonly q?: string;
  readonly projectId?: string;
  readonly labelId?: string;
  readonly ownerUserId?: string;
  readonly executorId?: string;
}

/** A run on the issue as far as the viewer may see it: the details are left out of a run that does not involve them. */
export interface AgentBoardRun {
  /** Null when the viewer may not see the run. */
  readonly id: string | null;
  readonly status: 'queued' | 'dispatched' | 'running';
  /** Since when it works (held) or waits (queued). */
  readonly since: string;
  /** What woke the agent (`studioAgents.triggers`); null when unknown or hidden. */
  readonly trigger: string | null;
  readonly runnerName: string | null;
  /** The coding tool and model the run works with (an entry of the agent's list), once claimed; null when hidden. */
  readonly tool: string | null;
  readonly model: string | null;
  readonly lastActivity: RunActivity | null;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly priority: number;
}

export interface AgentBoardPerson {
  readonly userId: string;
  readonly name: string | null;
}

export interface AgentBoardWaiting {
  readonly kind: AgentWaitKind;
  /** Since when it waits. */
  readonly since: string | null;
  /** Who it waits for. */
  readonly waitingFor: readonly AgentBoardPerson[];
  /** Whether the viewer is among them. */
  readonly viewerDecides: boolean;
  /** Where the decision is made: the inbox's decisions, the issue's design section, or else the issue. */
  readonly path: string;
  /** The status asked for, or why the run failed. */
  readonly detail: string | null;
}

/** An unfinished issue another waits for. */
export interface AgentBoardBlocker {
  readonly issueId: string;
  readonly identifier: string;
  readonly title: string;
}

/** What one agent has on an issue. */
export interface AgentBoardEntry {
  readonly agentId: string;
  readonly state: AgentBoardState;
  /** For `working`, and `queued` with a run. */
  readonly run: AgentBoardRun | null;
  /** For `queued` with a run: why it waits (`RUN_WAIT_REASONS`). */
  readonly queue: RunWait | null;
  /**
   * For `queued` without a run: the issue the agent executes waits for unfinished issues, and the agent is woken when
   * they finish. Those the viewer may see; empty when they see none of them (the issue's `blockedCount` still counts).
   */
  readonly blockedBy: readonly AgentBoardBlocker[] | null;
  /** For `waiting`. */
  readonly waiting: AgentBoardWaiting | null;
  /** For `idle`: why, and whether the viewer may start it. */
  readonly idle: AgentBoardIdle | null;
}

/** An issue with an agent involved: the issue as the list shows it, and where its agent stands with it. */
export interface AgentBoardRow extends AgentBoardEntry {
  readonly issue: IssueListItem;
  /** Other agents with something on it, most pressing first. */
  readonly others: readonly AgentBoardEntry[];
  /** The viewer owns, created or follows the issue. */
  readonly mine: boolean;
}

/**
 * An agent the board shows: one a row names, or one the viewer may give work to (`mayInvoke`, or every agent for those
 * who read all runs), so idle agents show too. Only runner agents: online agents never execute issues or run on them.
 */
export interface AgentBoardAgent {
  readonly id: string;
  readonly name: string;
  /** Its name as an i18n reference (a built-in agent), shown in the viewer's language. */
  readonly nameText: I18nText | null;
  readonly avatar: string | null;
  /** Its default coding tool and model: the first entry of its list. */
  readonly tool: string;
  readonly model: string | null;
  /** Every entry of its list, in order, as `tool`, then its model and effort when set, joined by ` · `. */
  readonly models: readonly string[];
  readonly archived: boolean;
  /** Whether an online runner could take its work now. */
  readonly online: boolean;
  /** Runs it holds now, of any subject, and the most it may hold. */
  readonly active: number;
  readonly maxConcurrentRuns: number;
}

export interface AgentBoard {
  /** The issues with an agent involved, by section (`AGENT_BOARD_STATES`), each section in its own order. */
  readonly rows: readonly AgentBoardRow[];
  /** The agents the rows name and the unarchived ones the viewer may give work to, by id. */
  readonly agents: Readonly<Record<string, AgentBoardAgent>>;
  /** Issues per section, and how busy the runtimes are. */
  readonly summary: Readonly<Record<AgentBoardState, number>> & {
    readonly runners: RunnerLoad;
  };
  /** Each project's statuses (`''` for issues without a project), for the issues' status badges. */
  readonly statuses: Readonly<Record<string, readonly StatusDefinition[]>>;
  /** More issues or runs matched than the view reads. */
  readonly truncated: boolean;
  readonly generatedAt: string;
}
