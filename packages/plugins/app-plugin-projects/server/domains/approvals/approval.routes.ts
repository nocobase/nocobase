import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import type { Hono } from 'hono';

import { viewerOf, type ViewerEnv } from '../../access/request.js';
import { boundedList, domainRouter, tags } from '../../kernel/http.js';
import {
  ApprovalParams,
  ApprovalRequestSchema,
  BoundedListMeta,
  DecideApprovalBody,
} from '../../routes/schemas.js';
import type { ApprovalService } from './approval.service.js';

const decided = apiErrorResponse(
  400,
  'When the request is no longer pending (`APPROVAL_DECIDED`).',
);

/**
 * `/api/projects/approvals`: `GET /` the requests waiting for the caller; `POST /{approvalId}/approve` and `/reject`
 * (body `{ comment? }`) by one of its approvers; `POST /{approvalId}/withdraw` by whoever asked. Each answers the
 * request.
 */
export function createApprovalRoutes(
  approvals: ApprovalService,
): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  routes.get(
    '/',
    describeRoute({
      tags,
      summary: 'List the approval requests waiting for the caller',
      operationId: 'projectsListApprovals',
      ...cliRoute({
        command: 'approval list',
        columns: [
          'id',
          'issueIdentifier',
          'fromStatus',
          'toStatus',
          'requestedByName',
          'createdAt',
        ],
      }),
      responses: {
        200: listResponse(ApprovalRequestSchema, BoundedListMeta),
        ...apiErrorResponses,
      },
    }),
    async (context) =>
      context.json(boundedList(await approvals.mine(viewerOf(context)))),
  );
  for (const [verb, summary, description] of [
    [
      'approve',
      'Approve a status change',
      'By one of the request’s approvers; the issue moves, unless the move’s conditions no longer hold (the request is then `stale`).',
    ],
    [
      'reject',
      'Reject a status change',
      'By one of the request’s approvers; the issue stays.',
    ],
  ] as const)
    routes.post(
      `/:approvalId/${verb}`,
      describeRoute({
        tags,
        summary,
        operationId:
          verb === 'approve'
            ? 'projectsApproveApproval'
            : 'projectsRejectApproval',
        ...cliRoute({
          command: `approval ${verb}`,
          flags: { approvalId: { name: 'approval' } },
          examples: [`approval ${verb} <approval> --comment "…"`],
        }),
        description,
        responses: {
          200: dataResponse(ApprovalRequestSchema),
          ...apiErrorResponses,
          400: decided,
          404: apiErrorResponse(404),
        },
      }),
      apiValidator('param', ApprovalParams),
      apiValidator('json', DecideApprovalBody),
      async (context) =>
        context.json({
          data: await approvals[verb](
            viewerOf(context),
            context.req.valid('param').approvalId,
            context.req.valid('json'),
          ),
        }),
    );
  routes.post(
    '/:approvalId/withdraw',
    describeRoute({
      tags,
      summary: 'Withdraw an approval request',
      operationId: 'projectsWithdrawApproval',
      ...cliRoute({
        command: 'approval withdraw',
        flags: { approvalId: { name: 'approval' } },
      }),
      description: 'By whoever asked for the status change.',
      responses: {
        200: dataResponse(ApprovalRequestSchema),
        ...apiErrorResponses,
        400: decided,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', ApprovalParams),
    async (context) =>
      context.json({
        data: await approvals.withdraw(
          viewerOf(context),
          context.req.valid('param').approvalId,
        ),
      }),
  );
  return routes;
}
