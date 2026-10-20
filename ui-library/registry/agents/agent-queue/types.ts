/**
 * The data the agent queue shows: the issues agents are involved in and where each agent stands with them, the
 * agents, and how busy the runtimes are. The shape mirrors what an application composes from the agents and projects
 * plugins (such as an application's `GET /api/agentBoard`), written out here so the item imports no plugin.
 */
import type { ReactNode } from 'react';

/** Where an agent stands with an issue. */
export type AgentQueueState = 'waiting' | 'working' | 'queued' | 'idle';

/** What an agent waits for a person on. */
export type AgentQueueWaitKind =
  'failedRun' | 'approval' | 'proposal' | 'question' | 'review';

export interface AgentQueueWait {
  /**
   * Why it waits: a code the item does not interpret, such as the agents plugin's `secretsNotAllowed`. The consumer
   * words it (`formatWait`); without that the code itself is shown.
   */
  readonly reason: string;
  /** Its place among every queued run, when the runtimes take them in one order. */
  readonly position: number | null;
  /** Its place among this agent's queued runs, in claim order. */
  readonly agentPosition: number;
  /** The values its words need, as the server sends them; handed to `formatWait` with the rest. */
  readonly params?: Readonly<
    Record<string, string | number | readonly string[]>
  >;
  /** What servers sent before `params`, handed on the same way. */
  readonly until?: string | null;
  readonly tool?: string | null;
  readonly missing?: readonly string[];
  readonly detail?: string | null;
}

/** A wait in words, as the consumer's `formatWait` gives it. */
export interface AgentQueueWaitView {
  readonly text: ReactNode;
  /** More about it, shown on hover when it is a string. */
  readonly detail?: ReactNode;
  /** It needs someone to act (an administrator, the agent's owner) rather than time: drawn as a warning. */
  readonly blocking?: boolean;
}

/** The latest thing a run reported. */
export interface AgentQueueActivity {
  readonly type: string;
  readonly text?: string | null;
  readonly tool?: string | null;
}

export interface AgentQueueRun {
  /** Null when the viewer may not see the run. */
  readonly id: string | null;
  readonly status: 'queued' | 'dispatched' | 'running';
  /** Since when it works (held) or waits (queued). */
  readonly since: string;
  readonly runnerName: string | null;
  readonly lastActivity: AgentQueueActivity | null;
  readonly attempt: number;
  readonly maxAttempts: number;
}

export interface AgentQueuePerson {
  readonly userId: string;
  readonly name: string | null;
}

export interface AgentQueueWaiting {
  readonly kind: AgentQueueWaitKind;
  readonly since: string | null;
  readonly waitingFor: readonly AgentQueuePerson[];
  /** Whether the viewer is among them. */
  readonly viewerDecides: boolean;
  /** Where the decision is made. */
  readonly path: string;
  /** The status asked for, or why the run failed. */
  readonly detail: string | null;
}

export interface AgentQueueBlocker {
  readonly issueId: string;
  readonly identifier: string;
  readonly title: string;
}

/** Why an agent is assigned an issue with nothing going on. */
export type AgentQueueIdleReason =
  'backlog' | 'lastRun' | 'noAutoRun' | 'neverRan';

export interface AgentQueueIdle {
  readonly reason: AgentQueueIdleReason;
  /** For `lastRun`: how the agent's newest run on the issue ended, and when. */
  readonly lastRun: {
    readonly status: 'completed' | 'failed' | 'cancelled';
    readonly at: string;
  } | null;
  /** Whether the viewer may start the agent's work on it now. */
  readonly mayStart: boolean;
}

/** What one agent has on an issue. */
export interface AgentQueueEntry {
  readonly agentId: string;
  readonly state: AgentQueueState;
  readonly run: AgentQueueRun | null;
  readonly queue: AgentQueueWait | null;
  /** Queued without a run: the unfinished issues it waits for. */
  readonly blockedBy: readonly AgentQueueBlocker[] | null;
  readonly waiting: AgentQueueWaiting | null;
  /** Idle: why, and whether the viewer may start it. */
  readonly idle: AgentQueueIdle | null;
}

/** The issue as far as the queue shows it. */
export interface AgentQueueIssue {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  /** Unfinished issues it waits for, those the viewer cannot see included. */
  readonly blockedCount: number;
}

export interface AgentQueueRow extends AgentQueueEntry {
  readonly issue: AgentQueueIssue;
  /** Other agents with something on it. */
  readonly others: readonly AgentQueueEntry[];
  /** The viewer owns, created or follows the issue. */
  readonly mine: boolean;
}

export interface AgentQueueAgent {
  readonly id: string;
  readonly name: string;
  readonly avatar: string | null;
  readonly tool: string;
  readonly archived: boolean;
  /** Whether an online runtime could take its work now. */
  readonly online: boolean;
  /** Runs it holds now, and the most it may hold at once. */
  readonly active: number;
  readonly maxConcurrentRuns: number;
}

export interface AgentQueueData {
  readonly rows: readonly AgentQueueRow[];
  readonly agents: Readonly<Record<string, AgentQueueAgent>>;
  readonly summary: {
    readonly runners: { readonly online: number; readonly busy: number };
  };
  /** More issues matched than the data holds. */
  readonly truncated: boolean;
  readonly generatedAt: string;
}
