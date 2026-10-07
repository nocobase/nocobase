// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { aiManagerToken } from '@nocobase/app-plugin-ai-employee/server';
import {
  AI_EMPLOYEE_EXAMPLE_EMPLOYEE,
  AI_EMPLOYEE_EXAMPLE_TICKET_HISTORY_TOOL,
} from '@nocobase/app-plugin-ai-employee-example/server';
import {
  createTestAppConfig,
  type TestAppConfig,
} from '@nocobase/app-testing/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createStandaloneServer,
  type StandaloneServer,
} from '../../server/standalone.ts';

process.env.AUTH_SECRET ??= 'test-auth-secret-at-least-32-characters';

/**
 * The AI employee example plugin registers its employee and tool when the application boots, after the AI Employee
 * plugin has moved its AI manager onto the database, so both are read back from there.
 */
describe('AI employee example in the examples application', () => {
  let server: StandaloneServer;
  let config: TestAppConfig;
  let directory: string;

  beforeAll(async () => {
    directory = mkdtempSync(
      path.join(tmpdir(), 'nocobase-app-template-examples-ai-employee-'),
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
  });

  afterAll(async () => {
    await server?.close();
    await config?.dispose();
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  it('persists the example employee beside the built-in ones', async () => {
    const ai = server.application.container.resolve(aiManagerToken);

    expect(
      await ai.employeeManager.getEmployee(AI_EMPLOYEE_EXAMPLE_EMPLOYEE),
    ).toMatchObject({
      username: AI_EMPLOYEE_EXAMPLE_EMPLOYEE,
      nickname: 'Iris',
    });
    expect(await ai.employeeManager.getEmployee('atlas')).toBeDefined();
  });

  it('registers the ticket history tool for that employee', async () => {
    const ai = server.application.container.resolve(aiManagerToken);

    expect(
      await ai.toolsManager.getTools(AI_EMPLOYEE_EXAMPLE_TICKET_HISTORY_TOOL),
    ).toMatchObject({ scope: 'SPECIFIED', defaultPermission: 'ALLOW' });
  });
});
