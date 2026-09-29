import { authenticationToken, Auth } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  createAppAuthorization,
} from '@nocobase/app-plugin-authorization';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { createI18nMiddleware } from '@nocobase/i18n/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WorkflowRunRepository } from '../server/repositories/workflow-run-repository.js';
import { WorkflowAuthorizationProvider } from '../server/authorization.js';
import type { WorkflowProviderConfig } from '../server/provider.js';
import type { WorkflowService } from '../server/service.js';
import { createNodeRunRoutes } from '../server/routes/node-runs.js';
import { apiRoutes } from '../server/routes/index.js';
import { createWorkflowRunRoutes } from '../server/routes/workflow-runs.js';
import { createWorkflowDefinitionRoutes } from '../server/routes/workflows.js';
import serverLocales from '../server/locales/index.js';
import { internalWorkflowServiceToken } from '../server/tokens.js';
import { createTestDatabase } from './helpers.js';
import { createWorkflowI18nRuntime } from './i18n.js';

const i18n = await createWorkflowI18nRuntime(serverLocales);
const databases: DatabaseManager[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(databases.splice(0).map((database) => database.destroy()));
});

describe('@nocobase/app-plugin-workflow routes', () => {
  it('registers the protected workflow API routes', async () => {
    const workflow = createWorkflowRepositories();
    const app = createTestApp(workflow);

    const response = await app.request('/api/workflows');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0 },
    });
  });

  it('resolves source previews and revision lists by key', async () => {
    const repositories = createWorkflowRepositories();
    const app = createTestApp(repositories);
    await app.request('/api/workflows/by-key/example/source');
    await app.request('/api/workflows/by-key/example/source/revisions');
    expect(repositories.workflows.getSource).toHaveBeenCalledWith('example');
    expect(repositories.workflows.sourceRevisions).toHaveBeenCalledWith(
      'example',
    );
    expect(repositories.workflows.get).not.toHaveBeenCalled();
  });

  it('passes workflow filters and pagination to the service', async () => {
    const workflow = createWorkflowRepositories();
    const app = createTestApp(workflow);

    await app.request(
      '/api/workflows?q=approval&enabled=false&page=2&pageSize=10',
    );

    expect(workflow.workflows.list).toHaveBeenCalledWith({
      query: 'approval',
      enabled: false,
      page: 2,
      pageSize: 10,
    });
  });

  it('passes execution filters and pagination to the service', async () => {
    const workflow = createWorkflowRepositories();
    const app = createTestApp(workflow);

    await app.request(
      '/api/workflow-runs?workflowKey=leave&workflowTitle=Leave&status=-1&page=3&pageSize=5',
    );

    expect(workflow.workflowRuns.list).toHaveBeenCalledWith({
      workflowKey: 'leave',
      workflowTitle: 'Leave',
      status: -1,
      page: 3,
      pageSize: 5,
    });
  });

  it('passes the manual run event key through service options', async () => {
    const workflow = createWorkflowRepositories();
    vi.mocked(workflow.workflowRuns.run).mockResolvedValue({
      id: 'run-1',
      workflowId: 'definition-1',
      workflowKey: 'approval',
      workflowTitle: 'Approval',
      workflowVersion: 'version-1',
      eventKey: 'operator-request-42',
      status: null,
      startedAt: null,
      finishedAt: null,
      createdAt: '2026-08-26T00:00:00.000Z',
    });
    const app = createTestApp(workflow);

    const response = await app.request('/api/workflows/definition-1/run', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'event-key': 'operator-request-42',
      },
      body: JSON.stringify({ input: { amount: 100 } }),
    });

    expect(response.status).toBe(200);
    expect(workflow.workflowRuns.run).toHaveBeenCalledWith(
      'definition-1',
      { amount: 100 },
      { eventKey: 'operator-request-42' },
    );
  });

  it('enables a workflow by synchronized id or unsynchronized artifact hash', async () => {
    const workflow = createWorkflowRepositories();
    vi.mocked(workflow.workflows.enable).mockResolvedValue({
      id: 'definition-1',
      key: 'approval',
      title: 'Approval',
      enabled: true,
      current: true,
      hasParameters: false,
      executed: 0,
      version: 'version-1',
      hash: 'artifact-hash',
      activeRunCount: 0,
      latestRun: null,
      pendingArtifact: null,
    });
    const app = createTestApp(workflow);

    const hash = 'a'.repeat(64);
    const hashResponse = await app.request(`/api/workflows/${hash}/enable`, {
      method: 'POST',
    });
    const idResponse = await app.request('/api/workflows/42/enable', {
      method: 'POST',
    });

    expect(hashResponse.status).toBe(200);
    expect(idResponse.status).toBe(200);
    expect(workflow.workflows.enable).toHaveBeenNthCalledWith(1, hash);
    expect(workflow.workflows.enable).toHaveBeenNthCalledWith(2, '42');
  });

  it('rejects invalid workflow identifiers before database dispatch', async () => {
    const database = await createTestDatabase();
    const application = await createWorkflowApplication();
    const ensureArtifactMaterialized = vi.fn(async () => undefined);
    application.container.instance(databaseManagerToken, database);
    application.container.instance(internalWorkflowServiceToken, {
      discoverArtifacts: async () => [],
      ensureArtifactMaterialized,
    } as unknown as WorkflowService);
    const router = await apiRoutes.createRouter(application);
    const app = new Hono();
    app.use('*', createI18nMiddleware(i18n));
    app.route('/api', router);

    try {
      const response = await app.request(
        '/api/workflows/not-an-id-or-hash/enable',
        { method: 'POST' },
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        message: 'The workflow request is invalid.',
      });
      expect(ensureArtifactMaterialized).not.toHaveBeenCalled();
    } finally {
      await database.destroy();
    }
  });

  it('does not apply its authentication boundary to later Route contributions', async () => {
    const application = new Hono();
    const pluginRouter = await apiRoutes.createRouter(
      await createWorkflowApplication(null),
    );
    application.route('/api', pluginRouter);
    application.get('/api/later-plugin', (context) => context.text('later'));

    expect((await application.request('/api/workflows')).status).toBe(401);
    expect((await application.request('/api/workflow-runs/run-1')).status).toBe(
      401,
    );
    await expect(
      (await application.request('/api/later-plugin')).text(),
    ).resolves.toBe('later');
  });

  it('returns unavailable only after authentication succeeds', async () => {
    const router = await apiRoutes.createRouter(
      await createWorkflowApplication(),
    );

    const app = new Hono();
    app.use('*', createI18nMiddleware(i18n));
    app.route('/', router);
    const response = await app.request('/workflows');

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      message: 'Workflow service is not configured.',
    });
  });

  it.each([null, 'member', 'reader', 'manager', 'root'])(
    'enforces management permission on every HTTP endpoint for %s',
    async (userId) => {
      const application = await createWorkflowApplication(userId);
      const app = new Hono();
      app.use('*', createI18nMiddleware(i18n));
      app.route('/api', await apiRoutes.createRouter(application));
      app.get('/api/later-plugin', (context) => context.text('later'));
      const endpoints = [
        ['GET', '/workflows'],
        ['GET', '/workflows/1'],
        ['GET', '/workflows/by-key/example/source'],
        ['GET', '/workflows/by-key/example/source/revisions'],
        ['GET', '/workflows/1/revisions'],
        ['GET', '/workflows/1/parameters'],
        ['PUT', '/workflows/1/parameters'],
        ['PATCH', '/workflows/1/status'],
        ['POST', '/workflows/1/enable'],
        ['POST', '/workflows/1/disable'],
        ['POST', '/workflows/1/run'],
        ['GET', '/workflows/1/runs'],
        ['GET', '/workflow-runs'],
        ['GET', '/workflow-runs/1'],
        ['GET', '/workflow-runs/1/node-runs'],
        ['GET', '/workflow-runs/1/node-runs/2/payload'],
      ];
      const status =
        userId === null
          ? 401
          : userId === 'root' || userId === 'manager'
            ? 503
            : 403;
      for (const [method, path] of endpoints) {
        const response = await app.request(`/api${path}`, { method });
        expect(response.status, `${method} ${path}`).toBe(status);
        if (status === 403)
          await expect(response.json()).resolves.toEqual({
            code: 'FORBIDDEN',
            message: 'Workflow management permission is required.',
          });
      }
      expect((await app.request('/api/later-plugin')).status).toBe(200);
    },
  );

  it.each(['member', 'reader', 'manager', 'root'])(
    'dispatches manual execution only for an authorized %s',
    async (userId) => {
      const application = await createWorkflowApplication(userId);
      const database = databases.at(-1)!;
      application.container.instance(databaseManagerToken, database);
      application.container.instance(
        internalWorkflowServiceToken,
        {} as WorkflowService,
      );
      const run = vi
        .spyOn(WorkflowRunRepository.prototype, 'run')
        .mockResolvedValue({
          id: 'run-1',
          workflowId: '1',
          workflowKey: 'approval',
          workflowTitle: 'Approval',
          workflowVersion: 'version-1',
          eventKey: 'manual-request',
          status: null,
          startedAt: null,
          finishedAt: null,
          createdAt: '2026-08-26T00:00:00.000Z',
        });
      const app = new Hono();
      app.use('*', createI18nMiddleware(i18n));
      app.route('/api', await apiRoutes.createRouter(application));
      const response = await app.request('/api/workflows/1/run', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'event-key': 'manual-request',
        },
        body: JSON.stringify({ input: { amount: 100 } }),
      });
      if (userId === 'manager' || userId === 'root') {
        expect(response.status).toBe(200);
        expect(run).toHaveBeenCalledExactlyOnceWith(
          '1',
          { amount: 100 },
          { eventKey: 'manual-request' },
        );
        await expect(response.json()).resolves.toMatchObject({
          data: { id: 'run-1' },
        });
      } else {
        expect(response.status).toBe(403);
        expect(run).not.toHaveBeenCalled();
      }
    },
  );

  it('denies manual execution before dispatch and observes permission revocation', async () => {
    const application = await createWorkflowApplication('manager');
    const database = databases.at(-1)!;
    const ensureArtifactMaterialized = vi.fn(async () => undefined);
    application.container.instance(databaseManagerToken, database);
    application.container.instance(internalWorkflowServiceToken, {
      discoverArtifacts: async () => [],
      ensureArtifactMaterialized,
    } as unknown as WorkflowService);
    const app = new Hono();
    app.use('*', createI18nMiddleware(i18n));
    app.route('/api', await apiRoutes.createRouter(application));
    expect((await app.request('/api/workflows')).status).toBe(200);
    await application.container
      .resolve(authorizationToken)
      .permissionSets.update('manager', { key: 'manager', grants: [] });
    const response = await app.request('/api/workflows/1/run', {
      method: 'POST',
      headers: { 'accept-language': 'zh-CN' },
      body: '{}',
    });
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      code: 'FORBIDDEN',
      message: '需要工作流管理权限。',
    });
    expect(ensureArtifactMaterialized).not.toHaveBeenCalled();
    expect((await app.request('/api/workflows')).status).toBe(403);
  });

  it('returns validation errors using the standard error contract', async () => {
    const app = new Hono();
    const workflow = createWorkflowRepositories();
    registerTestRoutes(app, workflow);

    const response = await app.request('/api/workflows/definition-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: 'yes' }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'enabled must be a boolean',
    });
  });

  it('translates validation errors from the request locale', async () => {
    const app = new Hono();
    const workflow = createWorkflowRepositories();
    registerTestRoutes(app, workflow);

    const response = await app.request('/api/workflows/definition-1/status', {
      method: 'PATCH',
      headers: {
        'accept-language': 'zh-CN',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ enabled: 'yes' }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'enabled 必须为布尔值',
    });
  });
});

