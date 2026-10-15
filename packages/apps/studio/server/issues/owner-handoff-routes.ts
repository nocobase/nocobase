import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import {
  projectsAccessToken,
  projectsToken,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { createPermissionSource } from '../agents/commands/permissions.js';
import { createAskerLookup } from '../agents/conversation/acting.js';
import { callerOfRequest } from '../agents/run-principal.js';
import { studioError, studioErrorHandler } from '../http/errors.js';
import { createOwnerHandoffApi } from './owner-handoff-api.js';

const Params = z.object({ issueId: z.string().min(1) });
const Input = z.strictObject({ notificationKey: z.string().uuid() });
const Handoff = z.object({
  issueId: z.string(),
  waiting: z.boolean(),
  ownerUserId: z.string(),
  previousOwnerUserId: z.string(),
  transferredByUserId: z.string(),
  notificationKey: z.string(),
  transferredAt: z.string(),
  rejectedAt: z.string().nullable(),
});
export const ownerHandoffRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(({ container }) => {
    const agents = container.resolve(agentsToken);
    const projects = container.resolve(projectsToken);
    const permissions = createPermissionSource(
      () => container.resolve(projectsAccessToken),
      createAskerLookup(agents),
    );
    const api = createOwnerHandoffApi(projects, agents);
    const router = new Hono();
    router.onError(studioErrorHandler);
    router.use(
      '*',
      container.resolve(authenticationToken).required({ scopedKeys: true }),
    );
    router.use('*', container.resolve(authorizationToken).middleware());
    router.use('*', async (context, next) => {
      const identity = callerOfRequest(context as unknown as Context);
      const action =
        context.req.method === 'GET' ? 'pm.issues/view' : 'pm.issues/edit';
      if (!identity || !(await agents.gate.allowed(identity)).has(action))
        throw studioError(
          'PERMISSION_DENIED',
          'ACTION_FORBIDDEN',
          'This action is not allowed.',
        );
      if (context.req.method !== 'GET' && identity.kind !== 'user')
        throw studioError(
          'PERMISSION_DENIED',
          'ISSUE_OWNER_HANDOFF_REQUIRED',
          'An agent cannot consent to an owner handoff.',
        );
      await next();
    });
    router.get(
      '/:issueId',
      describeRoute({
        tags: ['Studio'],
        operationId: 'issueOwnerHandoffGet',
        summary: 'Get an issue owner handoff',
        ...cliRoute({
          command: 'issue handoff get',
          args: ['issueId'],
          flags: { issueId: { name: 'issue' } },
          action: 'pm.issues/view',
          identities: ['person'],
        }),
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          200: dataResponse(
            z.object({
              handoff: Handoff.nullable(),
              canDecide: z.boolean(),
              canClaim: z.boolean(),
            }),
          ),
          404: apiErrorResponse(404, 'Issue not found.'),
          ...apiErrorResponses,
        },
      }),
      apiValidator('param', Params),
      async (context) => {
        const identity = callerOfRequest(context as unknown as Context)!;
        return context.json({
          data: await api.read(
            await permissions.viewerOf(identity),
            context.req.valid('param').issueId,
            identity.kind === 'user' ? identity.userId : null,
          ),
        });
      },
    );
    for (const decision of ['accept', 'reject'] as const)
      router.post(
        `/:issueId/${decision}`,
        describeRoute({
          tags: ['Studio'],
          operationId: `issueOwnerHandoff${decision === 'accept' ? 'Accept' : 'Reject'}`,
          summary: `${decision === 'accept' ? 'Accept' : 'Reject'} an issue owner handoff`,
          ...cliRoute({
            command: `issue handoff ${decision}`,
            args: ['issueId'],
            flags: { issueId: { name: 'issue' } },
            action: 'pm.issues/edit',
            identities: ['person'],
            readBinding: {
              operation: 'issueOwnerHandoffGet',
              params: { issueId: 'issueId' },
              responseField: 'data.handoff.notificationKey',
              bodyField: 'notificationKey',
            },
          }),
          security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
          description:
            'Only the current owner in person, with issue editing permission, may decide the current handoff. Rejection keeps the issue paused. The CLI reads the current handoff once to supply notificationKey automatically. A missing handoff stops the command; a stale notification returns a conflict with a refresh hint and is never retried.',
          responses: {
            200: dataResponse(
              z.object({ handoff: Handoff, runId: z.string().nullable() }),
            ),
            409: apiErrorResponse(409, 'The handoff is no longer current.'),
            404: apiErrorResponse(404, 'Issue not found.'),
            ...apiErrorResponses,
          },
        }),
        apiValidator('param', Params),
        apiValidator('json', Input),
        async (context) => {
          const identity = callerOfRequest(context as unknown as Context)!;
          return context.json({
            data: await api.decide(
              await permissions.viewerOf(identity),
              context.req.valid('param').issueId,
              identity.kind === 'user' ? identity.userId : null,
              context.req.valid('json').notificationKey,
              decision,
            ),
          });
        },
      );
    return new Hono().route('/issueOwnerHandoffs', router);
  });
