import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import {
  projectsToken,
  projectsAccessToken,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import {
  apiValidator,
  describeRoute,
  defineApiRoutes,
  dataResponse,
  apiErrorResponses,
  apiErrorResponse,
  cliRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context } from 'hono';
import { z } from 'zod';

import { studioError, studioErrorHandler } from '../http/errors.js';
import { createPermissionSource } from './commands/permissions.js';
import { createAskerLookup } from './conversation/acting.js';
import { callerOfRequest } from './run-principal.js';
import { pendingStageRun, continueStageRun } from './continue-stage-run.js';

const Params = z.object({ issueId: z.string().min(1) });
const Input = z.object({ token: z.string().uuid() });
const Pending = z
  .object({
    token: z.string(),
    statusKey: z.string(),
    maxRuns: z.number(),
    windowHours: z.number(),
  })
  .nullable();

export const stageRunRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(({ container }) => {
    if (
      !container.has(authenticationToken) ||
      !container.has(authorizationToken) ||
      !container.has(projectsToken) ||
      !container.has(agentsToken)
    )
      return new Hono();
    const agents = container.resolve(agentsToken);
    const projects = container.resolve(projectsToken);
    const permissions = createPermissionSource(
      () =>
        container.has(projectsAccessToken)
          ? container.resolve(projectsAccessToken)
          : undefined,
      createAskerLookup(agents),
    );
    const routes = new Hono<AuthorizationEnv>();
    routes.onError(studioErrorHandler);
    routes.use(
      '*',
      container.resolve(authenticationToken).required({ scopedKeys: true }),
    );
    routes.use('*', container.resolve(authorizationToken).middleware());
    const viewerOf = async (
      context: Context<AuthorizationEnv>,
      action: string,
    ) => {
      const identity = callerOfRequest(context as unknown as Context);
      if (!identity || !(await agents.gate.allowed(identity)).has(action))
        throw studioError(
          'PERMISSION_DENIED',
          'ACTION_FORBIDDEN',
          'This action is not allowed.',
        );
      return permissions.viewerOf(identity);
    };
    routes.get(
      '/:issueId',
      describeRoute({
        tags: ['Studio'],
        operationId: 'issueStageRunPending',
        summary: 'Get a suppressed stage action',
        ...cliRoute(false),
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        description:
          'Needs pm.issues/view. Returns a continuation only to a person who may edit the issue.',
        responses: {
          200: dataResponse(Pending),
          ...apiErrorResponses,
          404: apiErrorResponse(404, 'Issue not found.'),
        },
      }),
      apiValidator('param', Params),
      async (context) =>
        context.json({
          data: await pendingStageRun(
            projects,
            await viewerOf(context, 'pm.issues/view'),
            context.req.valid('param').issueId,
          ),
        }),
    );
    routes.post(
      '/:issueId/continue',
      describeRoute({
        tags: ['Studio'],
        operationId: 'issueStageRunContinue',
        summary: 'Continue a suppressed stage action',
        ...cliRoute(false),
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        description:
          'Needs pm.issues/edit on the issue. The token is consumed once; failed preconditions leave it pending.',
        responses: {
          200: dataResponse(
            z.object({ runId: z.string(), statusKey: z.string() }),
          ),
          ...apiErrorResponses,
          400: apiErrorResponse(
            400,
            'Invalid input or stale/unavailable continuation.',
          ),
          404: apiErrorResponse(404, 'Issue not found.'),
        },
      }),
      apiValidator('param', Params),
      apiValidator('json', Input),
      async (context) =>
        context.json({
          data: await continueStageRun(
            projects,
            agents,
            await viewerOf(context, 'pm.issues/edit'),
            context.req.valid('param').issueId,
            context.req.valid('json').token,
          ),
        }),
    );
    const router = new Hono();
    router.route('/issueStageRuns', routes);
    return router;
  });
