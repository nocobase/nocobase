import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { i18nToken } from '@nocobase/app-server/i18n';
import { defineStandaloneServer } from '@nocobase/app-server/node';
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  defineRepositoryApiRoutes,
} from '@nocobase/app-server/router';
import {
  resolveAppRuntime,
  startApplicationInScope,
} from '@nocobase/app-server/runtime';
import { createTestApp } from '@nocobase/app-testing/server';
import type { AuditEvent } from '@nocobase/audit';
import { databaseManagerToken } from '@nocobase/db';
import { expect, it } from 'vitest';

import { createApp } from '../../server/app.js';
import appRuntime from '../../server/runtime.js';

// Exercise the template composition and generated routes with a single test collection.
const runtimeDefinition = {
  ...appRuntime,
  plugins: defineServerPlugins([]),
  serviceProviders: [],
  routes: [],
};

it('records Repository mutations with only a file destination configured', async () => {
  const app = await createTestApp({
    createServer: defineStandaloneServer({
      rootDir: path.resolve(import.meta.dirname, '../..'),
      appRuntime: runtimeDefinition,
      async createServer(scope) {
        const runtime = await resolveAppRuntime(runtimeDefinition, scope);
        const app = createApp(runtime);
        const repository = defineRepositoryApiRoutes({
          principal: (context) => context.req.header('x-test-principal'),
          repositories: [
            {
              name: 'auditOrders',
              policy: () => ({
                read: true,
                create: true,
                update: false,
                delete: false,
              }),
              actions: { createOne: {}, count: {} },
            },
          ],
        });
        app.addRoutes(
          defineApiRoutes(async (app) => {
            const connection = app.container
              .resolve(databaseManagerToken)
              .connection();
            await connection.builder.createCollection(
              'auditOrders',
              (collection) => {
                collection.string('id').primary();
              },
            );
            return repository.createRouter(app);
          }),
        );
        return startApplicationInScope(scope, app);
      },
    }).create,
    install: false,
    config: {
      app: { publicOrigin: 'http://localhost' },
      audit: {
        transports: {
          capture: { driver: 'file', options: { path: 'audit.jsonl' } },
        },
      },
    },
  });
  try {
    const post = (
      action: string,
      body: unknown,
      locale: string,
      principal?: string,
    ) =>
      app.request(`/auditOrders/${action}`, {
        method: 'POST',
        headers: {
          'accept-language': locale,
          'content-type': 'application/json',
          ...(principal ? { 'x-test-principal': principal } : {}),
        },
        body: JSON.stringify(body),
      });
    const input = { values: { id: 'order-1' } };
    expect((await post('createOne', input, 'zh-CN')).status).toBe(403);
    const created = await post('createOne', input, 'en-US', 'operator');
    if (!created.ok) throw new Error(await created.text());
    expect((await post('count', {}, 'en-US', 'operator')).ok).toBe(true);

    const lines = await readFile(
      app.application.paths.storage('audit.jsonl'),
      'utf8',
    );
    const repositoryEvents = lines
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as AuditEvent)
      .filter(({ resource }) => resource === 'auditOrders');
    expect(repositoryEvents).toMatchObject([
      {
        action: 'auditOrders:createOne',
        operationName: 'Create a record',
        operationNameI18n: {
          ns: '@nocobase/audit',
          key: 'audit.operations.createOne',
        },
        outcome: 'denied',
        targets: [{ collection: 'auditOrders' }],
      },
      {
        action: 'auditOrders:createOne',
        operationName: 'Create a record',
        operationNameI18n: {
          ns: '@nocobase/audit',
          key: 'audit.operations.createOne',
        },
        outcome: 'success',
        targets: [{ collection: 'auditOrders', key: { id: 'order-1' } }],
      },
    ]);

    const i18n = app.application.container.resolve(i18nToken);
    await i18n.ensureLocaleLoaded('zh-CN');
    expect(
      i18n.getFixedT('@nocobase/audit', 'zh-CN')('audit.operations.createOne'),
    ).toBe('创建记录');
  } finally {
    await app.close();
  }
});
