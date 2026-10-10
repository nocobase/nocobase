/**
 * Agents as a kind of principal of the projects plugin (`agent`): named by their names, given issues to execute by
 * people who may wake them, mentioned in comments (`mention://agent/<id>`), and never allowed by a workflow to finish
 * or close an issue themselves. Only runner agents take issues: an online agent has no working directory, so it is neither
 * offered as an executor nor mentioned in an issue's comments (the issue subject takes runner agents only).
 */
import {
  DomainError,
  type IssueWorkHandler,
  type PrincipalKind,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';

import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';

import { STUDIO_NAMESPACE } from '../../shared/access.js';
import { BUSINESS_KEYS } from '@nocobase/app-plugin-projects/shared/access';

import { grantableToAgents } from '../access/action-policy.js';
import { AGENT_KIND } from './tx.js';

export function createAgentKind(deps: {
  readonly agents: Pick<Agents, 'agents' | 'availability'>;
  readonly work: IssueWorkHandler;
}): PrincipalKind {
  const { agents: services } = deps;
  const agents = services.agents;
  const workableAgent = async (conn: DatabaseConnection, id: string) => {
    const agent = await agents.findWorkable(conn, id);
    return agent?.type === 'runner' ? agent : null;
  };
  return {
    key: AGENT_KIND,
    title: { key: 'studioAgents.principalKinds.agent', ns: STUDIO_NAMESPACE },
    async names(conn, ids) {
      const names = new Map<string, string>();
      for (const id of ids) {
        const agent = await agents.find(conn, id);
        if (agent) names.set(id, agent.name);
      }
      return names;
    },
    executor: {
      async require(conn, id, userId) {
        const agent = await workableAgent(conn, id);
        if (!agent)
          throw new DomainError(
            'invalid',
            'INVALID_EXECUTOR',
            'The executor is not an agent that can take work: a runner agent that is not archived.',
          );
        if (!agents.mayInvoke(agent, userId))
          throw new DomainError(
            'forbidden',
            'AGENT_FORBIDDEN',
            `You may not give work to ${agent.name}.`,
          );
      },
      async canKeep(conn, id, ownerUserId) {
        const agent = await workableAgent(conn, id);
        return agent !== null && agents.mayInvoke(agent, ownerUserId);
      },
      async candidates(conn, userId) {
        return (await agents.listActive(conn))
          .filter(
            (agent) =>
              agent.type === 'runner' && agents.mayInvoke(agent, userId),
          )
          .map((agent) => agent.id);
      },
      async describe(conn, ids) {
        const found = [];
        for (const id of ids) {
          const agent = await agents.find(conn, id);
          if (agent) found.push(agent);
        }
        // A runner that could take its work: the tool installed and signed in, and one the agent may use.
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
      async candidates(conn, { userId, q, limit }) {
        const needle = q.trim().toLowerCase();
        return (await agents.listActive(conn))
          .filter(
            (agent) =>
              agent.type === 'runner' &&
              agents.mayInvoke(agent, userId) &&
              (!needle || agent.name.toLowerCase().includes(needle)),
          )
          .slice(0, limit)
          .map((agent) => ({
            kind: AGENT_KIND,
            id: agent.id,
            name: agent.name,
            ...(agent.nameText ? { nameText: agent.nameText } : {}),
            ...(agent.description ? { hint: agent.description } : {}),
          }));
      },
      async mayMention(conn, id, { userId, note }) {
        if (note) return true;
        const agent = await workableAgent(conn, id);
        return agent !== null && agents.mayInvoke(agent, userId);
      },
    },
    mayEnter: (category) => category !== 'done' && category !== 'closed',
    mayTargetAny: false,
    work: deps.work,
    actions: BUSINESS_KEYS.map(({ key }) => key).filter(grantableToAgents),
  };
}
