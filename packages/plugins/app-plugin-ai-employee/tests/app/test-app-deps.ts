import { Readable } from 'node:stream';

import {
  createAIManager,
  DriveFileStorageFactory,
  type AIManager,
  type FileStorageFactory,
} from '@nocobase/ai-employee';
import { createAppPaths, type AppPaths } from '@nocobase/app-server/config';
import {
  createAuthentication,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import {
  createAppAuthorization,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization';
import type { Caching } from '@nocobase/caching';
import type { DatabaseManager } from '@nocobase/db';
import { createTestDatabase, type TestDatabase } from '@nocobase/db-testing';
import { createLogging, type Logging } from '@nocobase/logging';
import {
  SnowflakeIdGenerator,
  type IdGeneratorService,
} from '@nocobase/snowflake';
import { afterAll } from 'vitest';

export interface TestAppDeps {
  readonly ai: AIManager;
  readonly paths: AppPaths;
  readonly database: DatabaseManager;
  readonly auth: Auth;
  readonly authorization: AppAuthorization;
  readonly caching: Caching;
  readonly fileStorageFactory: FileStorageFactory;
  readonly aiStorageDisk: string;
  readonly idGenerator: IdGeneratorService;
  readonly logging: Logging;
}

const testDatabases: TestDatabase[] = [];

// Some files build their dependencies once at module level and share them
// across tests, so every database a file created is dropped when the file
// finishes rather than after each test.
afterAll(async () => {
  await Promise.all(
    testDatabases.splice(0).map((testDatabase) => testDatabase.destroy()),
  );
});

/** Dependencies on an empty database of their own, on the dialect the environment selects. */
export async function createTestAppDeps(): Promise<TestAppDeps> {
  const caches = new Map<string, Map<string, unknown>>();
  const objects = new Map<string, Uint8Array>();
  const testDatabase = await createTestDatabase();
  testDatabases.push(testDatabase);
  const { database } = testDatabase;
  return {
    ai: createAIManager(),
    paths: createAppPaths({ rootDir: process.cwd() }),
    database,
    auth: createAuthentication({
      connection: database.connection(),
      secret: 'ai-employee-test-auth-secret-at-least-32-characters',
    }),
    authorization: createAppAuthorization({
      connection: database.connection(),
    }),
    caching: {
      getCache: ({ namespace }) => {
        const store = caches.get(namespace) ?? new Map<string, unknown>();
        caches.set(namespace, store);
        return {
          get: async <T>(key: string) => store.get(key) as T | undefined,
          set: async <T>(key: string, value: T) => {
            store.set(key, value);
          },
          delete: async (key: string) => store.delete(key),
        };
      },
    },
    fileStorageFactory: new DriveFileStorageFactory({
      use: () => ({
        put: async (key, content) => {
          objects.set(key, content);
        },
        getStream: async (key) => Readable.from(objects.get(key) ?? []),
        getUrl: async (key) => `/storage/${key}`,
        delete: async (key) => {
          objects.delete(key);
        },
      }),
    }),
    aiStorageDisk: 'local',
    idGenerator: new SnowflakeIdGenerator({ workerId: 0 }),
    logging: createLogging({ level: 'silent' }),
  };
}
