/**
 * Run requests in Studio's inbox, as the server sends them (`server/agents/run-requests.ts`) and the browser renders
 * them (`client/inbox/contributions/run-requests.ts`): work someone else asked of an agent on an issue, waiting for
 * the issue's owner to confirm or reject it, and the notice the person who asked gets when nobody did in time.
 */

/** The inbox source of run requests. */
export const RUN_REQUESTS_SOURCE = 'runRequests';

/** The owner's decision: confirm (run it as them) or reject. Its decision key is the request's id. */
export const RUN_REQUEST_TYPE = 'run_request';

/** The person who asked hears nobody confirmed it in time; they may still run it as themselves. */
export const RUN_REQUEST_EXPIRED_TYPE = 'run_request_expired';

/** How much of the request's text a card carries; the whole text is read from the request itself. */
export const RUN_REQUEST_EXCERPT_MAX = 280;

/** What a run request's inbox item carries (`data`). */
export interface RunRequestCardData {
  readonly requestId: string;
  readonly agentId: string;
  readonly agentName: string;
  readonly requestedByUserId: string;
  readonly requestedByName: string;
  readonly responsibleUserId: string;
  readonly issueId: string;
  readonly identifier: string;
  readonly issueTitle: string;
  /** What caused it, as the run panel names triggers (`comment`, `stageEntered`, `unblocked`…). */
  readonly trigger: string | null;
  /** The beginning of what was asked, as it was asked. */
  readonly excerpt: string;
  readonly expiresAt: string;
  /** Why an expired request expired: nobody confirmed it in time, or the new owner cannot run it. */
  readonly reason?: 'timeout' | 'reassignment';
}
