/**
 * `GET /api/agents/available`: the agents the caller may give work to, for a person (session or API key, scoped keys
 * included) and for an agent's run, which asks for the person who woke it. The agents' configuration is the settings
 * API's (`GET /api/agents`, `agents.agents` read); this answers only what picking one needs.
 */
import {
  apiErrorResponses,
  cliRoute,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import type { Hono, MiddlewareHandler } from 'hono';

import { entryTools, type AvailableAgent } from '../../shared/agents.js';
import type { Agents } from '../composition.js';
import { AGENTS_VIEW_ACTION } from '../core/callers/index.js';
import { domainRouter } from '../kernel/http.js';
import type { AdminEnv } from './admin.js';
import { personOrRunSecurity, tags } from './openapi.js';
import { AvailableAgentSchema } from './schemas.js';

/** `guard` authenticates the request (a run token included) and sets `caller`. */
export function createRosterRoutes(
  services: Agents,
  guard: MiddlewareHandler<AdminEnv>,
): Hono<AdminEnv> {
  const router = domainRouter<AdminEnv>();
  router.get(
    '/available',
    guard,
    describeRoute({
      tags,
      summary: 'List the agents the caller may give work to',
      operationId: 'agentsListAvailableAgents',
      description:
        'The agents that are not archived and that the caller (for a run, the person who woke its agent) may wake: what each is good at, and whether it can take work now. An online agent with no model of its own answers with the system default chat model, and is left out only while there is none.',
      security: personOrRunSecurity,
      responses: {
        200: listResponse(AvailableAgentSchema),
        ...apiErrorResponses,
      },
      ...cliRoute({
        command: 'agent list',
        action: AGENTS_VIEW_ACTION,
        columns: ['id', 'name', 'type', 'online', 'busy', 'goodAt'],
        examples: ['agent list', 'agent list --json'],
      }),
    }),
    async (context) => {
      const userId = context.get('caller').userId;
      const hasDefault = Boolean(
        (await services.online.services.defaults()).effectiveChat,
      );
      const agents = (await services.agents.list()).filter(
        (agent) =>
          !agent.archivedAt &&
          (agent.modelEntries.length > 0 ||
            (agent.type === 'online' && hasDefault)) &&
          services.agents.mayInvoke(agent, userId),
      );
      // Whether a runner would take the caller's work: theirs, or a team runner allowed the agent's variables.
      const availability = await services.availability(
        services.tx.read(),
        agents,
        userId,
      );
      const data = agents.map((agent): AvailableAgent => ({
        id: agent.id,
        name: agent.name,
        goodAt: agent.description ?? '',
        type: agent.type,
        tool: entryTools(agent)[0] ?? null,
        online: availability.get(agent.id)?.online ?? false,
        busy: availability.get(agent.id)?.busy ?? 0,
      }));
      return context.json({ data, meta: { total: data.length } });
    },
  );
  return router;
}