interface TestRepositories {
  workflows: Parameters<typeof createWorkflowDefinitionRoutes>[0];
  workflowRuns: Parameters<typeof createWorkflowRunRoutes>[0] &
    Parameters<typeof createNodeRunRoutes>[0];
}

function createTestApp(repositories: TestRepositories): Hono {
  const app = new Hono();
  registerTestRoutes(app, repositories);
  return app;
}

function registerTestRoutes(app: Hono, repositories: TestRepositories): void {
  app.use('*', createI18nMiddleware(i18n));
  app.route('/api', createWorkflowDefinitionRoutes(repositories.workflows));
  app.route('/api', createWorkflowRunRoutes(repositories.workflowRuns));
  app.route('/api', createNodeRunRoutes(repositories.workflowRuns));
}

async function createWorkflowApplication(
  userId: string | null = 'manager',
): Promise<AppPluginApplication<WorkflowProviderConfig>> {
  const database = await createTestDatabase();
  databases.push(database);
  await database
    .builder()
    .createCollection('authorizationPermissionSets', (table) => {
      table.string('id').primary();
      table.string('key');
      table.string('title').nullable();
      table.json('grants');
      table.datetime('createdAt');
      table.datetime('updatedAt');
    });
  await database
    .builder()
    .createCollection('authorizationPermissionSetAssignments', (table) => {
      table.string('id').primary();
      table.string('subjectType');
      table.string('subjectId');
      table.string('permissionSetKey');
      table.datetime('createdAt');
      table.datetime('updatedAt');
    });
  const authorization = createAppAuthorization({
    connection: database.connection(),
  });
  for (const key of ['root', 'manager', 'reader', 'member']) {
    await authorization.permissionSets.create({
      key,
      grants:
        key === 'manager' || key === 'reader'
          ? [
              {
                resource: { type: 'settings', id: 'workflow' },
                actions: [{ action: key === 'manager' ? 'manage' : 'read' }],
              },
            ]
          : [],
    });
    await database
      .connection()
      .query.insertInto('authorizationPermissionSetAssignments')
      .values({
        id: key,
        subjectType: 'user',
        subjectId: key,
        permissionSetKey: key,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
  }
  const authentication = new Auth({
    connection: database.connection(),
    baseURL: 'http://example.test',
    secret: 'workflow-route-test-secret-at-least-32-characters',
  });
  vi.spyOn(authentication, 'getSession').mockResolvedValue(
    userId
      ? {
          user: {
            id: userId,
            name: userId,
            email: `${userId}@example.test`,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          session: {
            id: 'session',
            userId,
            token: 'test-token',
            expiresAt: new Date(Date.now() + 60_000),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }
      : null,
  );
  const container = new ServiceContainer();
  container.instance(authenticationToken, authentication);
  container.instance(authorizationToken, authorization);
  await new WorkflowAuthorizationProvider({
    container,
  } as AppPluginApplication).boot();
  return {
    appName: 'main',
    publicBasePath: '',
    config: {
      app: { publicBasePath: '' },
      drive: {
        default: 'private',
        disks: {
          private: {
            driver: 'fs',
            location: '/missing',
            visibility: 'private',
          },
        },
      },
      workflow: {
        sourceRoot: '/missing/source',
        distRoot: '/missing/dist',
        artifactDisk: 'private',
        production: false,
      },
    },
    paths: {} as never,
    router: new Hono(),
    container,
  };
}

function createWorkflowRepositories(): TestRepositories {
  return {
    workflows: {
      list: vi
        .fn()
        .mockResolvedValue({ data: [], page: 1, pageSize: 20, total: 0 }),
      enable: vi.fn(),
      disable: vi.fn(),
      setStatus: vi.fn(),
      getSource: vi.fn(),
      sourceRevisions: vi.fn(),
      getParameters: vi.fn(),
      updateParameters: vi.fn(),
      get: vi.fn(),
      revisions: vi.fn(),
    },
    workflowRuns: {
      list: vi
        .fn()
        .mockResolvedValue({ data: [], page: 1, pageSize: 20, total: 0 }),
      listForWorkflow: vi.fn(),
      get: vi.fn(),
      nodeRuns: vi.fn(),
      nodeRunPayload: vi.fn(),
      run: vi.fn(),
    },
  };
}
