// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  apiDocsToken,
  findApiDocumentSchemaProblems,
  inspectApiRoutes,
  type ApiDocument,
  type ApiRouteDeclaration,
} from '@nocobase/app-server/router';
import {
  createTestAppConfig,
  type TestAppConfig,
} from '@nocobase/app-testing/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Application } from '@nocobase/app-server/application';
import { ServiceContainer } from '@nocobase/service-provider';

import { analyticsRoutes } from '../../server/routes/analytics.ts';
import { quotationReviewTaskRoutes } from '../../server/routes/quotation-review-tasks.ts';
import { articlesRoutes } from '../../server/routes/articles.ts';
import { externalCrmRoutes } from '../../server/routes/external-crm.ts';
import { numericExamplesRoutes } from '../../server/routes/numeric-examples.ts';
import {
  createStandaloneServer,
  type StandaloneServer,
} from '../../server/standalone.ts';

process.env.AUTH_SECRET ??= 'test-auth-secret-at-least-32-characters';

/**
 * The whole application — every plugin `server/plugins.ts` registers, the example plugins included, and the routes the
 * application owns — started on test databases of its own, so its API document is the one a deployment serves.
 */
describe('API document of the examples application', () => {
  let server: StandaloneServer;
  let config: TestAppConfig;
  let directory: string;
  let routes: ApiRouteDeclaration[];
  let document: ApiDocument;

  beforeAll(async () => {
    directory = mkdtempSync(
      path.join(tmpdir(), 'nocobase-app-template-examples-openapi-'),
    );
    config = await createTestAppConfig({
      connections: ['main', 'analytics'],
      install: true,
      config: {
        auth: { secret: 'test-auth-secret-at-least-32-characters' },
        jobs: {
          default: 'memory',
          memory: {
            adapter: 'memory',
            persistence: { path: path.join(directory, 'jobs') },
          },
        },
        queue: {
          default: 'memory',
          memory: {
            adapter: 'inMemory',
            persistence: { path: path.join(directory, 'queue') },
          },
        },
        database: {
          connections: {
            analytics: { migrations: { autoRun: true } },
          },
        },
        hub: { host: { enabled: false } },
      },
    });
    const sourceRoot = path.resolve(import.meta.dirname, '../..');
    server = await createStandaloneServer({
      viteDevUrl: false,
      env: {
        DB_MIGRATIONS_AUTO_RUN: 'true',
        APP_CONFIG_FILE: config.path,
      },
      paths: {
        rootDir: sourceRoot,
        serverDir: path.join(sourceRoot, 'server'),
        databaseDir: path.join(sourceRoot, 'database'),
        clientDir: path.join(sourceRoot, 'dist/client'),
        storageDir: path.join(sourceRoot, 'storage'),
      },
    });
    routes = inspectApiRoutes(server.application);
    document = await server.application.container
      .resolve(apiDocsToken)
      .getDocument();
  });

  afterAll(async () => {
    await server?.close();
    await config?.dispose();
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  it('declares every /api route, hidden or documented', () => {
    expect(routes.length).toBeGreaterThan(0);
    expect(
      routes
        .filter(({ declared }) => !declared)
        .map(({ method, path }) => `${method} ${path}`),
    ).toEqual([]);
  });

  it('gives every documented operation an operationId no other operation uses', () => {
    const operationIds = Object.entries(document.paths ?? {}).flatMap(
      ([path, item]) =>
        Object.entries(item ?? {}).flatMap(([method, operation]) => {
          const { operationId } = (operation ?? {}) as {
            operationId?: string;
          };
          return typeof operation === 'object' &&
            operation &&
            'responses' in operation
            ? [{ operation: `${method.toUpperCase()} ${path}`, operationId }]
            : [];
        }),
    );
    expect(operationIds.filter(({ operationId }) => !operationId)).toEqual([]);
    const seen = new Map<string, string>();
    const duplicates: string[] = [];
    for (const { operation, operationId } of operationIds) {
      const first = seen.get(operationId!);
      if (first) duplicates.push(`${operationId}: ${first} and ${operation}`);
      else seen.set(operationId!, operation);
    }
    expect(duplicates).toEqual([]);
  });

  it('refers only to schemas the document defines', () => {
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  });

  it("documents the application's own routes under its namespace", () => {
    const own = routes.filter(({ operationId }) =>
      operationId?.startsWith('examples'),
    );
    expect(own.map(({ operationId }) => operationId).sort()).toEqual([
      'examplesCreateArticle',
      'examplesGetGreeting',
      'examplesGetNumericExamples',
      'examplesListArticles',
      'examplesUpdateArticle',
    ]);
    expect(own.every(({ tags }) => tags?.[0] === 'Examples')).toBe(true);
    expect(document.paths?.['/api/example']?.get?.security).toEqual([]);
  });

  it('documents every example plugin under its own tag', () => {
    const tags = new Set(routes.flatMap(({ tags }) => tags ?? []));
    for (const tag of [
      'AuthorizationExample',
      'DepartmentsExample',
      'JobsExample',
      'NotificationExample',
      'QueueExample',
      'RoutesExample',
      'ServiceProviderExample',
      'SkillsExample',
      'TemplatePrintExample',
    ])
      expect(tags).toContain(tag);
  });
});

it('hides the stand-ins that answer 503 while the application runs without a database', async () => {
  const app = { container: new ServiceContainer() } as unknown as Application;
  for (const contribution of [
    articlesRoutes,
    quotationReviewTaskRoutes,
    numericExamplesRoutes,
    analyticsRoutes,
    externalCrmRoutes,
  ]) {
    const declarations = inspectApiRoutes(await contribution.createRouter(app));
    expect(declarations.length).toBeGreaterThan(0);
    expect(
      declarations.filter(({ declared, hidden }) => !declared || !hidden),
    ).toEqual([]);
  }
});
