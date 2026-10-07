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

import {
  delegatedWrite,
  refuseDelegated,
  viewerOf,
  type ViewerEnv,
} from '../../access/request.js';
import {
  boundedList,
  cursorList,
  domainRouter,
  referencedBy,
  tags,
  personOrRunSecurity,
} from '../../kernel/http.js';
import {
  ActivitySchema,
  BoundedListMeta,
  CreateIssueBody,
  CursorListMeta,
  CursorPageQuery,
  IssueBoardQuery,
  IssueBoardSchema,
  IssueDetailSchema,
  IssueListItemSchema,
  IssueListQuerySchema,
  IssueParams,
  IssueSchema,
  IssueStartsSchema,
  ProjectFilterQuery,
  StatusDefinitionSchema,
  UpdateIssueBody,
  UpdateIssueResultSchema,
} from '../../routes/schemas.js';
import type { IssueQueries } from './issue.queries.js';
import type { IssueService } from './issue.service.js';

const notFound = apiErrorResponse(
  404,
  'When the issue does not exist or the caller cannot see it.',
);
const idOrKey = '`issueId` is an id or an identifier such as `PM-12`.';
const workflowRefused =
  'When the issue’s workflow or its rules refuse the change, such as a status the caller may not move it to, an incomplete checklist (`CHECKLIST_INCOMPLETE`), open sub-issues (`SUBTASKS_OPEN`) or a blocker (`ISSUE_BLOCKED`).';

/**
 * `/api/projects/issues`. `{issueId}` is an issue id or its identifier (`PM-12`); identifiers always hold a `-`, so
 * none equals a fixed segment (`board`, `statuses`, `starts`).
 */
