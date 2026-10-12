/**
 * Deciding a failed run's card (`notices.ts`, type `run_failed_final`): what happens to the issue once its agent ran
 * out of attempts. Three answers, as the card offers them:
 *
 * - `retry`: the run's work starts again as a new run (the agents plugin's `runs.retry`), woken by the person deciding;
 * - `reassign`: a person becomes the issue's executor, through the projects plugin's own update, so its rules hold;
 * - `cancel`: nothing more is done; the card is settled.
 *
 * Whoever owns the issue or may edit it decides, once: a decided card answers 409. The card is then settled for every
 * recipient through Studio's inbox, by the key it was sent with.
 */
import { ProtocolError } from '@nocobase/agent-protocol';
import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import { businessKey } from '@nocobase/app-plugin-projects/shared/access';

import type { RunService } from '@nocobase/app-plugin-agents/server/tokens';
import type { StudioInbox } from '../inbox/service.js';
import { ISSUE_SUBJECT } from './catalog/triggers.js';
import { translated } from './commands/permissions.js';
import {
  RUN_FAILED_ACTIONS,
  runFailedDecision,
  withFailedRunReassignment,
} from './notices.js';

export type FailedRunAction = (typeof RUN_FAILED_ACTIONS)[number];

/** How the card ends, per action: its outcome in the inbox. */
export const FAILED_RUN_OUTCOMES: Readonly<Record<FailedRunAction, string>> = {
  retry: 'retried',
  reassign: 'reassigned',
  cancel: 'cancelled',
};

export interface FailedRunRequest {
  readonly action: FailedRunAction;
  /** For `reassign`: the person who takes the issue over. */
  readonly userId?: string;
}

export interface FailedRunResult {
  readonly outcome: string;
  /** For `retry`: the new run. */
  readonly runId?: string;
}

export interface FailedRunDeps {
  readonly runs: Pick<RunService, 'get' | 'retry' | 'detail'>;
  readonly projects: () => Pick<Projects, 'issueQueries' | 'issues'>;
  /** The person deciding, as the projects plugin sees them. */
  readonly viewerOf: (userId: string) => Promise<Viewer>;
  readonly inbox: Pick<StudioInbox, 'waiting' | 'resolve'>;
}

export function isFailedRunAction(value: unknown): value is FailedRunAction {
  return (RUN_FAILED_ACTIONS as readonly unknown[]).includes(value);
}

export async function decideFailedRun(
  deps: FailedRunDeps,
  userId: string,
  runId: string,
  request: FailedRunRequest,
): Promise<FailedRunResult> {
  const run = await deps.runs.get(runId);
  if (run.subject.kind !== ISSUE_SUBJECT || run.status !== 'failed')
    throw new ProtocolError('NOT_FOUND', 'No failed run on an issue.', {
      code: 'FAILED_RUN_NOT_FOUND',
    });
  const ref = runFailedDecision(run.id);
  try {
    const viewer = await deps.viewerOf(userId);
    const issue = await deps
      .projects()
      .issueQueries.detail(viewer, run.subject.id);
    const editor =
      viewer.permissions.scopes[businessKey('pm.issues', 'edit')] !== 'none';
    if (issue.ownerUserId !== userId && !editor)
      throw new ProtocolError(
        'FORBIDDEN',
        'Only the owner of the issue or someone who may edit it decides.',
        { code: 'FAILED_RUN_DECISION_FORBIDDEN' },
      );
    if (!(await deps.inbox.waiting(ref))) {
      const detail =
        request.action === 'retry' ? await deps.runs.detail(run.id) : null;
      if (detail?.retriedRunId)
        throw new ProtocolError(
          'RUN_ALREADY_RETRIED',
          'This run has already been retried.',
          { runId: detail.retriedRunId },
        );
      throw new ProtocolError('CONFLICT', 'This decision was already taken.', {
        code: 'DECISION_ALREADY_TAKEN',
      });
    }
    let result: FailedRunResult;
    switch (request.action) {
      case 'retry': {
        const next = await deps.runs.retry(run.id, userId, 'card');
        result = { outcome: FAILED_RUN_OUTCOMES.retry, runId: next.id };
        break;
      }
      case 'reassign': {
        if (!request.userId)
          throw new ProtocolError(
            'INVALID_REQUEST',
            'userId: the person who takes the issue over is required.',
          );
        const projects = deps.projects();
        await withFailedRunReassignment(projects, issue.id, async () => {
          await projects.issues.update(viewer, issue.id, {
            revision: issue.revision,
            executor: { type: 'user', id: request.userId! },
          });
          await deps.inbox.resolve({
            ...ref,
            outcome: FAILED_RUN_OUTCOMES.reassign,
          });
        });
        result = { outcome: FAILED_RUN_OUTCOMES.reassign };
        return result;
      }
      case 'cancel':
        result = { outcome: FAILED_RUN_OUTCOMES.cancel };
        break;
    }
    const next = result.runId ? await deps.runs.detail(result.runId) : null;
    await deps.inbox.resolve({
      ...ref,
      outcome: result.outcome,
      ...(next
        ? {
            data: {
              retriedByUserId: userId,
              retriedByName:
                next.inputs.find(
                  (input) =>
                    input.type === 'retry' &&
                    (input.payload as { retryOfRunId?: unknown } | null)
                      ?.retryOfRunId === run.id,
                )?.actor.name ?? userId,
              retrySource: 'card',
              retriedRunId: next.id,
            },
          }
        : {}),
    });
    return result;
  } catch (error) {
    throw translated(error);
  }
}
