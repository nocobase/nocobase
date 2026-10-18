import {
  ApiError,
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
import type { IssueSessionIntegration } from '../../tokens.js';

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
  IssueSessionHeader,
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
const statusRefused =
  'When the change is refused, such as a status the caller may not move it to (`TRANSITION_NOT_ALLOWED`) or a status that does not exist (`INVALID_STATUS`).';

/**
 * `/api/projects/issues`. `{issueId}` is an issue id or its identifier (`PM-12`); identifiers always hold a `-`, so
 * none equals a fixed segment (`board`, `statuses`).
 */
export function createIssueRoutes(deps: {
  readonly issues: IssueService;
  readonly queries: IssueQueries;
  readonly session?: () => IssueSessionIntegration | undefined;
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
        // Session context comes from the bridge's environment, not a user-supplied CLI flag.
        bodyFile: 'file',
        flags: {
          'x-nb-agent-session': { hidden: true },
          statusKey: {
            name: 'status',
            description:
              'The status it starts in: in_progress (start now) or backlog (nothing starts, the default).',
          },
          ownerUserId: { name: 'owner' },
          parentIssueId: { name: 'parent' },
          projectId: { name: 'project' },
          labelIds: { name: 'label' },
          description: { contentFile: true },
        },
        action: 'pm.issues/create',
        examples: [
          'issue create --file issue.json --status in_progress --start',
        ],
      }),
      description:
        'Needs `create` on `pm.issues` for the issue’s project. A session context header must identify an active session owned by the caller; its project is the default and successful creation is linked to it. The issue starts in `backlog` unless `statusKey` is `in_progress`; explicit `start: true` with backlog or an omitted status is refused before saving (`ISSUE_START_REQUIRES_IN_PROGRESS`). Use `--status in_progress --start` to request work. The caller owns it unless `ownerUserId` says otherwise. Without `executor` it gets the default executor, if a kind names one. Optional `attachmentIds` binds the caller’s own unattached uploads in the creation transaction before work starts; this also needs `upload` on `pm.attachments`.',
      responses: {
        201: dataResponse(IssueSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(400, statusRefused),
        409: apiErrorResponse(
          409,
          'When the dependency graph changed (`DEPENDENCY_GRAPH_CHANGED`): reload and retry.',
        ),
      },
    }),
    apiValidator('header', IssueSessionHeader),
    apiValidator('json', CreateIssueBody),
    async (context) => {
      const viewer = viewerOf(context);
      let input = context.req.valid('json');
      const sessionId = context.req.valid('header')['x-nb-agent-session'];
      let session:
        | Awaited<ReturnType<IssueSessionIntegration['creationContext']>>
        | undefined;
      if (sessionId !== undefined) {
        const integration = deps.session?.();
        if (
          !integration ||
          viewer.actor.type !== 'user' ||
          context.get('auth')?.credential
        )
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            reason: 'SESSION_CONTEXT_REFUSED',
            domain: 'projects',
            message: 'A session context requires its signed-in owner.',
          });
        session = await integration.creationContext(viewer, sessionId);
        const projectId = input.projectId ?? session.projectId;
        if (!projectId)
          throw new ApiError({
            status: 'INVALID_ARGUMENT',
            reason: 'SESSION_PROJECT_REQUIRED',
            domain: 'projects',
            message: 'This session has no project. Specify a project.',
          });
        input = { ...input, projectId };
      }
      const delegated = await delegatedWrite(context, {
        title: `Create "${input.title}"`,
        rows: [{ op: 'issue.create', params: input }],
      });
      if (delegated) {
        const created = delegated.plan.rows[0]?.result?.created?.id;
        if (created && session) await session.link(created);
        return context.json(
          {
            data: created ? await deps.queries.detail(viewer, created) : null,
            meta: delegated.meta,
          },
          201,
        );
      }
      const created = await deps.issues.create(viewer, input);
      if (session) await session.link(created.id);
      return context.json({ data: created }, 201);
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
        columns: ['key', 'name', 'category'],
        examples: ['issue status list'],
      }),
      description: 'The six fixed statuses, in order.',
      responses: {
        200: listResponse(StatusDefinitionSchema, BoundedListMeta),
        ...apiErrorResponses,
      },
    }),
    (context) => context.json(boundedList(deps.queries.statuses())),
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
      description: `The issue with its newest activities and comment threads, files, sub-issues and dependencies, and application progress when available. ${idOrKey}`,
      responses: {
        200: dataResponse(IssueDetailSchema),
        ...apiErrorResponses,
        404: notFound,
      },
    }),
    apiValidator('param', IssueParams),
    async (context) => {
      const viewer = viewerOf(context);
      const issue = await deps.queries.detail(
        viewer,
        context.req.valid('param').issueId,
      );
      const integration = deps.session?.();
      return context.json({
        data: integration
          ? { ...issue, progress: await integration.progress(viewer, issue) }
          : issue,
      });
    },
  );
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
              'Move it to this status: backlog, in_progress, blocked, in_review, done or cancelled.',
          },
          revision: { hidden: true },
          ownerUserId: { name: 'owner' },
          parentIssueId: { name: 'parent' },
          projectId: { name: 'project' },
          labelIds: { name: 'label' },
          description: { contentFile: true },
          needsYou: { name: 'needs-you', contentFile: true },
          next: { contentFile: true },
          acceptance: { contentFile: true },
        },
        action: 'pm.issues/edit',
        examples: [
          'issue update PM-12 --status in_review --needs-you "Review the change and accept it or send it back."',
          'issue update PM-12 --status in_review --needs-you "Check the export filter and accept it." --acceptance-file report.md',
          'issue update PM-12 --file change.json',
        ],
      }),
      description: `Needs \`edit\` on the issue; closing it and changing its owner need \`close\` and \`change-owner\`. ${idOrKey}`,
      responses: {
        200: dataResponse(
          UpdateIssueResultSchema,
          'The issue after the change.',
        ),
        ...apiErrorResponses,
        400: apiErrorResponse(400, statusRefused),
        404: notFound,
        409: apiErrorResponse(
          409,
          'When the issue changed since `revision` (`REVISION_CONFLICT`), or its dependency graph changed (`DEPENDENCY_GRAPH_CHANGED`): read it again and retry.',
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
          data: { issue: await deps.queries.detail(viewer, issueId) },
          meta: delegated.meta,
        });
      const issue = await deps.issues.update(viewer, issueId, {
        ...set,
        revision:
          revision ?? (await deps.queries.detail(viewer, issueId)).revision,
      });
      return context.json({ data: { issue } }, 200);
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
        409: apiErrorResponse(
          409,
          'When the dependency graph changed (`DEPENDENCY_GRAPH_CHANGED`): reload and retry the deletion.',
        ),
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
        400: apiErrorResponse(
          400,
          'When restoring its waits would create a cycle (`DEPENDENCY_CYCLE`).',
        ),
        409: apiErrorResponse(
          409,
          'When the dependency graph changed (`DEPENDENCY_GRAPH_CHANGED`): reload and retry.',
        ),
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
