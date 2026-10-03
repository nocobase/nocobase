import type { Application } from '@nocobase/app-server/application';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import {
  expectCollection,
  type CollectionExpectation,
} from '@nocobase/db-testing/vitest';
import { test, type TestAPI } from 'vitest';

import {
  createTestApp,
  type CreateTestAppOptions,
  type TestApp,
} from './app.js';

/**
 * How long one application lives. `file` (the default) starts it once for the test file, because starting an
 * application installs every migration and seed of it and its plugins; tests in the file share its database. `test`
 * starts a fresh one, on fresh databases, for every test.
 */
export type AppTestScope = 'file' | 'test';

export interface AppTestOptions extends CreateTestAppOptions {
  readonly scope?: AppTestScope;
}

export interface AppTestContext {
  readonly testApp: TestApp;
  readonly app: Application;
  readonly fetch: TestApp['fetch'];
  readonly request: TestApp['request'];
  readonly database: DatabaseManager;
  readonly connection: DatabaseConnection;
  readonly expectCollection: (name: string) => CollectionExpectation;
}

export type AppTestAPI = TestAPI<AppTestContext>;

/**
 * A Vitest `test` whose context carries an application started by `createTestApp()`, on the dialect the environment
 * selects, and closes it when its scope ends.
 */
export function createAppTest(options: AppTestOptions): AppTestAPI {
  const { scope = 'file', ...appOptions } = options;
  return test.extend<AppTestContext>({
    testApp: [
      // Vitest reads a fixture's dependencies from this destructuring pattern; this one has none.
      // eslint-disable-next-line no-empty-pattern
      async ({}, use) => {
        const testApp = await createTestApp(appOptions);
        try {
          await use(testApp);
        } finally {
          await testApp.close();
        }
      },
      { scope },
    ],
    app: async ({ testApp }, use) => use(testApp.application),
    fetch: async ({ testApp }, use) => use(testApp.fetch),
    request: async ({ testApp }, use) => use(testApp.request),
    database: async ({ testApp }, use) => use(testApp.database),
    connection: async ({ testApp }, use) => use(testApp.connection),
    expectCollection: async ({ testApp }, use) =>
      use((name: string) => expectCollection(testApp.connection, name)),
  });
}
