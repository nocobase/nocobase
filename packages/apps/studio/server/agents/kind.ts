/**
 * Agents as a kind of principal of the projects plugin (`agent`): named by their names, mentioned in comments
 * (`mention://agent/<id>`), and as an issue's executor only the project manager, which every new issue gets unless its
 * creator names another executor (`defaultExecutor`). Only the project manager moves an issue, and only between the
 * open statuses: it never finishes or closes one, and agents doing a step move nothing (`moves`, `mayMove`).
 * People who may edit and comment on a managed issue can mention its project manager; agents use ordinary replies.
 * Other mentions name the enabled agents discovered from runners, which the project manager hands steps to.
 */
import {
  DomainError,
  type IssueWorkHandler,
  type PrincipalKind,
  type MentionContext,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';

import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import {
  BLOCKED_STATUS,
  IN_PROGRESS_STATUS,
  IN_REVIEW_STATUS,
} from '@nocobase/app-plugin-projects/shared/statuses';

import { STUDIO_NAMESPACE } from '../../shared/access.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { BUSINESS_KEYS } from '@nocobase/app-plugin-projects/shared/access';

import { grantableToAgents } from '../access/action-policy.js';
import { AGENT_KIND } from './tx.js';

/** The open statuses the project manager moves an issue between. */
const MANAGED_STATUSES: readonly string[] = [
  IN_PROGRESS_STATUS,
  BLOCKED_STATUS,
  IN_REVIEW_STATUS,
];

/** The project manager's moves: between any two open statuses. */
export const MANAGER_MOVES: readonly { from: string; to: string }[] =
  MANAGED_STATUSES.flatMap((from) =>
    MANAGED_STATUSES.filter((to) => to !== from).map((to) => ({ from, to })),
  );

export function createAgentKind(deps: {
  readonly agents: Pick<Agents, 'agents' | 'availability'>;
  readonly work: IssueWorkHandler;
}): PrincipalKind {
  const { agents: services } = deps;
  const agents = services.agents;
  /** The project manager, while it may take work. */
  const manager = (conn: DatabaseConnection) =>
    agents.find(conn, PROJECT_MANAGER_ID);
  /** An agent discovered from runners that may take work (a mention). */
  const workableAgent = async (conn: DatabaseConnection, id: string) => {
    const agent = await agents.findWorkable(conn, id);
    return agent?.source === 'runner' ? agent : null;
  };
  const managerMentionError = (context?: MentionContext) => {
    const reject = (code: string, message: string) =>
      new DomainError('forbidden', code, message);
    if (
      context &&
      (context.viewer.actor.type !== 'user' ||
        context.viewer.actor.via === 'agent')
    )
      return reject(
        'MANAGER_MENTION_AGENT',
        'Use a normal reply; the system coordinates waking the project manager.',
      );
    if (
      !context ||
      context.issue.executor?.type !== AGENT_KIND ||
      context.issue.executor.id !== PROJECT_MANAGER_ID
    )
      return reject(
        'MANAGER_MENTION_EXECUTOR',
        'You may only mention the project manager on an issue it executes.',
      );
    if (!context.canCommentIssue || !context.canEditIssue)
      return reject(
        'MANAGER_MENTION_PERMISSION',
        'Mentioning the project manager requires permission to comment on and edit this issue.',
      );
    return null;
  };
  return {
    key: AGENT_KIND,
    title: { key: 'studioAgents.principalKinds.agent', ns: STUDIO_NAMESPACE },
    async names(conn, ids) {
      const names = await agents.names(conn, ids);
      return names;
    },
    executor: {
      async require(conn, id) {
        if (id !== PROJECT_MANAGER_ID || !(await manager(conn)))
          throw new DomainError(
            'invalid',
            'INVALID_EXECUTOR',
            'Only the project manager executes an issue among the agents; it hands each step to an agent.',
          );
      },
      async canKeep(_conn, id) {
        return id === PROJECT_MANAGER_ID;
      },
      async candidates(conn) {
        return (await manager(conn)) ? [PROJECT_MANAGER_ID] : [];
      },
      async describe(conn, ids) {
        const found = [];
        for (const id of ids) {
          const agent = await agents.find(conn, id);
          if (agent) found.push(agent);
        }
        const availability = await services.availability(conn, found);
        return found.map((agent) => ({
          id: agent.id,
          name: agent.name,
          ...(agent.nameText ? { nameText: agent.nameText } : {}),
          online: availability.get(agent.id)?.online ?? false,
          busy: availability.get(agent.id)?.busy ?? 0,
        }));
      },
    },
    mention: {
      async candidates(conn, { q, limit, context }) {
        const needle = q.trim().toLowerCase();
        const coordinator = managerMentionError(context)
          ? null
          : await manager(conn);
        const matches = (name: string) =>
          !needle || name.toLowerCase().includes(needle);
        const found =
          coordinator && matches(coordinator.name) ? [coordinator] : [];
        found.push(
          ...(await agents.listActive(conn)).filter(
            (agent) =>
              agent.source === 'runner' &&
              agent.id !== PROJECT_MANAGER_ID &&
              matches(agent.name),
          ),
        );
        return found.slice(0, limit).map((agent) => ({
          kind: AGENT_KIND,
          id: agent.id,
          name: agent.name,
          ...(agent.id !== PROJECT_MANAGER_ID && agent.nameText
            ? { nameText: agent.nameText }
            : {}),
          ...(agent.description ? { hint: agent.description } : {}),
        }));
      },
      async mayMention(conn, id, { note, context }) {
        if (note) return true;
        if (id === PROJECT_MANAGER_ID) {
          const error = managerMentionError(context);
          if (error) throw error;
          return (await manager(conn)) !== null;
        }
        return (await workableAgent(conn, id)) !== null;
      },
    },
    moves: MANAGER_MOVES,
    mayMove: (_conn, actor) => actor.id === PROJECT_MANAGER_ID,
    async defaultExecutor(conn) {
      return (await manager(conn)) ? PROJECT_MANAGER_ID : null;
    },
    work: deps.work,
    actions: BUSINESS_KEYS.map(({ key }) => key).filter(grantableToAgents),
  };
}
