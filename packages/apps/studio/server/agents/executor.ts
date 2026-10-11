import { randomUUID } from 'node:crypto';
import type { Agent } from '@nocobase/app-plugin-agents/shared/agents';
import type {
  Actor,
  ProjectsTx,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { IN_PROGRESS_STATUS } from '../../shared/design.js';
import { OPEN_PR_ACTION } from './capabilities.js';

export function canImplement(agent: Pick<Agent, 'actions'>): boolean {
  return agent.actions.includes(OPEN_PR_ACTION);
}

/** Startup guard only; an explicit comment may still ask a designer to answer. */
export async function requireImplementer(
  tx: ProjectsTx,
  issue: Issue,
  agent: Agent | null,
  actor: Actor,
): Promise<boolean> {
  if (issue.statusKey !== IN_PROGRESS_STATUS || !agent || canImplement(agent))
    return true;
  const activities = await tx.conn.repository('pmActivities').findMany({
    filter: { issueId: issue.id, action: 'stage_action_skipped' },
  });
  const alreadyReported = activities.some((activity) => {
    const details = activity.details as Record<string, unknown> | null;
    return (
      details?.reason === 'executorCannotImplement' &&
      details.agentId === agent.id &&
      details.revision === issue.revision
    );
  });
  if (!tx.rehearsal && !alreadyReported) {
    await tx.conn.repository('pmActivities').createOne({
      values: {
        id: randomUUID(),
        issueId: issue.id,
        actorType: actor.type,
        actorId: actor.id,
        action: 'stage_action_skipped',
        details: {
          reason: 'executorCannotImplement',
          revision: issue.revision,
          agentId: agent.id,
          name: agent.name,
          rule: 'runAgent',
          statusKey: issue.statusKey,
        },
        createdAt: new Date(),
      },
    });
    tx.emit({
      type: 'work.announced',
      kind: 'agent.stage',
      payload: {
        notice: 'stage_action_problem',
        issue,
        rule: 'runAgent',
        statusKey: issue.statusKey,
        statusName: issue.statusKey,
        reason: 'executorCannotImplement',
        agentId: agent.id,
        agentName: agent.name,
        agentNameText: agent.nameText,
        at: new Date().toISOString(),
      },
    });
  }
  return false;
}

export function stageInputVersion(
  issue: Pick<Issue, 'id' | 'statusKey' | 'revision'>,
): { issueId: string; statusKey: string; revision: number } {
  return {
    issueId: issue.id,
    statusKey: issue.statusKey,
    revision: issue.revision,
  };
}
