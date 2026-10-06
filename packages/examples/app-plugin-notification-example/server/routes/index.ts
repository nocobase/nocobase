import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import { notificationServiceToken } from '@nocobase/app-plugin-notification/server';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import {
  CreateTaskInput,
  ListTasksQuery,
  Task,
  TaskId,
  TaskParams,
  TaskUser,
  UpdateTaskInput,
  type TaskStatus,
} from './schemas.js';

const TASKS = 'notificationExampleTasks';
const USER_PATH = 'user';
const ROUTE_PREFIX = '/notificationExample';
const DOMAIN = 'notificationExample';
// The client page a notification opens; a browser route, not an API path.
const TASK_PAGE_PATH = '/notification-example/tasks';
/** Every route of this plugin is listed under one tag in the API document at `/api/swagger/docs`. */
const tags = ['NotificationExample'];
/** Answered for a task the caller neither created nor is assigned, and for one that does not exist. */
const taskAccessDenied = apiErrorResponse(
  403,
  'The caller is neither the creator nor the assignee of the task, or the task does not exist (`TASK_ACCESS_DENIED`).',
);

interface TaskRow {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly creatorId: string;
  readonly assigneeId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface UserRow {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

interface NotificationService {
  send(input: {
    readonly idempotencyKey: string;
    readonly source: {
      readonly type: string;
      readonly referenceId: string;
    };
    readonly messages: Record<string, object>;
  }): Promise<unknown>;
}

type NotificationExampleApplication = AppPluginApplication;
type NotificationExampleEnv = AuthEnv;

export const apiRoutes: AppApiRouteContribution<NotificationExampleApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono<NotificationExampleEnv>();
    const authentication = container.resolve(authenticationToken);
    const database = container.resolve(databaseManagerToken);
    const notifications = container.resolve(
      notificationServiceToken,
    ) as unknown as NotificationService;

    router.onError(apiErrorHandler);
    router.use(ROUTE_PREFIX, authentication.required());
    router.use(`${ROUTE_PREFIX}/*`, authentication.required());

    // The active users a task may be assigned to.
    // A bounded list: every active user at once, with `meta.total`.
    router.get(
      `${ROUTE_PREFIX}/assignees`,
      describeRoute({
        tags,
        summary: 'List assignees',
        operationId: 'notificationExampleListAssignees',
        description:
          'Every active user a task may be assigned to, by name. A bounded list: it is not paged and answers `meta.total`.',
        responses: {
          200: listResponse(TaskUser),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      async (context) => {
        const users = await listUsers(database);
        return context.json({ data: users, meta: { total: users.length } });
      },
    );

    router.get(
      `${ROUTE_PREFIX}/tasks`,
      describeRoute({
        tags,
        summary: 'List my tasks',
        operationId: 'notificationExampleListTasks',
        description:
          'The tasks the signed-in user created or is assigned, most recently updated first, paged by `page` and `pageSize`. A page past the last answers the last page.',
        responses: {
          200: listResponse(Task),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('query', ListTasksQuery),
      async (context) => {
        const userId = context.get('auth')!.user.id;
        const { page, pageSize } = context.req.valid('query');
        const result = await listTasks(database, userId, page, pageSize);
        return context.json({
          data: await toTaskViews(database, result.rows),
          meta: {
            page: result.page,
            pageSize: result.pageSize,
            total: result.total,
          },
        });
      },
    );

    router.get(
      `${ROUTE_PREFIX}/tasks/:taskId`,
      describeRoute({
        tags,
        summary: 'Get a task',
        operationId: 'notificationExampleGetTask',
        responses: {
          200: dataResponse(Task),
          ...apiErrorResponses,
          403: taskAccessDenied,
        },
      }),
      apiValidator('param', TaskParams),
      async (context) => {
        const userId = context.get('auth')!.user.id;
        const row = await participantTask(
          database,
          context.req.valid('param').taskId,
          userId,
        );
        return context.json({ data: (await toTaskViews(database, [row]))[0] });
      },
    );

    router.post(
      `${ROUTE_PREFIX}/tasks`,
      describeRoute({
        tags,
        summary: 'Create a task',
        operationId: 'notificationExampleCreateTask',
        description:
          'Creates an open task created by the signed-in user and sends its assignee an in-app notification.',
        responses: {
          201: dataResponse(Task, 'The created task.'),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
          400: apiErrorResponse(
            400,
            'The assignee is not an active user (`ASSIGNEE_NOT_FOUND`).',
          ),
        },
      }),
      apiValidator('json', CreateTaskInput),
      async (context) => {
        const userId = context.get('auth')!.user.id;
        const { title, description, assigneeId } = context.req.valid('json');
        if (!(await findUser(database, assigneeId))) throw assigneeNotFound();

        const timestamp = now();
        const id = crypto.randomUUID();
        await database
          .connection()
          .query.insertInto(TASKS)
          .values({
            id,
            title,
            description,
            status: 'open',
            creatorId: userId,
            assigneeId,
            createdAt: toDatabaseDatetime(timestamp),
            updatedAt: toDatabaseDatetime(timestamp),
          })
          .execute();

        const task = (await findTask(database, id))!;
        await sendTaskNotification(notifications, task, assigneeId, 'assigned');
        return context.json(
          { data: (await toTaskViews(database, [task]))[0] },
          201,
        );
      },
    );

    router.patch(
      `${ROUTE_PREFIX}/tasks/:taskId`,
      describeRoute({
        tags,
        summary: 'Update a task',
        operationId: 'notificationExampleUpdateTask',
        description:
          'Changes only the fields the body names, and notifies the creator, the previous and the new assignee, except the caller. Only the creator may change the assignee.',
        responses: {
          200: dataResponse(Task),
          ...apiErrorResponses,
          400: apiErrorResponse(
            400,
            'The new assignee is not an active user (`ASSIGNEE_NOT_FOUND`).',
          ),
          403: apiErrorResponse(
            403,
            'The caller is neither the creator nor the assignee of the task, or the task does not exist (`TASK_ACCESS_DENIED`), or a caller other than the creator changed the assignee (`TASK_ASSIGNMENT_FORBIDDEN`).',
          ),
        },
      }),
      apiValidator('param', TaskParams),
      apiValidator('json', UpdateTaskInput),
      async (context) => {
        const actorId = context.get('auth')!.user.id;
        const id = context.req.valid('param').taskId;
        const task = await participantTask(database, id, actorId);

        const input = context.req.valid('json');
        const title = input.title ?? task.title;
        const description = input.description ?? task.description;
        const status = input.status ?? task.status;
        const assigneeId = input.assigneeId ?? task.assigneeId;
        if (assigneeId !== task.assigneeId && actorId !== task.creatorId)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            reason: 'TASK_ASSIGNMENT_FORBIDDEN',
            domain: DOMAIN,
            message: 'Only the task creator can reassign a task.',
          });
        if (
          assigneeId !== task.assigneeId &&
          !(await findUser(database, assigneeId))
        )
          throw assigneeNotFound();

        const updatedAt = now();
        await database
          .connection()
          .query.updateTable(TASKS)
          .set({
            title,
            description,
            status,
            assigneeId,
            updatedAt: toDatabaseDatetime(updatedAt),
          })
          .where('id', '=', id)
          .execute();

        const updated = (await findTask(database, id))!;
        const recipientIds = [
          task.creatorId,
          task.assigneeId,
          assigneeId,
        ].filter(
          (recipientId, index, recipients) =>
            recipientId !== actorId &&
            recipients.indexOf(recipientId) === index,
        );
        await Promise.all(
          recipientIds.map((recipientId) =>
            sendTaskNotification(
              notifications,
              updated,
              recipientId,
              'updated',
            ),
          ),
        );
        return context.json({
          data: (await toTaskViews(database, [updated]))[0],
        });
      },
    );

    return router as unknown as Hono;
  });

const routes: readonly AppApiRouteContribution<NotificationExampleApplication>[] =
  [apiRoutes];

export default routes;

/** The current time as an RFC 3339 UTC timestamp, such as `2026-10-04T08:30:00.000Z`. */
function now(): string {
  return new Date().toISOString();
}

/**
 * The value a zone-less `datetime` column stores for an RFC 3339 UTC timestamp: the same UTC wall-clock time without
 * the zone designator, which not every dialect accepts in such a column.
 */
function toDatabaseDatetime(timestamp: string): string {
  return timestamp.replace(/Z$/u, '');
}

/**
 * A stored `datetime` as the API answers it: an RFC 3339 UTC timestamp. The column holds UTC wall-clock time, which a
 * driver returns either as a `Date` or as a zone-less string.
 */
function toRfc3339(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'string') return value;
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  return /(?:Z|[+-]\d{2}:?\d{2})$/u.test(normalized)
    ? new Date(normalized).toISOString()
    : new Date(`${normalized}Z`).toISOString();
}

function isTaskRelatedUser(task: TaskRow, userId: string): boolean {
  return task.creatorId === userId || task.assigneeId === userId;
}

/**
 * The task, when the caller is its creator or assignee. Permission comes before existence: a task the caller does not
 * take part in and one that does not exist answer the same 403, so the difference never reveals which ids exist.
 */
async function participantTask(
  database: DatabaseManager,
  id: string,
  userId: string,
): Promise<TaskRow> {
  const task = await findTask(database, id);
  if (task && isTaskRelatedUser(task, userId)) return task;
  throw new ApiError({
    status: 'PERMISSION_DENIED',
    reason: 'TASK_ACCESS_DENIED',
    domain: DOMAIN,
    message: 'Only the task creator and assignee can access a task.',
  });
}

function assigneeNotFound(): ApiError {
  return new ApiError({
    status: 'INVALID_ARGUMENT',
    reason: 'ASSIGNEE_NOT_FOUND',
    domain: DOMAIN,
    message: 'The assignee is not an active user.',
    fieldViolations: [
      {
        field: 'assigneeId',
        description: 'The assignee is not an active user.',
      },
    ],
  });
}

async function findUser(
  database: DatabaseManager,
  id: string,
): Promise<UserRow | undefined> {
  const row = await database
    .connection()
    .query.selectFrom(USER_PATH)
    .select(['id', 'name', 'email'])
    .where('id', '=', id)
    .where('disabledAt', 'is', null)
    .where('deletedAt', 'is', null)
    .executeTakeFirst();
  return row as UserRow | undefined;
}

async function listUsers(database: DatabaseManager): Promise<UserRow[]> {
  const rows = await database
    .connection()
    .query.selectFrom(USER_PATH)
    .select(['id', 'name', 'email'])
    .where('disabledAt', 'is', null)
    .where('deletedAt', 'is', null)
    .orderBy('name', 'asc')
    .execute();
  return rows as unknown as UserRow[];
}

/**
 * The task with this id, or `undefined`. An id that is not a UUID names no task, and is answered here rather than by
 * the database: PostgreSQL, Kingbase and MSSQL reject comparing it with a `uuid` column instead of matching nothing,
 * which would answer 500 where SQLite and MySQL answer 403. Ids are written lowercase by `crypto.randomUUID()`, so an
 * uppercase one is lowercased to name the same task on every dialect, not only on those that compare `uuid` natively.
 */
async function findTask(
  database: DatabaseManager,
  id: string,
): Promise<TaskRow | undefined> {
  if (!TaskId.safeParse(id).success) return undefined;
  const row = await database
    .connection()
    .query.selectFrom(TASKS)
    .selectAll()
    .where('id', '=', id.toLowerCase())
    .executeTakeFirst();
  return row as TaskRow | undefined;
}

async function listTasks(
  database: DatabaseManager,
  userId: string,
  requestedPage: number,
  pageSize: number,
): Promise<{
  readonly rows: TaskRow[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}> {
  const query = database.connection().query;
  const countRow = await query
    .selectFrom(TASKS)
    .select(({ fn }) => [fn.countAll<number>().as('count')])
    .where((expression) =>
      expression.or([
        expression('creatorId', '=', userId),
        expression('assigneeId', '=', userId),
      ]),
    )
    .executeTakeFirst<{ count: number | string }>();
  const total = Number(countRow?.count ?? 0);
  const page = Math.min(
    requestedPage,
    Math.max(1, Math.ceil(total / pageSize)),
  );
  const rows = await query
    .selectFrom(TASKS)
    .selectAll()
    .where((expression) =>
      expression.or([
        expression('creatorId', '=', userId),
        expression('assigneeId', '=', userId),
      ]),
    )
    .orderBy('updatedAt', 'desc')
    .orderBy('id', 'desc')
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .execute();
  return { rows: rows as unknown as TaskRow[], total, page, pageSize };
}

async function toTaskViews(
  database: DatabaseManager,
  rows: readonly TaskRow[],
): Promise<readonly Record<string, unknown>[]> {
  const ids = [
    ...new Set(rows.flatMap((row) => [row.creatorId, row.assigneeId])),
  ];
  const users = await Promise.all(ids.map((id) => findUser(database, id)));
  const byId = new Map(users.filter(Boolean).map((user) => [user!.id, user!]));
  return rows.map((row) => ({
    ...row,
    createdAt: toRfc3339(row.createdAt),
    updatedAt: toRfc3339(row.updatedAt),
    creator: byId.get(row.creatorId) ?? { id: row.creatorId },
    assignee: byId.get(row.assigneeId) ?? { id: row.assigneeId },
  }));
}

async function sendTaskNotification(
  notifications: NotificationService,
  task: TaskRow,
  recipientId: string,
  event: 'assigned' | 'updated',
): Promise<void> {
  await notifications.send({
    idempotencyKey: `notification-example:task:${task.id}:${event}:${task.updatedAt}:${recipientId}`,
    source: {
      type: `notification-example.task-${event}`,
      referenceId: task.id,
    },
    messages: {
      inbox: {
        to: recipientId,
        title:
          event === 'assigned'
            ? `New task: ${task.title}`
            : `Task updated: ${task.title}`,
        body: [
          `Task: ${task.title}`,
          `Description: ${task.description}`,
          `Status: ${task.status}`,
        ].join('\n'),
        target: { type: 'route', path: `${TASK_PAGE_PATH}/${task.id}` },
      },
    },
  });
}
