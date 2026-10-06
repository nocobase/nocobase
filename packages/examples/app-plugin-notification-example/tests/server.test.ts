// @vitest-environment node
import path from 'node:path';

import { afterEach, expect, it, vi } from 'vitest';
import { Hono, type Context, type Next } from 'hono';
import { ServiceContainer } from '@nocobase/service-provider';
import {
  databaseManagerToken,
  type DatabaseManager,
  type MigrationSource,
} from '@nocobase/db';
import {
  createTestDatabase,
  describeMigration,
} from '@nocobase/app-testing/server';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import { notificationServiceToken } from '@nocobase/app-plugin-notification/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';

import plugin from '../server/index.js';
import { apiRoutes } from '../server/routes/index.js';

// The routes read the authentication plugin's users, so its migrations run before this plugin's.
const authenticationMigrations: MigrationSource = {
  directory: path.resolve(
    import.meta.dirname,
    '../../../plugins/app-plugin-authentication/database/migrations',
  ),
  packageName: '@nocobase/app-plugin-authentication',
};
const exampleMigrations: MigrationSource = {
  directory: path.resolve(import.meta.dirname, '../database/migrations'),
  packageName: plugin.packageName,
};

const disposers: Array<() => Promise<void>> = [];

afterEach(async () => {
  for (const dispose of disposers.splice(0).reverse()) await dispose();
});

it('declares its migrations directory', () => {
  expect(plugin.database?.migrations).toBe('./database/migrations');
});

it('declares every route for the API document', async () => {
  const router = await apiRoutes.createRouter({
    container: routeContainer(),
  } as AppPluginApplication);

  expect(findUndeclaredApiRoutes(router)).toEqual([]);
  const document = await generateApiDocument(router, {
    info: { title: 'Notification example', version: '0.0.0' },
  });
  const operations = Object.values(document.paths ?? {}).flatMap((item) =>
    Object.values(item ?? {}),
  ) as { operationId?: string; tags?: string[] }[];
  expect(operations.map(({ operationId }) => operationId).sort()).toEqual([
    'notificationExampleCreateTask',
    'notificationExampleGetTask',
    'notificationExampleListAssignees',
    'notificationExampleListTasks',
    'notificationExampleUpdateTask',
  ]);
  expect(
    operations.every(({ tags }) => tags?.[0] === 'NotificationExample'),
  ).toBe(true);
  expect(document.components?.schemas).toHaveProperty(
    'NotificationExampleTask',
  );
  expect(document.components?.schemas).toHaveProperty(
    'NotificationExampleUser',
  );
});

