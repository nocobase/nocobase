/** Only the project manager and work it handed out use the issue's current owner. */
import type {
  Agents,
  SubjectBinding,
} from '@nocobase/app-plugin-agents/server/tokens';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { AGENT_KIND } from './tx.js';

export function issueExecutionIdentity(
  agents: Pick<Agents, 'runs' | 'agents'>,
  projects: () => Pick<Projects, 'issueContext' | 'commentQueries'>,
): NonNullable<SubjectBinding['actsAs']> {
  return async (conn, work) => {
    const seen = new Set<string>();
    const comments = await projects().commentQueries.list(conn, work.subjectId);
    const byId = new Map(comments.map((comment) => [comment.id, comment]));
    async function inChain(
      agentId: string,
      inputs: typeof work.inputs,
      cause?: string,
    ): Promise<boolean> {
      if (agentId === PROJECT_MANAGER_ID) return true;
      if (cause && !seen.has(cause)) {
        seen.add(cause);
        const previous = await agents.runs.identityInputs(conn, cause);
        if (
          previous?.run.subject.id === work.subjectId &&
          previous.run.subject.kind === 'issue' &&
          (await inChain(previous.run.agentId, previous.inputs))
        )
          return true;
      }
      for (const input of inputs) {
        const payload =
          input.payload && typeof input.payload === 'object'
            ? (input.payload as Record<string, unknown>)
            : {};
        if (payload.ownerIdentity === true) return true;
        if (
          typeof payload.causedByRunId === 'string' &&
          (await inChain(agentId, [], payload.causedByRunId))
        )
          return true;
        // Old queued steps predate the explicit marker. Follow their recorded comment source,
        // or the hand-over thread when old comments did not record a run.
        let comment =
          typeof payload.commentId === 'string'
            ? byId.get(payload.commentId)
            : undefined;
        if (
          comment?.source?.runId &&
          (await inChain(agentId, [], comment.source.runId))
        )
          return true;
        if (input.actor.kind !== 'agent') continue;
        if (input.actor.id === PROJECT_MANAGER_ID) return true;
        const visited = new Set<string>();
        while (comment && !visited.has(comment.id)) {
          visited.add(comment.id);
          if (
            comment.authorType === AGENT_KIND &&
            comment.authorId === PROJECT_MANAGER_ID
          )
            return true;
          if (
            comment.source?.runId &&
            (await inChain(agentId, [], comment.source.runId))
          )
            return true;
          comment = comment.parentId ? byId.get(comment.parentId) : undefined;
        }
      }
      return false;
    }
    if (!(await inChain(work.agentId, work.inputs, work.causedByRunId)))
      return undefined;
    const issue = await projects().issueContext.contextFor(
      conn,
      work.subjectId,
      { kind: AGENT_KIND },
    );
    const ownerId = issue?.owner.id;
    if (!ownerId) return { actorUserId: null, reason: 'noOwner' };
    if (!(await validIssueOwner(conn, ownerId)))
      return { actorUserId: null, reason: 'noOwner' };
    const agent = await agents.agents.findWorkable(conn, work.agentId);
    if (!agent || !agents.agents.mayInvoke(agent, ownerId))
      return { actorUserId: null, reason: 'notAllowed' };
    return { actorUserId: ownerId };
  };
}

export async function validIssueOwner(
  conn: DatabaseConnection,
  id: string,
): Promise<boolean> {
  const user = await conn
    .repository<{
      id: string;
      disabledAt: string | null;
      deletedAt: string | null;
    }>('user')
    .findOne({ filter: { id } });
  return Boolean(user && !user.disabledAt && !user.deletedAt);
}
