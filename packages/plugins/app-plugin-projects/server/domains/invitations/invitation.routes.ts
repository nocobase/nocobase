import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
  emptyResponse,
  listResponse,
} from '@nocobase/app-server/router';
import type { Hono } from 'hono';

import { viewerOf, type ViewerEnv } from '../../access/request.js';
import { boundedList, domainRouter, tags } from '../../kernel/http.js';
import {
  BoundedListMeta,
  CreateInvitationsBody,
  InvitationParams,
  InvitationResultSchema,
  InvitationResultsSchema,
  InvitationSchema,
} from '../../routes/schemas.js';
import type { InvitationService } from './invitation.service.js';

const access =
  'Needs `invite` on the `pm.members` settings item, or leading a project: a lead invites only into projects they lead and manages only their own invitations.';

/** `/api/projects/invitations`: list, invite several addresses, send again, revoke. */
export function createInvitationRoutes(
  invitations: InvitationService,
): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  const origin = (url: string) => new URL(url).origin;
  routes.get(
    '/',
    describeRoute({
      tags,
      summary: 'List pending and expired invitations',
      operationId: 'projectsListInvitations',
      ...cliRoute({
        command: 'project invitation list',
        columns: ['id', 'email', 'status', 'expiresAt', 'sentAt'],
      }),
      description: access,
      responses: {
        200: listResponse(InvitationSchema, BoundedListMeta),
        ...apiErrorResponses,
      },
    }),
    async (context) =>
      context.json(boundedList(await invitations.list(viewerOf(context)))),
  );
  routes.post(
    '/',
    describeRoute({
      tags,
      summary: 'Invite people',
      operationId: 'projectsCreateInvitations',
      ...cliRoute({
        command: 'project invitation create',
        flags: {
          emails: { name: 'email' },
          projectIds: { name: 'project' },
        },
        examples: [
          'project invitation create --email ada@example.com --project <project>',
        ],
      }),
      description: `${access} An address that already has an account is added to the projects at once; every other address is sent a link. One result per address.`,
      responses: {
        201: dataResponse(InvitationResultsSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', CreateInvitationsBody),
    async (context) =>
      context.json(
        {
          data: {
            results: await invitations.create(
              viewerOf(context),
              context.req.valid('json'),
              origin(context.req.url),
            ),
          },
        },
        201,
      ),
  );
  routes.post(
    '/:invitationId/resend',
    describeRoute({
      tags,
      summary: 'Send an invitation again',
      operationId: 'projectsResendInvitation',
      ...cliRoute({
        command: 'project invitation resend',
        flags: { invitationId: { name: 'invitation' } },
      }),
      description: access,
      responses: {
        200: dataResponse(InvitationResultSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', InvitationParams),
    async (context) =>
      context.json({
        data: await invitations.resend(
          viewerOf(context),
          context.req.valid('param').invitationId,
          origin(context.req.url),
        ),
      }),
  );
  routes.delete(
    '/:invitationId',
    describeRoute({
      tags,
      summary: 'Revoke an invitation',
      operationId: 'projectsRevokeInvitation',
      ...cliRoute({
        command: 'project invitation revoke',
        flags: { invitationId: { name: 'invitation' } },
        confirm: 'Revoke this invitation? Its link stops working.',
      }),
      description: access,
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', InvitationParams),
    async (context) => {
      await invitations.revoke(
        viewerOf(context),
        context.req.valid('param').invitationId,
      );
      return context.body(null, 204);
    },
  );
  return routes;
}
