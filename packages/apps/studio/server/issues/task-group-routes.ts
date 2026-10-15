/**
 * `/api/taskGroups` (`shared/task-groups.ts`, `task-groups.ts`): the issue lists' split view and table, grouped.
 *
 * - `GET /taskGroups`: the groups of the query's tasks, a page of each; `group` with `cursor` and `generation` continues
 *   one group.
 * - `GET /taskGroups/children`: the first page of the children of each task in `parentIds` in the table, read together;
 *   with one parent, `cursor` continues its children. `generation` required.
 * - `GET /taskGroups/rows`: single tasks as the query lists them now, with the lists' membership, so a page refreshes
 *   only the rows a change named.
 * - `GET /taskGroups/summary`: My tasks' merged counts, reused for a few seconds per viewer.
 *
 * Each needs a signed-in person, or an API key, with the projects plugin's issue view permission; a key restricted to
 * some projects reads only their tasks. A continuation whose data changed answers `409 TASK_GROUPS_CHANGED`.
 */
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import {
  projectsAccessToken,
  projectsToken,
  type Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import { IssueListItemSchema } from '@nocobase/app-plugin-projects/server';
import { userPreferencesServiceToken } from '@nocobase/app-plugin-users/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import { cachingToken } from '@nocobase/app-server/caching';
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

import {
  TASK_CHILDREN_PARENTS_MAX,
  TASK_GROUP_IDS,
  TASK_GROUP_ROWS_MAX,
  WAIT_REASONS,
  type TaskChildrenPages,
  type TaskGroupItem,
  type TaskGroupRows,
  type TaskGroups,
  type TaskGroupSummary,
} from '../../shared/task-groups.js';
import { createFollowUps } from '../follow-ups/service.js';
import { studioError, studioErrorHandler } from '../http/errors.js';
import { studioInboxToken } from '../inbox/token.js';
import { TaskGroupsChangedError } from './task-group-model.js';
import { createTaskGroups } from './task-groups.js';

const tags = ['Studio'];

const Query = z.object({
  q: z.string().max(500).optional().describe('Text to search for.'),
  statusKey: z.string().optional().describe('Filter by issue status key.'),
  projectId: z.string().optional().describe('The project identifier.'),
  ownerUserId: z.string().optional().describe('The owner user identifier.'),
  executorId: z.string().optional().describe('The executor identifier.'),
  involvesUserId: z.string().optional().meta({
    description:
      'Owned by this user or executed by them as a person, each task once.',
  }),
  labelId: z.string().optional().describe('The label identifier.'),
  sort: z.enum(['updated', 'created', 'number', 'priority']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  mode: z.enum(['split', 'table']).optional().meta({
    description:
      'The split view lists top-level tasks (default); the table lists task trees by their roots.',
  }),
  follow: z.enum(['all', 'scope']).optional().meta({
    description:
      '`all`: the follow group holds every followed task the search matches, beyond the other filters.',
  }),
  group: z.enum(TASK_GROUP_IDS).optional().describe('The API key scope group.'),
  generation: z.string().optional().meta({
    description:
      'The generation of the first response; required with a cursor.',
  }),
  cursor: z.string().max(4096).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const Item = z.object({
  issue: IssueListItemSchema,
  parent: z.object({ id: z.string(), identifier: z.string() }).nullable(),
  waits: z.array(z.enum(WAIT_REASONS)),
  waitingSince: z.string().nullable(),
  followed: z.boolean(),
  unread: z.number(),
  progress: z.object({ finished: z.number(), total: z.number() }),
  hasChildren: z.boolean(),
  context: z.boolean(),
  expand: z.array(z.string()),
}) satisfies z.ZodType<TaskGroupItem>;

const Groups = z.object({
  generation: z.string(),
  membership: z.string().meta({
    description:
      'Which tasks each group holds; unchanged by edits that move no task between groups.',
  }),
  mode: z.enum(['split', 'table']),
  groups: z.array(
    z.object({
      group: z.enum(TASK_GROUP_IDS),
      count: z.number(),
      data: z.array(Item),
      nextCursor: z.string().nullable(),
    }),
  ),
  following: z.array(z.string()),
  waiting: z.number(),
}) satisfies z.ZodType<TaskGroups>;

const Children = z.object({
  generation: z.string(),
  parents: z.array(
    z.object({
      parentId: z.string(),
      data: z.array(Item),
      nextCursor: z.string().nullable(),
    }),
  ),
}) satisfies z.ZodType<TaskChildrenPages>;

const Rows = z.object({
  membership: z.string().meta({
    description:
      "As the groups' membership: when it differs from the one shown, read the groups again.",
  }),
  data: z.array(Item),
}) satisfies z.ZodType<TaskGroupRows>;

/** A comma-separated list of ids, each once, at most `max`. */
const idList = (max: number) =>
  z
    .string()
    .min(1)
    .transform((value) => [
      ...new Set(
        value
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    ])
    .pipe(z.array(z.string().min(1).max(64)).min(1).max(max));

const TaskCount = z.object({ open: z.number(), waiting: z.number() });
const Summary = z.object({
  mine: TaskCount,
  waiting: z.number().meta({
    description:
      'Tasks owned or executed by the caller, plus followed tasks, waiting for them, each once.',
  }),
}) satisfies z.ZodType<TaskGroupSummary>;

export const taskGroupRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(({ container }) => {
    const router = new Hono<{ Variables: { taskViewer: Viewer } }>();
    router.onError(studioErrorHandler);
    router.use(
      '*',
      container.resolve(authenticationToken).required({ scopedKeys: true }),
    );
    router.use('*', container.resolve(authorizationToken).middleware());
    router.use('*', async (context, next) => {
      const authz = context.get('authz' as never) as AuthorizationContext;
      const restrictions =
        authz.identity.keyScope?.objects('pm.projects') ?? 'all';
      const userId = (context.get('auth' as never) as { user: { id: string } })
        .user.id;
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
      context.set('taskViewer', viewer);
      await next();
    });

    const projects = container.resolve(projectsToken);
    const service = createTaskGroups({
      projects,
      cache: container.has(cachingToken)
        ? container
            .resolve(cachingToken)
            .getCache({ namespace: 'studio:task-group-summary' })
        : undefined,
      inbox: container.has(studioInboxToken)
        ? container.resolve(studioInboxToken)
        : undefined,
      follows:
        container.has(userPreferencesServiceToken) && container.has(agentsToken)
          ? createFollowUps({
              projects,
              agents: container.resolve(agentsToken),
              preferences: container.resolve(userPreferencesServiceToken),
            })
          : undefined,
    });
    const changed = (error: unknown): never => {
      if (error instanceof TaskGroupsChangedError)
        throw studioError('ABORTED', 'TASK_GROUPS_CHANGED', error.message);
      throw error;
    };

    router.get(
      '/summary',
      describeRoute({
        tags,
        operationId: 'studioReadTaskGroupSummary',
        summary: 'Count the tasks the caller owns or executes',
        ...cliRoute(false),
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: { 200: dataResponse(Summary), ...apiErrorResponses },
      }),
      async (context) =>
        context.json({
          data: await service.summary(context.get('taskViewer')),
        }),
    );
    router.get(
      '/children',
      describeRoute({
        tags,
        operationId: 'studioReadTaskGroupChildren',
        summary: 'Read the children of tasks in the grouped table',
        description:
          "The first page of each named parent's children, read together; with one parent, `cursor` continues its children.",
        ...cliRoute(false),
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          200: dataResponse(Children),
          409: apiErrorResponse(409, 'The tasks changed; read them again.'),
          ...apiErrorResponses,
        },
      }),
      apiValidator(
        'query',
        Query.omit({ group: true, mode: true })
          .extend({
            parentIds: idList(TASK_CHILDREN_PARENTS_MAX).meta({
              description: `Comma-separated task ids, at most ${TASK_CHILDREN_PARENTS_MAX}.`,
            }),
            generation: z.string().min(1),
          })
          .refine((input) => !input.cursor || input.parentIds.length === 1, {
            message: 'A continuation names one parent.',
            path: ['cursor'],
          }),
      ),
      async (context) => {
        try {
          return context.json({
            data: await service.children(
              context.get('taskViewer'),
              context.req.valid('query'),
            ),
          });
        } catch (error) {
          return changed(error);
        }
      },
    );
    router.get(
      '/rows',
      describeRoute({
        tags,
        operationId: 'studioReadTaskGroupRows',
        summary: 'Read single tasks as an issue list groups them now',
        description:
          "The named tasks the caller may see, each as the query lists it, with the lists' membership; any other id is left out.",
        ...cliRoute(false),
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          200: dataResponse(Rows),
          409: apiErrorResponse(409, 'The tasks changed; read them again.'),
          ...apiErrorResponses,
        },
      }),
      apiValidator(
        'query',
        Query.omit({
          group: true,
          cursor: true,
          generation: true,
          limit: true,
        }).extend({
          ids: idList(TASK_GROUP_ROWS_MAX).meta({
            description: `Comma-separated task ids, at most ${TASK_GROUP_ROWS_MAX}.`,
          }),
        }),
      ),
      async (context) => {
        try {
          return context.json({
            data: await service.rows(
              context.get('taskViewer'),
              context.req.valid('query'),
            ),
          });
        } catch (error) {
          return changed(error);
        }
      },
    );
    router.get(
      '/',
      describeRoute({
        tags,
        operationId: 'studioReadTaskGroups',
        summary: 'Read the grouped tasks of an issue list',
        ...cliRoute(false),
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          200: dataResponse(Groups),
          409: apiErrorResponse(409, 'The tasks changed; read them again.'),
          ...apiErrorResponses,
        },
      }),
      apiValidator(
        'query',
        Query.refine(
          (input) => !input.cursor || Boolean(input.group && input.generation),
          { message: 'A continuation names its group and generation.' },
        ),
      ),
      async (context) => {
        try {
          return context.json({
            data: await service.read(
              context.get('taskViewer'),
              context.req.valid('query'),
            ),
          });
        } catch (error) {
          return changed(error);
        }
      },
    );
    return new Hono().route('/taskGroups', router);
  });
