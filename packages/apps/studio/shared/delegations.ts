/**
 * Delegate and report back: when an agent in a conversation hands work to another agent through an issue (a plan the
 * person executed creates the issue with an agent executor, gives it one, or mentions one on it), Studio follows that
 * issue for the conversation (`server/agents/conversation/delegation.ts`). Its milestones come back to the conversation
 * as news of type `delegation`, shown as an event card, and wake the conversation's agent to summarise them.
 *
 * ## HTTP API (signed in, the conversation's owner only)
 *
 * | Method and path                          | Body           | Answer                                       |
 * | ---------------------------------------- | -------------- | -------------------------------------------- |
 * | `GET /delegations?conversationId=`       |                | 200 `{ data: Delegation[], meta: { total } }` |
 * | `GET /delegations/:delegationId`         |                | 200 `{ data: Delegation }`                   |
 * | `PATCH /delegations/:delegationId`       | `{ followed }` | 200 `{ data: Delegation }`                   |
 *
 * Someone else's delegation, or one of a conversation that is gone, answers 404 `DELEGATION_NOT_FOUND`.
 */

/** The news type of a delegation's milestone in a conversation. */
export const DELEGATION_NEWS = 'delegation';

/** The trigger of the input a milestone wakes the conversation's agent with. */
export const DELEGATION_TRIGGER = 'delegationReport';

/**
 * What happened to the delegated work:
 *
 * - `finished`: the agent's run ended, the issue not waiting on anyone;
 * - `needsInput`: the run ended with the issue in Blocked: the agent asks a question;
 * - `inReview`: the run ended with the issue in review: the agent asks for approval;
 * - `failed`: the run failed for good;
 * - `issueClosed`: someone other than the person moved the issue to a finished or closed status;
 * - `prOpened`: a pull request was linked to the issue while its agent was not working on it.
 */
export const DELEGATION_EVENTS = [
  'finished',
  'needsInput',
  'inReview',
  'failed',
  'issueClosed',
  'prOpened',
] as const;

export type DelegationEvent = (typeof DELEGATION_EVENTS)[number];

/** A conversation's following of an issue it delegated to an agent. */
export interface Delegation {
  readonly id: string;
  readonly conversationId: string;
  readonly issueId: string;
  readonly agentId: string;
  /** The conversation's owner. */
  readonly userId: string;
  /** False once the person stopped following it: no more cards, no more wakes. */
  readonly followed: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** `PATCH /delegations/:delegationId`. */
export interface DelegationPatch {
  readonly followed: boolean;
}

/**
 * The `params` of a delegation's news (strings, as news params are): what the card shows. `prNumber`, `prUrl` and
 * `prTitle` name the newest pull request linked to the issue, when there is one.
 */
export interface DelegationNewsParams {
  readonly delegationId: string;
  readonly event: DelegationEvent;
  readonly issueId: string;
  readonly identifier: string;
  readonly issueTitle: string;
  readonly agentId: string;
  readonly agentName: string;
  /** A built-in agent's name as an i18n key and namespace, shown in the reader's language. */
  readonly agentNameKey?: string;
  readonly agentNameNs?: string;
  /** The run's summary, the agent's question, the failure, or the status: at most `DELEGATION_EXCERPT_MAX`. */
  readonly excerpt?: string;
  readonly status?: string;
  readonly prNumber?: string;
  readonly prUrl?: string;
  readonly prTitle?: string;
}

/** The longest excerpt a card carries. */
export const DELEGATION_EXCERPT_MAX = 400;
