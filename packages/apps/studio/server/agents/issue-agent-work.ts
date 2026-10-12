import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import {
  ISSUE_AGENT_WORK_BATCH,
  type IssueAgentWork,
} from '../../shared/issue-agent-work.js';
import { studioError } from '../http/errors.js';
import { ISSUE_SUBJECT } from './catalog/triggers.js';

/** Only the requested, visible issues. Approvals override runs, while workflow stages do not. */
export async function readIssueAgentWork(
  deps: {
    readonly projects: Pick<Projects, 'issueQueries' | 'approvals'>;
    readonly runs: Pick<Agents['runs'], 'workingOn'>;
  },
  viewer: Viewer,
  issueIds: readonly string[],
): Promise<IssueAgentWork[]> {
  if (issueIds.length > ISSUE_AGENT_WORK_BATCH)
    throw studioError(
      'INVALID_ARGUMENT',
      'ISSUE_WORK_BATCH_TOO_LARGE',
      'Too many issue IDs.',
    );
  const ids = [...new Set(issueIds)];
  if (ids.length === 0) return [];
  // executorType and issueIds are ORed by matching: pass only IDs to keep the scope bounded.
  const { issues } = await deps.projects.issueQueries.matching(
    viewer,
    {},
    {
      issueIds: ids,
      limit: ISSUE_AGENT_WORK_BATCH,
    },
  );
  const executors = issues.filter((issue) => issue.executor?.type === 'agent');
  const visibleIds = executors.map((issue) => issue.id);
  if (visibleIds.length === 0) return [];
  // Fail the entire summary if approvals cannot be read, so an old animation is not retained.
  const [work, approvals] = await Promise.all([
    deps.runs.workingOn(ISSUE_SUBJECT, visibleIds),
    deps.projects.approvals.pendingOn(visibleIds),
  ]);
  const key = (issueId: string, agentId: string) =>
    JSON.stringify([issueId, agentId]);
  const active = new Set(
    work
      .filter((pair) => pair.working)
      .map((pair) => key(pair.subjectId, pair.agentId)),
  );
  const waiting = new Set(
    approvals
      .filter((approval) => approval.requestedByType === 'agent')
      .map((approval) => key(approval.issueId, approval.requestedById)),
  );
  return executors.map((issue) => {
    const agentId = issue.executor!.id;
    const pair = key(issue.id, agentId);
    return {
      issueId: issue.id,
      agentId,
      working: active.has(pair) && !waiting.has(pair),
    };
  });
}
