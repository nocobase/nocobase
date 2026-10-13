/**
 * The project manager: the one agent that arranges every issue's work (`server/agents/manager/`). It runs with the
 * tool and model of an agent discovered from runners an administrator chooses (a first choice and a fallback),
 * allocates work by principles it is given (built in, editable), and is woken by agents' comments at most
 * `commentRunLimit` times per issue within `COMMENT_RUN_WINDOW_HOURS` hours.
 *
 * | Method  | Route                                         | Body                    | `data`                |
 * | ------- | --------------------------------------------- | ----------------------- | --------------------- |
 * | GET     | `projectManager`                              |                         | `ProjectManagerView`  |
 * | PATCH   | `projectManager` (`agents.agents` manage)     | `ProjectManagerPatch`   | `ProjectManagerView`  |
 * | POST    | `projectManager/issues/:issueId/start`        |                         | `{ runId }`           |
 * | GET     | `issueProgress/:issueId`                      |                         | `IssueProgress`       |
 */

/** The project manager's agent id. */
export const PROJECT_MANAGER_ID = 'studio-project-manager';
/** Invalidation only, with no identity or settings values in its payload. */
export const PROJECT_MANAGER_IDENTITY_TOPIC = 'studio:manager:identity';
export const DEFAULT_FALLBACK_AFTER_SECONDS = 120;
export const FALLBACK_AFTER_SECONDS_MAX = 3600;
export const DEFAULT_DELEGATION_QUEUE_TIMEOUT_SECONDS = 600;
export const DELEGATION_QUEUE_TIMEOUT_SECONDS_MAX = 86400;

/** How many runs agents' comments may start on one issue within `COMMENT_RUN_WINDOW_HOURS` hours, by default. */
export const DEFAULT_COMMENT_RUN_LIMIT = 20;
export const COMMENT_RUN_LIMIT_MAX = 1000;
export const COMMENT_RUN_WINDOW_HOURS = 24;

/** The longest allocation principles an administrator may write, in characters. */
export const PRINCIPLES_MAX = 20_000;

export interface ProjectManagerSettings {
  readonly name: string;
  readonly description: string | null;
  /** The agent whose tool and model the project manager runs with; null until someone chooses. */
  readonly firstChoiceAgentId: string | null;
  /** Used after the queue delay or when no compatible runner can take the first choice; null for none. */
  readonly fallbackAgentId: string | null;
  /** The allocation principles; null for the built-in ones. */
  readonly principles: string | null;
  readonly commentRunLimit: number;
  readonly fallbackAfterSeconds: number;
  readonly delegationQueueTimeoutSeconds: number;
}

export type ProjectManagerPatch = Partial<ProjectManagerSettings>;

/** An agent the project manager may run with, as the settings name it. */
export interface ProjectManagerChoice {
  readonly id: string;
  readonly name: string;
  /** What it is good at. */
  readonly description: string | null;
  /** A runner could take its work now. */
  readonly online: boolean;
}

export interface ProjectManagerView extends ProjectManagerSettings {
  /** The built-in allocation principles, for "Restore built-in" and to tell how far the ones in force differ. */
  readonly builtInPrinciples: string;
  /** The enabled agents it may run with. */
  readonly choices: readonly ProjectManagerChoice[];
  /** The caller may change the settings (`agents.agents` manage). */
  readonly canEdit: boolean;
}

/**
 * What an issue waits for now, as the issue page's "Now" line shows it, worked out by the system:
 *
 * - `working`: an agent's run is on it (`agent`, `step` it was handed, since `since`, on `runner`).
 * - `queued`: an agent's run waits for a runner (`agent`, `step`).
 * - `checksPending`: no run is on it and a linked open pull request's checks have not finished (`pullRequest`).
 * - `needsDecision`: the issue is blocked; `question` is what the project manager asked the person.
 * - `inReview`: it waits for a person to accept it.
 * - `notStarted`: in backlog.
 * - `finished`: done or cancelled.
 * - `idle`: nothing of the above.
 *
 * `next` is the project manager's latest "Next" line, when it wrote one. `handOver` says the project manager never
 * worked on the issue though it is its executor and the issue is open: someone may hand it over to go on.
 */
export type IssueProgressState =
  | 'working'
  | 'queued'
  | 'checksPending'
  | 'needsDecision'
  | 'waitingForContinuation'
  | 'inReview'
  | 'notStarted'
  | 'finished'
  | 'idle';

export interface IssueProgress {
  readonly managerWait?: {
    readonly queueEnteredAt: string;
    readonly fallbackAfterSeconds: number;
    readonly sampledAt: string;
    readonly entries: readonly {
      readonly tool: string;
      readonly model: string | null;
      readonly reason: import('@nocobase/app-plugin-agents/shared/runs').ModelWaitReason;
      readonly compatibleCount: number;
      readonly blockers?: readonly import('@nocobase/app-plugin-agents/shared/runs').ModelWaitReason[];
      readonly runners: readonly string[];
      readonly runnerLoads?: readonly {
        readonly name: string;
        readonly reason?: import('@nocobase/app-plugin-agents/shared/runs').ModelWaitReason;
        readonly lastSeenAt?: string | null;
        readonly used?: number;
        readonly limit?: number;
        readonly toolUsed?: number;
        readonly toolLimit?: number;
        readonly reportedFree?: number;
        readonly reportedTotalFree?: number;
      }[];
    }[];
  };
  readonly waiting?: {
    readonly reason:
      | 'waitingOwner'
      | 'noOwner'
      | 'notConfigured'
      | 'noRunner'
      | 'ownerHasNoRunner'
      | 'notAllowed';
    readonly owner: { readonly id: string; readonly name: string } | null;
  } | null;
  readonly state: IssueProgressState;
  readonly agent: { readonly id: string; readonly name: string } | null;
  readonly step: string | null;
  readonly since: string | null;
  readonly runner: string | null;
  readonly pullRequest: {
    readonly number: number;
    readonly url: string | null;
  } | null;
  readonly question: string | null;
  readonly next: string | null;
  readonly handOver: boolean;
}