export function createIssueRoutes(deps: {
  readonly issues: IssueService;
  readonly queries: IssueQueries;
}): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  routes.get(
    '/',
    describeRoute({
      tags,
      summary: 'List issues',
      operationId: 'projectsListIssues',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'issue search',
        flags: {
          statusKey: { name: 'status' },
          projectId: { name: 'project' },
          ownerUserId: { name: 'owner' },
          executorId: { name: 'executor' },
          parentIssueId: {
            name: 'parent',
            description:
              'A parent issue, by identifier (PM-12) or id; none for top-level issues.',
          },
          labelId: { name: 'label' },
          pageSize: { name: 'limit' },
        },
        columns: [
          'identifier',
          'title',
          'statusKey',
          'owner.name',
          'executorName',
        ],
        action: 'pm.issues/view',
        examples: [
          'issue search --q login --status todo',
          'issue search --parent PM-12',
        ],
      }),
      description:
        'The issues the caller sees, cursor-paged. `deleted=true` lists deleted issues instead, for those who may delete issues; `parentIssueId=none` lists top-level issues only.',
      responses: {
        200: listResponse(IssueListItemSchema, CursorListMeta),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', IssueListQuerySchema),
    async (context) =>
      context.json(
        cursorList(
          await deps.queries.page(
            viewerOf(context),
            context.req.valid('query'),
          ),
        ),
      ),
  );
  routes.post(
    '/',
    describeRoute({
      tags,
      summary: 'Create an issue',
      operationId: 'projectsCreateIssue',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'issue create',
        bodyFile: 'file',
        flags: {
          statusKey: {
            name: 'status',
            description:
              'The status it starts in: analysis (design first), todo (straight to development, the default) or backlog (nothing starts).',
          },
          ownerUserId: { name: 'owner' },
          parentIssueId: { name: 'parent' },
          projectId: { name: 'project' },
          labelIds: { name: 'label' },
          description: { contentFile: true },
        },
        action: 'pm.issues/create',
        examples: ['issue create --file issue.json --status todo'],
      }),
      description:
        'Needs `create` on `pm.issues` for the issue’s project. The issue starts in `todo` unless `statusKey` names another status it may start in; the caller owns it unless `ownerUserId` says otherwise.',
      responses: {
        201: dataResponse(IssueSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(400, workflowRefused),
      },
    }),
    apiValidator('json', CreateIssueBody),
    async (context) => {
      const viewer = viewerOf(context);
      const input = context.req.valid('json');
      const delegated = await delegatedWrite(context, {
        title: `Create "${input.title}"`,
        rows: [{ op: 'issue.create', params: input }],
      });
      if (delegated) {
        const created = delegated.plan.rows[0]?.result?.created?.id;
        return context.json(
          {
            data: created ? await deps.queries.detail(viewer, created) : null,
            meta: delegated.meta,
          },
          201,
        );
      }
      return context.json(
        { data: await deps.issues.create(viewer, input) },
        201,
      );
    },
  );
  // A column per status, each with its first page; the list's filters apply.
  routes.get(
    '/board',
    describeRoute({
      tags,
      summary: 'Get the issue board',
      operationId: 'projectsGetIssueBoard',
      // The board page's columns; `issue search` lists issues on the command line.
      ...cliRoute(false),
      description:
        'A column per status, each with its first `pageSize` issues; the list’s filters apply.',
      responses: {
        200: dataResponse(IssueBoardSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', IssueBoardQuery),
    async (context) =>
      context.json({
        data: await deps.queries.board(
          viewerOf(context),
          context.req.valid('query'),
        ),
      }),
  );
  routes.get(
    '/statuses',
    describeRoute({
      tags,
      summary: 'List the statuses issues may have',
      operationId: 'projectsListIssueStatuses',
      ...cliRoute({
        command: 'issue status list',
        flags: { projectId: { name: 'project' } },
        columns: ['key', 'name', 'category'],
        examples: ['issue status list --project <project>'],
      }),
      description:
        'The statuses of `projectId`’s workflow, or of the default workflow without it. A `projectId` that names no project the caller sees is a 400 naming the field.',
      responses: {
        200: listResponse(StatusDefinitionSchema, BoundedListMeta),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', ProjectFilterQuery),
    async (context) =>
      context.json(
        boundedList(
          await referencedBy('projectId', () =>
            deps.queries.statuses(
              viewerOf(context),
              context.req.valid('query').projectId,
            ),
          ),
        ),
      ),
  );
  routes.get(
    '/starts',
    describeRoute({
      tags,
      summary: 'List the ways a new issue may start',
      operationId: 'projectsListIssueStarts',
      // The create form's start picker; `issue status list` and `issue create --help` name the statuses.
      ...cliRoute(false),
      description:
        'The initial status and every status a `startOption` rule offers in `projectId`’s workflow, or the default workflow without it. A `projectId` that names no project the caller sees is a 400 naming the field.',
      responses: {
        200: dataResponse(IssueStartsSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', ProjectFilterQuery),
    async (context) =>
      context.json({
        data: await referencedBy('projectId', () =>
          deps.queries.starts(
            viewerOf(context),
            context.req.valid('query').projectId,
          ),
        ),
      }),
  );
  routes.get(
    '/:issueId',
    describeRoute({
      tags,
      summary: 'Get an issue',
      operationId: 'projectsGetIssue',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'issue get',
        flags: { issueId: { name: 'issue' } },
        action: 'pm.issues/view',
      }),
      description: `The issue with its newest activities and comment threads, files, checklist, approvals, sub-issues and dependencies. ${idOrKey}`,
      responses: {
        200: dataResponse(IssueDetailSchema),
        ...apiErrorResponses,
        404: notFound,
      },
    }),
    apiValidator('param', IssueParams),
    async (context) =>
      context.json({
        data: await deps.queries.detail(
          viewerOf(context),
          context.req.valid('param').issueId,
        ),
      }),
  );
  // `{ issue, pendingApproval }`: 202 when the status change waits for approval, the issue then unchanged.
  routes.patch(
    '/:issueId',
    describeRoute({
      tags,
      summary: 'Update an issue',
      operationId: 'projectsUpdateIssue',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'issue update',
        bodyFile: 'file',
        flags: {
          issueId: { name: 'issue' },
          statusKey: {
            name: 'status',
            description:
              "Move it to this status, through its workflow's rules and approvals.",
          },
          revision: { hidden: true },
          ownerUserId: { name: 'owner' },
          parentIssueId: { name: 'parent' },
          projectId: { name: 'project' },
          labelIds: { name: 'label' },
          description: { contentFile: true },
        },
        action: 'pm.issues/edit',
        examples: [
          'issue update PM-12 --status in_review',
          'issue update PM-12 --file change.json',
        ],
      }),
      description: `Needs \`edit\` on the issue; closing it and changing its owner need \`close\` and \`change-owner\`. ${idOrKey}`,
      responses: {
        200: dataResponse(
          UpdateIssueResultSchema,
          'The issue after the change.',
        ),
        202: dataResponse(
          UpdateIssueResultSchema,
          'The status change waits for approval: the issue is unchanged, nothing else in the request is applied, and `pendingApproval` is the request that holds it.',
        ),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          `${workflowRefused} Also when a status change already waits for approval (\`APPROVAL_PENDING\`).`,
        ),
        404: notFound,
        409: apiErrorResponse(
          409,
          'When the issue changed since `revision` (`REVISION_CONFLICT`): read it again.',
        ),
      },
    }),
    apiValidator('param', IssueParams),
    apiValidator('json', UpdateIssueBody),
    async (context) => {
      const viewer = viewerOf(context);
      const { issueId } = context.req.valid('param');
      const { revision, ...set } = context.req.valid('json');
      const delegated = await delegatedWrite(context, {
        title: `Update ${issueId}`,
        rows: [{ op: 'issue.update', params: { issue: issueId, set } }],
      });
      if (delegated)
        return context.json({
          data: {
            issue: await deps.queries.detail(viewer, issueId),
            pendingApproval: null,
          },
          meta: delegated.meta,
        });
      const { pendingApproval, ...issue } = await deps.issues.update(
        viewer,
        issueId,
        {
          ...set,
          revision:
            revision ?? (await deps.queries.detail(viewer, issueId)).revision,
        },
      );
      return context.json(
        { data: { issue, pendingApproval: pendingApproval ?? null } },
        pendingApproval ? 202 : 200,
      );
    },
  );
  routes.delete(
    '/:issueId',
    describeRoute({
      tags,
      summary: 'Delete an issue',
      operationId: 'projectsDeleteIssue',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'issue delete',
        flags: { issueId: { name: 'issue' } },
        confirm: 'Delete this issue? It can be restored with `issue restore`.',
        action: 'pm.issues/delete',
      }),
      description: `Needs \`delete\` on \`pm.issues\`. The issue moves to the deleted list and can be restored. ${idOrKey}`,
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        404: notFound,
      },
    }),
    apiValidator('param', IssueParams),
    async (context) => {
      refuseDelegated(context);
      await deps.issues.remove(
        viewerOf(context),
        context.req.valid('param').issueId,
      );
      return context.body(null, 204);
    },
  );
  routes.post(
    '/:issueId/restore',
    describeRoute({
      tags,
      summary: 'Restore a deleted issue',
      operationId: 'projectsRestoreIssue',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'issue restore',
        flags: { issueId: { name: 'issue' } },
        action: 'pm.issues/delete',
        examples: ['issue search --deleted true', 'issue restore PM-12'],
      }),
      description: `Needs \`delete\` on \`pm.issues\`. ${idOrKey}`,
      responses: {
        200: dataResponse(IssueSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404, 'When no deleted issue has that id.'),
      },
    }),
    apiValidator('param', IssueParams),
    async (context) => {
      refuseDelegated(context);
      return context.json({
        data: await deps.issues.restore(
          viewerOf(context),
          context.req.valid('param').issueId,
        ),
      });
    },
  );
  routes.get(
    '/:issueId/activities',
    describeRoute({
      tags,
      summary: 'List an issue’s activities',
      operationId: 'projectsListIssueActivities',
      ...cliRoute({
        command: 'issue activity list',
        flags: { issueId: { name: 'issue' }, pageSize: { name: 'limit' } },
        columns: ['createdAt', 'actorName', 'action', 'via'],
        action: 'pm.issues/view',
      }),
      description: `Older activities, cursor-paged from the issue’s \`activitiesNextCursor\`. ${idOrKey}`,
      responses: {
        200: listResponse(ActivitySchema, CursorListMeta),
        ...apiErrorResponses,
        404: notFound,
      },
    }),
    apiValidator('param', IssueParams),
    apiValidator('query', CursorPageQuery),
    async (context) =>
      context.json(
        cursorList(
          await deps.queries.activities(
            viewerOf(context),
            context.req.valid('param').issueId,
            context.req.valid('query'),
          ),
        ),
      ),
  );
  return routes;
}
