/**
 * Runs as the browser and the server's admin API exchange them.
 */
import type {
  ActorKind,
  AgentTool,
  FailureReason,
  RunEvent,
  RunEventType,
  RunInputType,
  RunnerFeature,
  RunStatus,
} from '@nocobase/agent-protocol';

/** The run subject kind of a consultation: an online agent asking another a question (`ask_agent`). */
export const CONSULTATION_SUBJECT = 'consultation';

/** How deep consultations go: the agent asked may ask another, which may not ask further. */
export const CONSULT_MAX_DEPTH = 2;

export interface Run {
  readonly id: string;
  readonly agentId: string;
  /** The agent's type (`AgentType`): an `online` run is held by the application itself, a `runner` run by a runner. */
  readonly agentType: 'online' | 'runner';
  /** The runner holding it; `server:<instance>` for an online run held by an application instance. */
  readonly runnerId: string | null;
  /**
   * The entry of the agent's list it works with (`AgentModelEntry`): a runner run's coding tool and model (null: the
   * tool's default), set when a runner claims it; an online run's model service and model, set when it is claimed (a
   * conversation's choice, else the agent's first entry). Null fields while nothing settled them.
   */
  readonly tool: AgentTool | null;
  readonly modelService: string | null;
  readonly model: string | null;
  /** The entry's reasoning effort, settled with it; null for the tool's or provider's default. */
  readonly effort: string | null;
  readonly status: RunStatus;
  readonly priority: number;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly retryOfRunId: string | null;
  /**
   * A consultation: the run whose agent asked this run's agent a question (`ask_agent`), which waited for its answer.
   * Null for every other run.
   */
  readonly parentRunId: string | null;
  readonly subject: { readonly kind: string; readonly id: string };
  readonly threadScope: string;
  /** The person the run acts as: their permissions bound it, and only their own runners (or team runners) take it. */
  readonly actorUserId: string;
  /**
   * Who the chain of work the run belongs to started with: the person whose action woke the agent, or for work a run
   * caused, that run's source. The actor when they started it themselves.
   */
  readonly requestedByUserId: string;
  /** Who confirmed the run request the run was queued from (`RunRequest`); null for work its actor started. */
  readonly confirmedByUserId: string | null;
  readonly ownerUserId: string | null;
  readonly requires: readonly RunnerFeature[];
  readonly acceptsInput: boolean;
  readonly availableAt: string | null;
  readonly leaseExpiresAt: string | null;
  readonly dispatchedAt: string | null;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
  readonly lastActivityAt: string | null;
  readonly cancelRequestedAt: string | null;
  readonly failureReason: FailureReason | null;
  readonly failureDetail: string | null;
  readonly summary: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RunInputRecord {
  readonly id: string;
  readonly type: RunInputType;
  readonly actor: {
    readonly kind: ActorKind;
    readonly id: string;
    readonly name: string;
  };
  readonly text: string;
  readonly payload: unknown;
  readonly createdAt: string;
  readonly deliveredAt: string | null;
  readonly handledAt: string | null;
}

export interface RunRepo {
  readonly url: string;
  readonly branch: string;
  readonly pushed: boolean;
  readonly headSha: string | null;
  readonly updatedAt: string;
}

export interface RunUsageTotal {
  readonly tool: string;
  readonly model: string | null;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens: number;
  readonly cacheWriteTokens: number;
  readonly reasoningTokens: number;
}

/** A consultation a run made (`ask_agent`): the run of the agent it asked. */
export interface RunChild {
  readonly id: string;
  readonly agentId: string;
  /** The agent's name; null when it was deleted. */
  readonly agentName: string | null;
  readonly status: RunStatus;
  readonly failureReason: FailureReason | null;
  /** Its answer. */
  readonly summary: string | null;
  readonly createdAt: string;
  readonly finishedAt: string | null;
}

export interface RunDetail extends Run {
  readonly inputs: readonly RunInputRecord[];
  readonly repos: readonly RunRepo[];
  readonly usage: readonly RunUsageTotal[];
  /** The consultations it made, oldest first; each is a run of its own, with its own usage. */
  readonly children: readonly RunChild[];
}

/** One page of a run's transcript, after a `seq`. */
export interface RunEventPage {
  readonly events: readonly RunEvent[];
  /** The highest `seq` returned, to ask for the next page with. */
  readonly lastSeq: number;
}

/**
 * Why a queued run has not been taken yet, as far as the claim's own rules tell (`RunService.workload`), checked in
 * this order:
 *
 * - `agentArchived`: its agent is archived or gone; the sweeper cancels it.
 * - `delayed`: it was given a moment (`fireAt`, or a retry's backoff) that has not come; `until` says when.
 * - `noRunnerOnline`: no runner is online at all.
 * - `runnersOffline`: the agent names its runners, and none of them is online.
 * - `toolUnavailable`: runners are online, but none has any of the agent's coding tools enabled, installed and
 *   signed in.
 * - `noSharedRunner`: only personal runners could take it, and none belongs to the person who woke the agent.
 * - `missingFeatures`: the runners that could take it lack what it needs (`missing`).
 * - `sameWorkActive`: the agent is already working on the same subject and thread; this run follows.
 * - `concurrencyFull`: the agent has as many runs held as it may have at once.
 * - `runnersBusy`: every runner that could take it has its slots full (the machine's slots).
 * - `toolSlotsFull`: a runner that could take it has a free slot, but none has room for any of the agent's coding tools
 *   (`Runner.toolSlots`); `tool` names the one that is full.
 * - `setupRetrying`: preparing it failed and is tried again (`detail` says why).
 * - `next`: nothing holds it; the next free runner that asks takes it.
 */
export const RUN_WAIT_REASONS = [
  'agentArchived',
  'delayed',
  'noRunnerOnline',
  'runnersOffline',
  'toolUnavailable',
  'noSharedRunner',
  'missingFeatures',
  'sameWorkActive',
  'concurrencyFull',
  'runnersBusy',
  'toolSlotsFull',
  'setupRetrying',
  'next',
] as const;

export type RunWaitReason = (typeof RUN_WAIT_REASONS)[number];

/** Where a queued run stands and what holds it. */
export interface RunWait {
  readonly reason: RunWaitReason;
  /** Its place among the runs that may be claimed now, in claim order (1 first); null while delayed. */
  readonly position: number | null;
  /** Its place among its agent's queued runs, in claim order (1 first). */
  readonly agentPosition: number;
  /** When a delayed run may be claimed. */
  readonly until: string | null;
  /**
   * For `toolUnavailable`: the agent's default coding tool (its first entry's); any of its tools would do. For
   * `toolSlotsFull`: the first of the agent's tools the free runners run, all of whose slots are taken.
   */
  readonly tool: AgentTool | null;
  /** For `missingFeatures`: what no fitting runner has. */
  readonly missing: readonly RunnerFeature[];
  /** For `setupRetrying`: why preparing it failed. */
  readonly detail: string | null;
}

/** The newest thing a held run reported, for a one-line "last activity". */
export interface RunActivity {
  readonly at: string;
  readonly type: RunEventType;
  readonly tool: string | null;
  /** Its text, cut to `RUN_ACTIVITY_TEXT_MAX` characters; null when it has none. */
  readonly text: string | null;
}

export const RUN_ACTIVITY_TEXT_MAX = 200;

/** An open run with what a board of work shows about it. */
export interface WorkloadRun extends Run {
  /** The newest input's `payload.trigger`, what the subject says woke the agent; null without one. */
  readonly trigger: string | null;
  /** The runner holding it. */
  readonly runnerName: string | null;
  /** For a held run: the newest text, tool call, status or error it reported. */
  readonly lastActivity: RunActivity | null;
  /** For a queued run: why it waits. */
  readonly wait: RunWait | null;
}

/** An agent's load: its runs held and queued, the most it may hold, and whether a runner could take its work now. */
export interface AgentLoad {
  readonly agentId: string;
  readonly active: number;
  readonly queued: number;
  readonly maxConcurrentRuns: number;
  readonly online: boolean;
}

/** The runners as a whole: how many are online, how many of those hold work, and their slots. */
export interface RunnerLoad {
  readonly online: number;
  readonly busy: number;
  readonly slots: number;
  readonly used: number;
}

/** The open runs on one kind of subject, with the queue explained (`RunService.workload`). */
export interface Workload {
  /** Held runs first, then queued in claim order. */
  readonly runs: readonly WorkloadRun[];
  /** More runs are open than the limit allowed. */
  readonly truncated: boolean;
  /** Every agent that is not archived, and any archived one with an open run here. */
  readonly agents: readonly AgentLoad[];
  readonly runners: RunnerLoad;
}

export interface WorkloadQuery {
  readonly subjectKind: string;
  /** At most this many runs (200 by default, at most 1000). */
  readonly limit?: number;
}

/**
 * What a run request can be: `pending` until the responsible confirms it (`confirmed`, queued as them) or rejects it
 * (`rejected`), the requester withdraws it (`withdrawn`, also when they run it as themselves), it is handed to a new
 * responsible (`superseded`), or nobody settles it in time (`expired`). Only a pending request changes.
 */
export const RUN_REQUEST_STATUSES = [
  'pending',
  'confirmed',
  'rejected',
  'withdrawn',
  'expired',
  'superseded',
] as const;

export type RunRequestStatus = (typeof RUN_REQUEST_STATUSES)[number];

/** How work someone asks of an agent is run (`EnqueueRequest.execution`). */
export const RUN_EXECUTIONS = ['auto', 'mine'] as const;

/**
 * `auto`: as the subject's responsible, once they confirm it when someone else asked; `mine`: as the person who asked,
 * at once, on a runner they may use (their own, or a team runner).
 */
export type RunExecution = (typeof RUN_EXECUTIONS)[number];

/** The input of a run request, as it was when asked: what confirming it runs. */
export interface RunRequestInput {
  readonly type: RunInputType;
  readonly actor: {
    readonly kind: ActorKind;
    readonly id: string;
    readonly name: string;
  };
  readonly text: string;
  readonly payload: unknown;
}

/**
 * Work someone asked of an agent on a subject another person answers for (its responsible: an issue's owner, say). It
 * runs only once the responsible confirms it, as them, or when the person who asked runs it as themselves.
 */
export interface RunRequest {
  readonly id: string;
  readonly agentId: string;
  readonly subject: { readonly kind: string; readonly id: string };
  readonly threadScope: string;
  /** Who answers for the subject: the only person who may confirm or reject the request. */
  readonly responsibleUserId: string;
  /** Who the chain of work started with: the only person who may withdraw it or run it as themselves. */
  readonly requestedByUserId: string;
  readonly ownerUserId: string | null;
  /** The moment the work was not to be claimed before (`EnqueueRequest.fireAt`); null for as soon as it runs. */
  readonly fireAt: string | null;
  /** Attempts its run may take; null for the agent's default. */
  readonly maxAttempts: number | null;
  readonly input: RunRequestInput;
  readonly status: RunRequestStatus;
  /** Who settled it (confirmed, rejected, withdrew or handed it on); null while pending, and when it expired. */
  readonly settledById: string | null;
  readonly settledAt: string | null;
  /** Why it was rejected or handed on, when someone said. */
  readonly note: string | null;
  readonly expiresAt: string;
  /** The run it went into: on confirming, or when the requester ran it as themselves. */
  readonly runId: string | null;
  /** The request that took over when the subject's responsible changed. */
  readonly supersededById: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** A run request as people's lists show it: with the names of its agent and of the people in it. */
export interface RunRequestItem extends RunRequest {
  /** Null when the agent was deleted. */
  readonly agentName: string | null;
  readonly responsibleName: string | null;
  readonly requestedByName: string | null;
}
