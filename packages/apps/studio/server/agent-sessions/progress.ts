/**
 * How an issue is going, as the agent in a person's session reads it: what the system worked out of who works on it
 * and what it waits for (`issueProgress`, `agents/manager/progress.ts`), in plain words, the facts it does not know left
 * out.
 */
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import type { IssueListItem } from '@nocobase/app-plugin-projects/shared/issues';

import type {
  IssueProgress,
  IssueProgressState,
} from '../../shared/project-manager.js';
import {
  issueProgress,
  prefetchProgressReads,
  type ProgressMemo,
} from '../agents/manager/progress.js';

export interface ProgressDeps {
  readonly agents: Pick<
    Agents,
    'runs' | 'agents' | 'runners' | 'claims' | 'availability'
  >;
  readonly projects: Pick<Projects, 'commentQueries' | 'issueContext' | 'tx'>;
}

const NOW: Readonly<Record<IssueProgressState, string>> = {
  working: 'An agent is working on it.',
  queued: 'It waits for an agent to start on it.',
  checksPending: "Its pull request's checks are running.",
  needsDecision: "It waits for its owner's decision.",
  waitingForContinuation: 'It waits for someone to let the work go on.',
  inReview: 'It waits for its owner to accept it.',
  notStarted: 'Nobody has started it.',
  finished: 'It is finished.',
  idle: 'Nothing is happening on it.',
};

/** How each of `issues` is going, by id, as `readerId` may know it. */
export async function progressOf(
  deps: ProgressDeps,
  issues: readonly IssueListItem[],
  readerId: string,
): Promise<Map<string, Record<string, unknown>>> {
  const conn = deps.projects.tx.read();
  const viewer = { userId: readerId, seesMachines: false };
  // What every issue's progress reads, read for all of them at once; the rest is worked out as for one issue.
  const reads = await prefetchProgressReads(deps, conn, issues, viewer);
  const memo: ProgressMemo = new Map();
  return new Map(
    await Promise.all(
      issues.map(async (issue): Promise<[string, Record<string, unknown>]> => [
        issue.id,
        progressFacts(
          issue,
          await issueProgress(deps, conn, issue, viewer, memo, { reads }),
        ),
      ]),
    ),
  );
}

/** The facts of an issue's progress, those nobody knows left out. */
export function progressFacts(
  issue: Pick<IssueListItem, 'owner' | 'executorName' | 'lastActivityAt'>,
  progress: IssueProgress,
): Record<string, unknown> {
  const facts: Record<string, unknown> = {
    now: NOW[progress.state],
    owner: issue.owner?.name,
    executor: issue.executorName,
    agent: progress.agent?.name,
    step: progress.step,
    since: progress.since,
    pullRequest: progress.pullRequest
      ? (progress.pullRequest.url ?? `#${progress.pullRequest.number}`)
      : undefined,
    question: progress.question,
    next: progress.next,
    waitingFor: progress.waiting
      ? {
          reason: progress.waiting.reason,
          owner: progress.waiting.owner?.name,
        }
      : undefined,
    handOver: progress.handOver || undefined,
    lastActivityAt: issue.lastActivityAt,
  };
  return Object.fromEntries(
    Object.entries(facts).filter(
      ([, value]) => value !== undefined && value !== null,
    ),
  );
}
