import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import {
  apiErrorHandler,
  apiErrorResponses,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import { Hono } from 'hono';
import { z } from 'zod';

export const demoProjectRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono<AuthorizationEnv>();
    router.onError(apiErrorHandler);
    router.get(
      '/demoProjects/tasks',
      container.resolve(authenticationToken).required(),
      container.resolve(authorizationToken).middleware(),
      async (context, next) => {
        await context.get('authz').require({
          resource: { type: 'page', id: 'demoProjects' },
          action: 'access',
        });
        await next();
      },
      describeRoute({
        tags: ['DemoProjects'],
        summary: 'List the current visitor tasks',
        operationId: 'demoProjectsListTasks',
        responses: {
          ...apiErrorResponses,
          200: listResponse(
            z.object({ id: z.string(), title: z.string(), state: z.string() }),
          ),
        },
      }),
      async (context) => {
        const id = String(context.get('authz').identity.principal.id);
        const data = await container
          .resolve(databaseManagerToken)
          .query()
          .selectFrom('demotasks')
          .select(['id', 'title', 'state'])
          .where('assigneeId', '=', id)
          .execute();
        return context.json({ data });
      },
    );
    return new Hono().route('/', router);
  });
