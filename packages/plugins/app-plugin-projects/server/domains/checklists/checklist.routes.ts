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
  BoundedListMeta,
  ChecklistItemParams,
  IssueChecklistSchema,
  IssueParams,
  UpdateChecklistItemBody,
} from '../../routes/schemas.js';
import type { ChecklistService } from './checklist.service.js';

/**
 * Under `/api/projects/issues`: `GET /{issueId}/checklists` (every checklist the issue has had) and
 * `PATCH /{issueId}/checklists/{statusKey}/items/{itemKey} { checked }` (the checklist after the change).
 */
export function createChecklistRoutes(
  checklists: ChecklistService,
): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  routes.get(
    '/:issueId/checklists',
    describeRoute({
      tags,
      summary: 'List an issue’s checklists',
      operationId: 'projectsListIssueChecklists',
      ...cliRoute({
        command: 'issue checklist list',
        flags: { issueId: { name: 'issue' } },
        columns: ['statusKey', 'current', 'complete', 'items.length'],
        action: 'pm.issues/view',
      }),
      description:
        'Every checklist the issue has had, one per status, the current status’s first. `issueId` is an id or an identifier.',
      responses: {
        200: listResponse(IssueChecklistSchema, BoundedListMeta),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', IssueParams),
    async (context) =>
      context.json(
        boundedList(
          await checklists.list(
            viewerOf(context),
            context.req.valid('param').issueId,
          ),
        ),
      ),
  );
  routes.patch(
    '/:issueId/checklists/:statusKey/items/:itemKey',
    describeRoute({
      tags,
      summary: 'Check or uncheck a checklist item',
      operationId: 'projectsUpdateChecklistItem',
      ...cliRoute({
        command: 'issue checklist mark',
        flags: {
          issueId: { name: 'issue' },
          statusKey: { name: 'status' },
          itemKey: { name: 'item' },
          checked: {
            description:
              '`--checked` ticks the item, `--no-checked` clears it.',
          },
        },
        action: 'pm.issues/edit',
        examples: [
          'issue checklist mark PM-12 in_review tests-pass --checked',
          'issue checklist mark PM-12 in_review tests-pass --no-checked',
        ],
      }),
      description:
        'Needs `edit` on the issue. Answers the checklist after the change.',
      responses: {
        200: dataResponse(IssueChecklistSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', ChecklistItemParams),
    apiValidator('json', UpdateChecklistItemBody),
    async (context) => {
      const { issueId, statusKey, itemKey } = context.req.valid('param');
      return context.json({
        data: await checklists.set(
          viewerOf(context),
          issueId,
          statusKey,
          itemKey,
          context.req.valid('json'),
        ),
      });
    },
  );
  return routes;
}
