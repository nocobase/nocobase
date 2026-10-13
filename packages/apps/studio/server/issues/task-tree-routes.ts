import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import {
  projectsAccessToken,
  projectsToken,
  type Viewer,
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
import { Hono } from 'hono';
import { z } from 'zod';
import { studioInboxToken } from '../inbox/token.js';
import { studioError, studioErrorHandler } from '../http/errors.js';
import { TreeCursorError } from './tree-model.js';
import { readTaskTrees } from './task-trees.js';
import { TASK_GROUPS } from '../../shared/task-trees.js';
import { IssueListItemSchema as IssueSchema } from '@nocobase/app-plugin-projects/server';

const Query = z.object({
  q: z.string().max(500).optional(),
  statusKey: z.string().optional(),
  projectId: z.string().optional(),
  ownerUserId: z.string().optional(),
  executorId: z.string().optional(),
  labelId: z.string().optional(),
  parentIssueId: z.string().optional(),
  sort: z.enum(['updated', 'created', 'number', 'priority']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  group: z.enum(TASK_GROUPS).optional(),
  parentId: z.string().optional(),
  generation: z.string().optional(),
  cursor: z.string().max(4096).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
const Reason = z.enum(['question', 'review', 'failedRun', 'ownerHandoff']);
const Row = z.object({
  issue: IssueSchema,
  parentId: z.string().nullable(),
  rootId: z.string(),
  matchesFilter: z.boolean(),
  hasChildren: z.boolean(),
  progress: z.object({ finished: z.number(), total: z.number() }),
  attention: z.object({
    reasons: z.array(Reason),
    needsHumanAction: z.boolean(),
    waitingForViewer: z.boolean(),
  }),
  explanation: z.object({ identifier: z.string(), reason: Reason }).nullable(),
});
const Page = z.object({
  generation: z.string(),
  data: z.array(Row),
  nextCursor: z.string().nullable(),
});
const Trees = z.object({
  generation: z.string(),
  groups: z.array(
    Page.extend({
      group: z.enum(TASK_GROUPS),
      totals: z.object({
        tasks: z.number(),
        trees: z.number(),
        needsHumanAction: z.number(),
        waitingForViewer: z.number(),
      }),
    }),
  ),
});

export const taskTreeRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    router.onError(studioErrorHandler);
    router.use(
      '*',
      container.resolve(authenticationToken).required({ scopedKeys: true }),
    );
    router.use('*', container.resolve(authorizationToken).middleware());
    for (const children of [false, true])
      router.get(
        children ? '/children' : '/',
        describeRoute({
          tags: ['Studio'],
          operationId: children ? 'taskTreeChildren' : 'taskTrees',
          summary: children
            ? 'Read authorized task children'
            : 'Read grouped authorized task trees',
          ...cliRoute(false),
          security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
          responses: {
            200: dataResponse(children ? Page : Trees),
            409: apiErrorResponse(
              409,
              'The task query changed; refresh the tree.',
            ),
            ...apiErrorResponses,
          },
        }),
        apiValidator(
          'query',
          children
            ? Query.extend({
                parentId: z.string().min(1),
                generation: z.string().min(1),
              })
            : Query.omit({ parentId: true }).refine(
                (input) =>
                  !input.cursor || Boolean(input.group && input.generation),
                {
                  message: 'Group continuations require group and generation.',
                },
              ),
        ),
        async (context) => {
          const authz = context.get('authz' as never) as AuthorizationContext;
          const restrictions =
            authz.identity.keyScope?.objects('pm.projects') ?? 'all';
          const userId = (
            context.get('auth' as never) as { user: { id: string } }
          ).user.id;
          const viewer: Viewer = {
            userId,
            actor: { type: 'user', id: userId },
            permissions: await container
              .resolve(projectsAccessToken)
              .permissionsOf(authz.identity),
            ...(restrictions === 'all' ? {} : { projectIds: restrictions }),
          };
          if (viewer.permissions.scopes['pm.issues/view'] === 'none')
            throw studioError(
              'PERMISSION_DENIED',
              'ACTION_FORBIDDEN',
              'You may not view tasks.',
            );
          try {
            return context.json({
              data: await readTaskTrees(
                container.resolve(projectsToken),
                container.has(studioInboxToken)
                  ? container.resolve(studioInboxToken)
                  : undefined,
                viewer,
                context.req.valid('query'),
              ),
            });
          } catch (error) {
            if (error instanceof TreeCursorError)
              throw studioError('ABORTED', 'TASK_TREE_CHANGED', error.message);
            throw error;
          }
        },
      );
    return new Hono().route('/taskTrees', router);
  });
