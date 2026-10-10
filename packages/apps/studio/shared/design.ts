/**
 * Design first: an agent analyses an issue in Analysis and submits its design proposal
 * (a Markdown document) with `nb-studio issue design-proposal`; the proposal is a comment of kind `proposal` on the issue,
 * the newest one counting. The issue waits in Proposal review, where its owner, the project lead or an administrator
 * approves it (the issue moves to In progress and its agent implements the proposal) or anyone who may comment sends
 * it back with a comment (it moves to Analysis and the agent revises the whole proposal). The owner is asked in the
 * inbox (`design_review`) and on the issue page.
 *
 * ## HTTP API (`/api/designProposals/:issueId`, by id or identifier, signed in)
 *
 * | Method and path                 | Body                     | Answer                                         |
 * | ------------------------------- | ------------------------ | ---------------------------------------------- |
 * | `GET /`                         |                          | 200 `{ data: DesignState }`                    |
 * | `POST /approve`                 | `{ comment? }`           | 200 `{ data: DesignState }`                    |
 * | `POST /requestChanges`          | `{ comment }` (required) | 200 `{ data: DesignState }`                    |
 *
 * Errors are the standard error body, domain `nb-studio`: 400 `DESIGN_COMMENT_REQUIRED` (no comment to send back), 403
 * `DESIGN_APPROVE_FORBIDDEN` (not one who may approve), 400 `DESIGN_NOT_IN_REVIEW` or `DESIGN_PROPOSAL_MISSING`; the
 * projects plugin's own (a missing issue) keep its domain.
 */

/**
 * The issue activity Studio records when an agent becomes the executor in a status whose stage is another agent's (a
 * review): its work starts once the issue enters In progress. `details`: `agentId`, `name`, `status`.
 */
export const EXECUTOR_WAITS_ACTIVITY = 'executor_waits';

/** The comment kind of a design proposal. */
export const DESIGN_PROPOSAL_KIND = 'proposal';

/** The inbox type of the owner's card. */
export const DESIGN_REVIEW_TYPE = 'design_review';

/** The statuses of the design-first flow in the "Software development" workflow. */
export const ANALYSIS_STATUS = 'analysis';
export const PROPOSAL_REVIEW_STATUS = 'proposal_review';
export const IN_PROGRESS_STATUS = 'in_progress';

/** The issue page's design section, by its anchor: `/issues/PM-12#design` scrolls to it. */
export const DESIGN_SECTION_ANCHOR = 'design';

/** The longest comment sent with a decision. */
export const DESIGN_COMMENT_MAX = 10_000;

export interface DesignProposal {
  readonly commentId: string;
  /** Markdown. */
  readonly content: string;
  readonly authorType: string;
  readonly authorId: string | null;
  readonly authorName: string | null;
  readonly createdAt: string;
}

export interface DesignState {
  readonly issueId: string;
  readonly statusKey: string;
  /** The issue waits in Proposal review. */
  readonly inReview: boolean;
  /** The newest proposal; null before the first. */
  readonly proposal: DesignProposal | null;
  /** The viewer may approve (the owner, the project lead or an administrator), while it waits. */
  readonly canApprove: boolean;
  /** The viewer may send it back (anyone who may comment on the issue), while it waits. */
  readonly canRequestChanges: boolean;
}

export interface DesignDecisionRequest {
  readonly comment?: string;
}
