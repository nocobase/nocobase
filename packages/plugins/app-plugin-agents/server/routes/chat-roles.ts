/**
 * `GET /api/agents/chatRoles`: the roles (permission sets) an agent's chat may be limited to (`Agent.chatRoles`), for
 * the Agent page's "Who can chat" picker. It needs `agents.agents` read rather than the authorization plugin's own
 * settings: someone who manages agents names roles without managing them.
 */
import {
  apiErrorResponses,
  cliRoute,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import type { Hono, MiddlewareHandler } from 'hono';

import type { ChatRole } from '../../shared/agents.js';
import { forbidden } from '../kernel/errors.js';
import { domainRouter } from '../kernel/http.js';
import type { AdminEnv } from './admin.js';
import { tags } from './openapi.js';
import { ChatRoleSchema } from './schemas.js';

export function createChatRoleRoutes(
  roles: () => Promise<readonly ChatRole[]>,
  guard: MiddlewareHandler<AdminEnv>,
): Hono<AdminEnv> {
  const router = domainRouter<AdminEnv>();
  router.get(
    '/chatRoles',
    guard,
    async (context, next) => {
      if (!(await context.get('caller').can('agents.agents', 'read')))
        throw forbidden('This needs agents.agents read permission.');
      await next();
    },
    describeRoute({
      tags,
      summary: 'List the roles an agent’s chat may be limited to',
      operationId: 'agentsListChatRoles',
      // UI-only: the Agent page's "Who can chat" picker.
      ...cliRoute(false),
      description:
        'Every permission set (role) by its key and title, for `Agent.chatRoles`. Needs `agents.agents` read.',
      responses: {
        200: listResponse(ChatRoleSchema),
        ...apiErrorResponses,
      },
    }),
    async (context) => {
      const data = await roles();
      return context.json({ data, meta: { total: data.length } });
    },
  );
  return router;
}
