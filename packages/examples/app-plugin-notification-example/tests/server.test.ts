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
import { createTestDatabase } from '@nocobase/db-testing';
import { describeMigration } from '@nocobase/db-testing/vitest';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import { notificationServiceToken } from '@nocobase/app-plugin-notification/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';

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
    data: { id: string; assigneeId: string };
  };
  expect(created.data.assigneeId).toBe('u2');
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

  expect(
    (await request(router, 'GET', 'u3', `/tasks/${created.data.id}`)).status,
  ).toBe(404);

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
    total: number;
    page: number;
    pageSize: number;
  };
  expect(firstPageBody).toMatchObject({
    total: 3,
    page: 1,
    pageSize: 2,
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
    total: number;
    page: number;
    pageSize: number;
  };
  expect(secondPageBody).toMatchObject({
    total: 3,
    page: 2,
    pageSize: 2,
  });
  expect(secondPageBody.data).toHaveLength(1);

  await expect(
    request(router, 'GET', 'u3', '/tasks?page=1&pageSize=2').then((response) =>
      response.json(),
    ),
  ).resolves.toMatchObject({ total: 0, page: 1, pageSize: 2, data: [] });
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

  const usersResponse = await request(router, 'GET', 'u1', '/users');
  expect(usersResponse.status).toBe(200);
  expect(
    ((await usersResponse.json()) as { data: Array<{ id: string }> }).data,
  ).toEqual([{ id: 'u1', name: 'Creator', email: 'creator@example.test' }]);

  for (const assigneeId of ['u2', 'u3']) {
    const response = await request(router, 'POST', 'u1', '/tasks', {
      title: 'Should be rejected',
      description: 'The assignee is not active.',
      assigneeId,
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'ASSIGNEE_NOT_FOUND',
    });
  }
});

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
  return router.request(`/api/notification-example${pathName}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-test-user': userId,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
