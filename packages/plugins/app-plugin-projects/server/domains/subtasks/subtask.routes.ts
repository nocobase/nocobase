import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
  emptyResponse,
} from '@nocobase/app-server/router';
import type { Hono } from 'hono';

import {
  delegatedWrite,
  refuseDelegated,
  viewerOf,
  type ViewerEnv,
} from '../../access/request.js';
import { domainRouter, personOrRunSecurity, tags } from '../../kernel/http.js';
import {
  AddDependencyBody,
  DependencyParams,
  IssueDependencySchema,
  IssueParams,
  RemoveDependencyBody,
  UpdateDependencyBody,
} from '../../routes/schemas.js';
import { requireEditor } from '../issues/index.js';
import type { SubtaskService } from './subtask.service.js';

const access =
  'Needs `edit` on the issue. `issueId` and `dependsOnIssueId` are ids or identifiers.';

/**
 * Under `/api/projects/issues`: `POST /{issueId}/dependencies` (201, the link as the issue page shows it),
 * `PATCH /{issueId}/dependencies/{dependencyId}` (200, changes its type in place),
 * `DELETE /{issueId}/dependencies/{dependencyId}` and `POST /{issueId}/removeDependency { dependsOnIssueId, type? }`
 * (204), which removes the link by the other issue.
 */
export function createSubtaskRoutes(subtasks: SubtaskService): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  routes.post(
    '/:issueId/dependencies',
    describeRoute({
      tags,
      summary: 'Add a dependency to an issue',
      operationId: 'projectsAddIssueDependency',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'issue dependency add',
        args: ['issueId', 'dependsOnIssueId'],
        flags: {
          issueId: { name: 'issue' },
          dependsOnIssueId: {
            name: 'dependsOn',
            description: 'The issue it waits for, by identifier or id.',
          },
        },
        action: 'pm.issues/edit',
      }),
      description: `${access} \`blockedBy\` (the default) holds the issue until the other is finished; \`relatedTo\` only links them.`,
      responses: {
        201: dataResponse(IssueDependencySchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'When `dependsOnIssueId` names no issue the caller sees or the issue itself (`INVALID_DEPENDENCY`), or the link would make issues wait in a cycle (`DEPENDENCY_CYCLE`) or too deep a chain (`DEPENDENCY_TOO_DEEP`).',
        ),
        404: apiErrorResponse(404),
        409: apiErrorResponse(
          409,
          'When the issues are already linked (`DEPENDENCY_EXISTS`).',
        ),
      },
    }),
    apiValidator('param', IssueParams),
    apiValidator('json', AddDependencyBody),
    async (context) => {
      const { issueId } = context.req.valid('param');
      const input = context.req.valid('json');
      const delegated = await delegatedWrite(context, {
        title: `Link ${issueId} and ${input.dependsOnIssueId}`,
        rows: [
          {
            op: 'dependency',
            params: {
              action: 'add',
              issue: issueId,
              dependsOn: input.dependsOnIssueId,
              type: input.type ?? 'blockedBy',
            },
          },
        ],
      });
      if (delegated)
        return context.json(
          {
            data: delegated.plan.rows[0]?.result?.created ?? null,
            meta: delegated.meta,
          },
          201,
        );
      return context.json(
        {
          data: await subtasks.addDependency(viewerOf(context), issueId, input),
        },
        201,
      );
    },
  );
  routes.patch(
    '/:issueId/dependencies/:dependencyId',
    async (context, next) => {
      requireEditor(viewerOf(context));
      refuseDelegated(context);
      await next();
    },
    describeRoute({
      tags,
      summary: 'Change an issue relationship type',
      operationId: 'projectsUpdateIssueDependency',
      // The issue page names a relationship row; the CLI links and unlinks by the other issue.
      ...cliRoute(false),
      description: `${access} Changes the link in one transaction and keeps its id. A related link may be changed from either end; the current issue waits when the new type is blockedBy. An existing target type is refused without removing either link.`,
      responses: {
        200: dataResponse(IssueDependencySchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The target is no longer visible, the change would create a dependency cycle, or a delegated caller needs a confirmed plan (PLAN_REQUIRED).',
        ),
        404: apiErrorResponse(404),
        409: apiErrorResponse(
          409,
          'The relationship changed (DEPENDENCY_CHANGED) or the target type already exists (DEPENDENCY_EXISTS).',
        ),
      },
    }),
    apiValidator('param', DependencyParams),
    apiValidator('json', UpdateDependencyBody),
    async (context) => {
      const { issueId, dependencyId } = context.req.valid('param');
      return context.json({
        data: await subtasks.updateDependency(
          viewerOf(context),
          issueId,
          dependencyId,
          context.req.valid('json'),
        ),
      });
    },
  );
  routes.delete(
    '/:issueId/dependencies/:dependencyId',
    describeRoute({
      tags,
      summary: 'Remove a dependency by its id',
      operationId: 'projectsDeleteIssueDependency',
      // The issue page removes a link by its row; `issue dependency remove` names the other issue instead.
      ...cliRoute(false),
      description: access,
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', DependencyParams),
    async (context) => {
      const { issueId, dependencyId } = context.req.valid('param');
      await subtasks.removeDependency(viewerOf(context), issueId, dependencyId);
      return context.body(null, 204);
    },
  );
  routes.post(
    '/:issueId/removeDependency',
    describeRoute({
      tags,
      summary: 'Remove a dependency by the other issue',
      operationId: 'projectsRemoveIssueDependency',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'issue dependency remove',
        args: ['issueId', 'dependsOnIssueId'],
        flags: {
          issueId: { name: 'issue' },
          dependsOnIssueId: {
            name: 'dependsOn',
            description: 'The issue it waits for, by identifier or id.',
          },
        },
        action: 'pm.issues/edit',
      }),
      description: `${access} Removes the link of \`type\` (\`blockedBy\` by default) to \`dependsOnIssueId\`.`,
      responses: {
        200: {
          description:
            'For a caller acting for someone else, such as an agent in a conversation: the link was removed as an undoable plan of theirs, described in `meta`.',
        },
        204: emptyResponse(),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', IssueParams),
    apiValidator('json', RemoveDependencyBody),
    async (context) => {
      const { dependsOnIssueId, type } = context.req.valid('json');
      const { issueId } = context.req.valid('param');
      const delegated = await delegatedWrite(context, {
        title: `Unlink ${issueId} and ${dependsOnIssueId}`,
        rows: [
          {
            op: 'dependency',
            params: {
              action: 'remove',
              issue: issueId,
              dependsOn: dependsOnIssueId,
              type: type ?? 'blockedBy',
            },
          },
        ],
      });
      if (delegated) return context.json({ data: null, meta: delegated.meta });
      await subtasks.removeDependencyTo(
        viewerOf(context),
        context.req.valid('param').issueId,
        dependsOnIssueId,
        type,
      );
      return context.body(null, 204);
    },
  );
  return routes;
}
