/**
 * The retrospective entry: a workflow status rule (`retrospective`) Studio contributes for finished statuses. When an
 * issue enters a status carrying it, the agent the rule names (or the issue's agent executor) is woken on the issue in
 * a thread of its own (`retro`), acting for whoever finished it, to look back on it: check the user manual first, then
 * propose what else is worth keeping (`brief.ts` words it). It never makes the agent the executor, and an agent that
 * finished the issue itself is not woken by its own move.
 */
import type { ActorRef } from '@nocobase/agent-protocol';
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type {
  StatusRuleOutcome,
  StatusRuleType,
} from '@nocobase/app-plugin-projects/server/tokens';

import { ISSUE_SUBJECT } from '../agents/catalog/triggers.js';
import { AGENT_KIND, agentsTx } from '../agents/tx.js';
import { userName } from '../agents/work.js';
import { RETROSPECTIVE_TRIGGER } from './brief.js';

export const RETROSPECTIVE_RULE = 'retrospective';
/** The thread a retrospective runs in, apart from the issue's own work. */
export const RETROSPECTIVE_THREAD = 'retro';

const textOf = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

export function retrospectiveRule(deps: {
  readonly agents: () => Pick<Agents, 'runs' | 'agents'>;
}): StatusRuleType {
  const skip = (
    reason: string,
    details?: Readonly<Record<string, unknown>>,
  ): StatusRuleOutcome => ({
    status: 'skipped',
    reason,
    ...(details ? { details } : {}),
  });
  return {
    type: RETROSPECTIVE_RULE,
    categories: ['done'],
    validate: (config) => [
      ...Object.keys(config)
        .filter((field) => field !== 'agentId')
        .map((field) => ({ path: field, message: 'Unknown field.' })),
      ...(config.agentId === undefined ||
      config.agentId === '' ||
      (typeof config.agentId === 'string' && config.agentId.length <= 64)
        ? []
        : [{ path: 'agentId', message: 'agentId names an agent.' }]),
    ],
    describe(config) {
      const agentId = textOf(config.agentId);
      return {
        summary: agentId
          ? `Wakes agent ${agentId} to look back on the finished issue and propose knowledge.`
          : "Wakes the issue's agent executor to look back on the finished issue and propose knowledge.",
        attention: true,
      };
    },
    async entered(entry, config) {
      const { tx, actor, issue, status } = entry;
      const agents = deps.agents();
      const agentId =
        textOf(config.agentId) ??
        (issue.executor?.type === AGENT_KIND ? issue.executor.id : null);
      if (!agentId) return skip('noAgentExecutor');
      if (actor.type === AGENT_KIND && actor.id === agentId)
        return skip('selfTriggered', { agentId });
      const agent = await agents.agents.findWorkable(tx.conn, agentId);
      if (!agent) return skip('agentUnavailable', { agentId });
      const moverId =
        actor.type === 'user' && actor.id ? actor.id : issue.ownerUserId;
      if (!agents.agents.mayInvoke(agent, moverId))
        return skip('cannotInvoke', { agentId, userId: moverId });
      const mover: ActorRef =
        actor.type === 'user' && actor.id
          ? {
              kind: 'user',
              id: actor.id,
              name: await userName(tx.conn, actor.id),
            }
          : { kind: 'system', id: 'system', name: 'Studio' };
      const result = await agents.runs.enqueue(
        {
          agentId,
          subject: { kind: ISSUE_SUBJECT, id: issue.id },
          threadScope: RETROSPECTIVE_THREAD,
          actorUserId: moverId,
          ownerUserId: issue.ownerUserId,
          input: {
            type: 'signal',
            actor: mover,
            text: `${issue.identifier} entered \`${status.key}\` (from \`${entry.from}\`): look back on it. Check the user manual first, then propose what else is worth keeping.`,
            payload: {
              trigger: RETROSPECTIVE_TRIGGER,
              from: entry.from,
              to: status.key,
            },
          },
        },
        agentsTx(tx),
      );
      return { status: 'applied', details: { agentId, runId: result.runId } };
    },
  };
}