describeMigration('202609220001_create_notification_example_tasks', {
  sources: [authenticationMigrations, exampleMigrations],
  up: async ({ expectCollection }) => {
    await expectCollection('notificationExampleTasks').toHaveField(
      'assigneeId',
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('notificationExampleTasks').not.toExist();
  },
});

it('sends task summaries to the related people', async () => {
  const database = await createFixture();
  const sent = vi.fn(async () => undefined);
  const router = await createRouter(database, sent);

  const createdResponse = await request(router, 'POST', 'u1', '/tasks', {
    title: 'Review the release notes',
    description: 'Check the examples before the release.',
    assigneeId: 'u2',
  });
  expect(createdResponse.status).toBe(201);
  const created = (await createdResponse.json()) as {
    data: {
      id: string;
      assigneeId: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  expect(created.data.assigneeId).toBe('u2');
  // Times are RFC 3339 UTC timestamps, zone designator included.
  for (const time of [created.data.createdAt, created.data.updatedAt])
    expect(time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u);
  expect(sent).toHaveBeenCalledWith(
    expect.objectContaining({
      messages: {
        inbox: expect.objectContaining({
          to: 'u2',
          body: expect.stringContaining('Review the release notes'),
          target: {
            type: 'route',
            path: `/notification-example/tasks/${created.data.id}`,
          },
        }),
      },
    }),
  );

  const updatedResponse = await request(
    router,
    'PATCH',
    'u2',
    `/tasks/${created.data.id}`,
    {
      title: 'Review and publish the release notes',
      description: 'The notes are ready for publication.',
      status: 'in-progress',
      assigneeId: 'u2',
    },
  );
  expect(updatedResponse.status).toBe(200);
  expect(sent).toHaveBeenLastCalledWith(
    expect.objectContaining({
      messages: {
        inbox: expect.objectContaining({
          to: 'u1',
          body: expect.stringContaining('Review and publish the release notes'),
        }),
      },
    }),
  );

  // Permission before existence: a foreign task and a missing one answer alike.
  for (const taskPath of [`/tasks/${created.data.id}`, '/tasks/missing']) {
    const denied = await request(router, 'GET', 'u3', taskPath);
    expect(denied.status).toBe(403);
    await expect(denied.json()).resolves.toMatchObject({
      error: { reason: 'TASK_ACCESS_DENIED', domain: 'notificationExample' },
    });
  }
  // A malformed id is answered before the query: PostgreSQL, Kingbase and MSSQL would reject it as a `uuid` and answer 500.
  for (const taskPath of [`/tasks/${created.data.id}`, '/tasks/missing']) {
    const deniedUpdate = await request(router, 'PATCH', 'u3', taskPath, {
      status: 'done',
    });
    expect(deniedUpdate.status).toBe(403);
    await expect(deniedUpdate.json()).resolves.toMatchObject({
      error: { reason: 'TASK_ACCESS_DENIED' },
    });
  }

  // An uppercase id names the same task on every dialect, not only where `uuid` is compared natively.
  const uppercase = await request(
    router,
    'GET',
    'u1',
    `/tasks/${created.data.id.toUpperCase()}`,
  );
  expect(uppercase.status).toBe(200);
  await expect(uppercase.json()).resolves.toMatchObject({
    data: { id: created.data.id },
  });

  const forbiddenReassignment = await request(
    router,
    'PATCH',
    'u2',
    `/tasks/${created.data.id}`,
    { assigneeId: 'u3' },
  );
  expect(forbiddenReassignment.status).toBe(403);
  await expect(forbiddenReassignment.json()).resolves.toMatchObject({
    error: { reason: 'TASK_ASSIGNMENT_FORBIDDEN' },
  });

  const unknownField = await request(
    router,
    'PATCH',
    'u1',
    `/tasks/${created.data.id}`,
    { priority: 'high' },
  );
  expect(unknownField.status).toBe(400);
  await expect(unknownField.json()).resolves.toMatchObject({
    error: {
      reason: 'INVALID_INPUT',
      fieldViolations: [expect.objectContaining({ field: '' })],
    },
  });

  const reassignedResponse = await request(
    router,
    'PATCH',
    'u1',
    `/tasks/${created.data.id}`,
    {
      assigneeId: 'u3',
    },
  );
  expect(reassignedResponse.status).toBe(200);
  const reassignmentRecipients = sent.mock.calls.slice(-2).map((call) => {
    const input = call[0] as {
      messages: { inbox: { to: string } };
    };
    return input.messages.inbox.to;
  });
  expect(reassignmentRecipients).toEqual(expect.arrayContaining(['u2', 'u3']));
});

it('paginates tasks visible to the current user', async () => {
  const database = await createFixture();
  const router = await createRouter(
    database,
    vi.fn(async () => undefined),
  );

  for (const title of ['First task', 'Second task', 'Third task']) {
    const response = await request(router, 'POST', 'u1', '/tasks', {
      title,
      description: `${title} description`,
      assigneeId: 'u2',
    });
    expect(response.status).toBe(201);
  }

  const firstPage = await request(
    router,
    'GET',
    'u1',
    '/tasks?page=1&pageSize=2',
  );
  const firstPageBody = (await firstPage.json()) as {
    data: unknown[];
    meta: { page: number; pageSize: number; total: number };
  };
  expect(firstPageBody).toMatchObject({
    meta: { total: 3, page: 1, pageSize: 2 },
    data: expect.arrayContaining([
      expect.objectContaining({ title: expect.any(String) }),
    ]),
  });
  expect(firstPageBody.data).toHaveLength(2);

  const secondPage = await request(
    router,
    'GET',
    'u1',
    '/tasks?page=2&pageSize=2',
  );
  const secondPageBody = (await secondPage.json()) as {
    data: unknown[];
    meta: { page: number; pageSize: number; total: number };
  };
  expect(secondPageBody).toMatchObject({
    meta: { total: 3, page: 2, pageSize: 2 },
  });
  expect(secondPageBody.data).toHaveLength(1);

  await expect(
    request(router, 'GET', 'u3', '/tasks?page=1&pageSize=2').then((response) =>
      response.json(),
    ),
  ).resolves.toMatchObject({
    meta: { total: 0, page: 1, pageSize: 2 },
    data: [],
  });

  const defaults = await request(router, 'GET', 'u1', '/tasks');
  await expect(defaults.json()).resolves.toMatchObject({
    meta: { page: 1, pageSize: 20, total: 3 },
  });
  const oversized = await request(router, 'GET', 'u1', '/tasks?pageSize=101');
  expect(oversized.status).toBe(400);
  await expect(oversized.json()).resolves.toMatchObject({
    error: {
      reason: 'INVALID_INPUT',
      fieldViolations: [expect.objectContaining({ field: 'pageSize' })],
    },
  });
});

it('rejects anonymous requests to every task route', async () => {
  const database = await createFixture();
  const router = await createRouter(
    database,
    vi.fn(async () => undefined),
  );
  for (const [method, taskPath] of [
    ['GET', '/assignees'],
    ['GET', '/tasks'],
    ['POST', '/tasks'],
    ['GET', '/tasks/task-1'],
    ['PATCH', '/tasks/task-1'],
  ] as const) {
    const response = await router.request(
      `/api/notificationExample${taskPath}`,
      {
        method,
        headers: { 'Content-Type': 'application/json', 'x-anonymous': '1' },
        ...(method === 'GET' ? {} : { body: '{}' }),
      },
    );
    expect(response.status).toBe(401);
  }
});

it('does not expose or accept disabled and deleted users as assignees', async () => {
  const database = await createFixture();
  const users = database.repository('user');
  await users.updateOne({
    filter: { id: 'u2' },
    values: { disabledAt: new Date() },
  });
  await users.updateOne({
    filter: { id: 'u3' },
    values: { deletedAt: new Date() },
  });
  const router = await createRouter(
    database,
    vi.fn(async () => undefined),
  );

  const usersResponse = await request(router, 'GET', 'u1', '/assignees');
  expect(usersResponse.status).toBe(200);
  expect(await usersResponse.json()).toEqual({
    data: [{ id: 'u1', name: 'Creator', email: 'creator@example.test' }],
    meta: { total: 1 },
  });

  for (const assigneeId of ['u2', 'u3']) {
    const response = await request(router, 'POST', 'u1', '/tasks', {
      title: 'Should be rejected',
      description: 'The assignee is not active.',
      assigneeId,
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        status: 'INVALID_ARGUMENT',
        reason: 'ASSIGNEE_NOT_FOUND',
        domain: 'notificationExample',
        fieldViolations: [expect.objectContaining({ field: 'assigneeId' })],
      },
    });
  }
});

/** A container whose services the routes only resolve while they are declared, for inspecting them. */
function routeContainer(): ServiceContainer {
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, {} as DatabaseManager);
  container.instance(notificationServiceToken, {} as never);
  container.instance(authenticationToken, {
    required: () => async (_context: Context, next: Next) => next(),
  } as never);
  return container;
}

async function createFixture(): Promise<DatabaseManager> {
  const testDatabase = await createTestDatabase();
  disposers.push(() => testDatabase.destroy());
  const { database } = testDatabase;
  await database
    .createMigrator({ sources: [authenticationMigrations] })
    .latest();
  await database.repository('user').createMany({
    values: [
      {
        id: 'u1',
        name: 'Creator',
        email: 'creator@example.test',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'u2',
        name: 'Assignee',
        email: 'assignee@example.test',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'u3',
        name: 'Other',
        email: 'other@example.test',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });
  await database.createMigrator({ sources: [exampleMigrations] }).latest();
  return database;
}

async function createRouter(
  database: DatabaseManager,
  send: (input: unknown) => Promise<unknown>,
): Promise<Hono> {
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, database);
  container.instance(notificationServiceToken, { send });
  container.instance(authenticationToken, {
    required: () => async (context: Context<AuthEnv>, next: Next) => {
      if (context.req.header('x-anonymous'))
        return context.json(
          {
            error: {
              status: 'UNAUTHENTICATED',
              reason: 'AUTHENTICATION_REQUIRED',
            },
          },
          401,
        );
      const id = context.req.header('x-test-user') ?? 'u1';
      context.set('auth', { user: { id } } as never);
      await next();
    },
  } as never);
  const app = { container } as AppPluginApplication;
  const router = new Hono();
  router.route('/api', await apiRoutes.createRouter(app));
  return router;
}

function request(
  router: Hono,
  method: 'GET' | 'POST' | 'PATCH',
  userId: string,
  pathName: string,
  body?: unknown,
): Promise<Response> {
  return router.request(`/api/notificationExample${pathName}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-test-user': userId,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
