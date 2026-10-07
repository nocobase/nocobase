import {
  apiErrorResponses,
  cliRoute,
  dataResponse,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import type { Hono, MiddlewareHandler } from 'hono';

import { viewerOf, type ViewerEnv } from '../../access/request.js';
import { boundedList, domainRouter, tags } from '../../kernel/http.js';
import {
  ApiKeyActorSchema,
  BoundedListMeta,
  ExecutorCandidateSchema,
  MemberSchema,
  MeSchema,
} from '../../routes/schemas.js';
import type { MemberService } from './member.service.js';

/** Makes the signed-in user a member before anything else; install after authentication. */
export function ensureMemberMiddleware(
  members: MemberService,
): MiddlewareHandler<ViewerEnv> {
  return async (context, next) => {
    const auth = context.get('auth');
    if (auth) await members.ensure(auth.user.id);
    await next();
  };
}

/**
 * `/api/projects/me`, `/members`, `/apiKeyActors` and `/executors`. The lists are bounded by the application's
 * accounts and are answered whole: pickers need every entry.
 */
export function createMemberRoutes(members: MemberService): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  routes.get(
    '/me',
    describeRoute({
      tags,
      summary: 'Get the signed-in user and their permissions',
      operationId: 'projectsGetMe',
      // The projects pages' permission bootstrap; `access me` answers who the caller is.
      ...cliRoute(false),
      responses: { 200: dataResponse(MeSchema), ...apiErrorResponses },
    }),
    async (context) =>
      context.json({ data: await members.me(viewerOf(context)) }),
  );
  routes.get(
    '/members',
    describeRoute({
      tags,
      summary: 'List members',
      operationId: 'projectsListMembers',
      ...cliRoute({
        command: 'project member candidates',
        columns: ['userId', 'name', 'email'],
      }),
      description: 'Every active user of the application, answered whole.',
      responses: {
        200: listResponse(MemberSchema, BoundedListMeta),
        ...apiErrorResponses,
      },
    }),
    async (context) =>
      context.json(boundedList(await members.list(viewerOf(context)))),
  );
  routes.get(
    '/apiKeyActors',
    describeRoute({
      tags,
      summary: 'List API key identities',
      operationId: 'projectsListApiKeyActors',
      // Names API keys' changes in the pages; nothing to type.
      ...cliRoute(false),
      description:
        'The service accounts organization API keys act as, so their changes can be shown under the key’s name.',
      responses: {
        200: listResponse(ApiKeyActorSchema, BoundedListMeta),
        ...apiErrorResponses,
      },
    }),
    async (context) => context.json(boundedList(await members.apiKeyActors())),
  );
  routes.get(
    '/executors',
    describeRoute({
      tags,
      summary: 'List executors of other kinds',
      operationId: 'projectsListExecutors',
      ...cliRoute({
        command: 'issue executor list',
        columns: ['type', 'id', 'name', 'online', 'busy'],
        examples: [
          'issue update PM-12 --executor type=agent --executor id=<id>',
        ],
      }),
      description:
        'Principals of kinds other plugins registered, such as agents, that the caller may make an issue’s executor.',
      responses: {
        200: listResponse(ExecutorCandidateSchema, BoundedListMeta),
        ...apiErrorResponses,
      },
    }),
    async (context) =>
      context.json(boundedList(await members.executors(viewerOf(context)))),
  );
  return routes;
}
