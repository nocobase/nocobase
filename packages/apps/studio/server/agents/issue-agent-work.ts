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

/**
 * Only the requested, visible issues an agent executes (their project manager): whether any agent works on each now,
 * the project manager or an agent it handed a step to.
 */
export async function readIssueAgentWork(
  deps: {
    readonly projects: Pick<Projects, 'issueQueries'>;
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
  const working = new Set(
    (await deps.runs.workingOn(ISSUE_SUBJECT, visibleIds))
      .filter((pair) => pair.working)
      .map((pair) => pair.subjectId),
  );
  return executors.map((issue) => ({
    issueId: issue.id,
    agentId: issue.executor!.id,
    working: working.has(issue.id),
  }));
}
