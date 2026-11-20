import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization';
import {
  ApiError,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  describeRoute,
} from '@nocobase/app-server/router';
import type { Hono, MiddlewareHandler } from 'hono';
import type {
  LifecycleRuntime,
  ManagementAuthorization,
} from '@nocobase/lifecycle';
import {
  ManagementInput,
  ManagementResultSchema,
} from './ticket-management-schemas.js';
import { LIFECYCLE_EXAMPLE_DOMAIN, signedInUser, tags } from './api.js';
import { RecordParams } from './schemas.js';

/** Application administrators manage the full demo ticket desk. */
export async function ticketAdministrator(
  authorization: AppAuthorization | undefined,
  userId: string,
): Promise<boolean> {
  if (!authorization) return false;
  const principal = { type: 'user', id: userId };
  const sets = await authorization.permissionSets.getEffective({
    principal,
    subjects: await authorization.subjects.resolveFor(principal),
  });
  return sets.some(
    ({ key }) =>
      key === 'system-administrator' ||
      authorization.permissionSets.protection(key)?.unrestricted === true,
  );
}

export function ticketManagementRoutes(
  router: Hono<AuthEnv>,
  base: string,
  runtime: LifecycleRuntime,
  authorization: AppAuthorization | undefined,
): void {
  const requireAdministrator: MiddlewareHandler<AuthEnv> = async (
    context,
    next,
  ) => {
    if (!(await ticketAdministrator(authorization, signedInUser(context))))
      throw new ApiError({
        status: 'PERMISSION_DENIED',
        reason: 'MANAGEMENT_FORBIDDEN',
        domain: LIFECYCLE_EXAMPLE_DOMAIN,
        message: 'An application administrator is required.',
      });
    await next();
  };
  router.post(
    `${base}/tickets/:recordId/management`,
    requireAdministrator,
    describeRoute({
      tags,
      summary: 'Manage a ticket lifecycle instance',
      operationId: 'lifecycleExampleManageTicket',
      description:
        'Suspends, resumes, resets or restarts a ticket. Only application administrators may submit a command. Repeating the same request returns its original result.',
      responses: {
        200: dataResponse(ManagementResultSchema),
        400: apiErrorResponse(400),
        401: apiErrorResponse(401),
        403: apiErrorResponse(403),
        404: apiErrorResponse(404),
        409: apiErrorResponse(409),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('param', RecordParams),
    apiValidator('json', ManagementInput),
    async (context) => {
      const { recordId } = context.req.valid('param');
      const body = context.req.valid('json');
      const actor = { id: signedInUser(context) };
      const authorize: ManagementAuthorization = (request) =>
        request.actor.id === actor.id && request.lifecycle === 'tickets';
      const options = { ...body, actor, authorize };
      const data =
        body.command === 'restartAt'
          ? await runtime.restartAt('tickets', recordId, body.target, options)
          : await runtime[body.command]('tickets', recordId, options);
      return context.json({ data });
    },
  );
}
