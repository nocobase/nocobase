/**
 * `GET /api/agents/available`: the agents the caller may give work to, for a person (session or API key, scoped keys
 * included) and for an agent's run, which asks for the person who woke it: enabled agents discovered from runners and
 * reported recently (`Agents.roster`). The Agent page's list is `GET /api/agents`; this answers only what picking one
 * needs.
 */
import {
  apiErrorResponses,
  cliRoute,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import type { Hono, MiddlewareHandler } from 'hono';

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
        'The enabled agents the caller (for a run, the person who woke its agent) may give work to, one for each coding tool and model the runners report: what each is good at, whether a runner would take the caller’s work now, whether only personal runners have it, and how many of its runs have not finished. Agents no runner reported for 14 days are left out.',
      security: personOrRunSecurity,
      responses: {
        200: listResponse(AvailableAgentSchema),
        ...apiErrorResponses,
      },
      ...cliRoute({
        command: 'agent list',
        action: AGENTS_VIEW_ACTION,
        columns: ['id', 'name', 'online', 'busy', 'goodAt'],
        examples: ['agent list', 'agent list --json'],
      }),
    }),
    async (context) => {
      const data = await services.roster(
        services.tx.read(),
        context.get('caller').userId,
      );
      return context.json({ data, meta: { total: data.length } });
    },
  );
  return router;
}
