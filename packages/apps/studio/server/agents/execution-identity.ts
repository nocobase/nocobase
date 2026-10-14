/** Only the project manager and work it handed out use the issue's current owner. */
import type {
  Agents,
  SubjectBinding,
} from '@nocobase/app-plugin-agents/server/tokens';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { AGENT_KIND } from './tx.js';
import { readOwnerHandoff } from '../issues/owner-handoff.js';
import { findIssue } from '../previews/sources.js';

export function issueExecutionIdentity(
  agents: Pick<Agents, 'runs' | 'agents'>,
  projects: () => Pick<Projects, 'issueContext' | 'commentQueries'>,
): NonNullable<SubjectBinding['actsAs']> {
  return async (conn, work) => {
    if ((await readOwnerHandoff(conn, work.subjectId))?.waiting)
      return { actorUserId: null, reason: 'waitingOwner' };
    if (work.commentExecution === 'requester' && work.actorUserId) {
      const agent = await agents.agents.findWorkable(conn, work.agentId);
      return agent &&
        agents.agents.mayInvoke(agent, work.actorUserId) &&
        (await validIssueOwner(conn, work.actorUserId))
        ? { actorUserId: work.actorUserId }
        : { actorUserId: null, reason: 'notAllowed' };
    }
    if (work.commentExecution !== 'owner' && work.causedByRunId) {
      const cause = await agents.runs.identityInputs(conn, work.causedByRunId);
      if (
        cause?.run.subject.kind === 'issue' &&
        cause.run.subject.id === work.subjectId &&
        cause.run.commentExecution === 'requester'
      ) {
        const agent = await agents.agents.findWorkable(conn, work.agentId);
        return agent &&
          agents.agents.mayInvoke(agent, cause.run.actorUserId) &&
          (await validIssueOwner(conn, cause.run.actorUserId))
          ? { actorUserId: cause.run.actorUserId }
          : { actorUserId: null, reason: 'notAllowed' };
      }
    }
    const seen = new Set<string>();
    // The issue's comments, read only when a step's source has to be followed through them.
    let byId:
      | Map<
          string,
          Awaited<
            ReturnType<ReturnType<typeof projects>['commentQueries']['list']>
          >[number]
        >
      | undefined;
    const comment = async (id: string) => {
      byId ??= new Map(
        (await projects().commentQueries.list(conn, work.subjectId)).map(
          (item) => [item.id, item],
        ),
      );
      return byId.get(id);
    };
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
          (await inChain(
            previous.run.agentId,
            previous.inputs,
            previous.run.retryOfRunId ?? undefined,
          ))
        )
          return true;
      }
      for (const input of inputs) {
        const payload =
          input.payload && typeof input.payload === 'object'
            ? (input.payload as Record<string, unknown>)
            : {};
        // A real issue comment, including a direct mention or reply, starts as the current owner.
        if (typeof payload.commentId === 'string') return true;
        if (payload.ownerIdentity === true) return true;
        if (
          typeof payload.retryOfRunId === 'string' &&
          (await inChain(agentId, [], payload.retryOfRunId))
        )
          return true;
        if (
          typeof payload.causedByRunId === 'string' &&
          (await inChain(agentId, [], payload.causedByRunId))
        )
          return true;
        // Old queued steps predate the explicit marker. Follow their recorded comment source,
        // or the hand-over thread when old comments did not record a run.
        let source =
          typeof payload.commentId === 'string'
            ? await comment(payload.commentId)
            : undefined;
        if (
          source?.source?.runId &&
          (await inChain(agentId, [], source.source.runId))
        )
          return true;
        if (input.actor.kind !== 'agent') continue;
        if (input.actor.id === PROJECT_MANAGER_ID) return true;
        const visited = new Set<string>();
        while (source && !visited.has(source.id)) {
          visited.add(source.id);
          if (
            source.authorType === AGENT_KIND &&
            source.authorId === PROJECT_MANAGER_ID
          )
            return true;
          if (
            source.source?.runId &&
            (await inChain(agentId, [], source.source.runId))
          )
            return true;
          source = source.parentId ? await comment(source.parentId) : undefined;
        }
      }
      return false;
    }
    if (!(await inChain(work.agentId, work.inputs, work.causedByRunId)))
      return undefined;
    // The issue's row alone: its owner is all this needs of it.
    const issue = await findIssue(conn, work.subjectId);
    // Missing subjects are rejected by claim admission with its precise reason.
    if (!issue || issue.deleted) return undefined;
    const ownerId = issue.ownerUserId;
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
