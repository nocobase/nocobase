import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';

import type {
  FoundationCapability,
  FoundationCapabilityKey,
  FoundationOverview,
} from '../../shared/foundation.js';
import {
  DefaultFoundationService,
  type FoundationServiceOptions,
} from '../../server/services/foundation.js';

const require = createRequire(import.meta.url);

/** The package root this test runs in, which stands in for an application's root. */
export const PACKAGE_ROOT: string = fileURLToPath(
  new URL('../..', import.meta.url),
);

export const APPLICATION_NAME = '@nocobase/app-plugin-foundation';

/** The NocoBase plugins whose real migrations the tests install, by package name. */
export type PluginPackage =
  | '@nocobase/app-plugin-authentication'
  | '@nocobase/app-plugin-authorization'
  | '@nocobase/app-plugin-api-keys'
  | '@nocobase/app-plugin-notification'
  | '@nocobase/app-plugin-notification-in-app'
  | '@nocobase/app-plugin-scheduler'
  | '@nocobase/app-plugin-mail';

function pluginMigrations(packageName: PluginPackage): {
  readonly packageName: string;
  readonly directory: string;
} {
  return {
    packageName,
    directory: path.join(
      path.dirname(require.resolve(`${packageName}/package.json`)),
      'database/migrations',
    ),
  };
}

/**
 * An application being built: a test database to which the tests add what an application would — a plugin's
 * migrations, the application's own Collections, records — between two looks at the overview.
 */
export class ApplicationUnderConstruction {
  public readonly container: ServiceContainer = new ServiceContainer();
  private readonly config = new Map<string, unknown>();

  private constructor(public readonly testDatabase: TestDatabase) {
    this.container.instance(databaseManagerToken, testDatabase.database);
  }

  public static async create(): Promise<ApplicationUnderConstruction> {
    return new ApplicationUnderConstruction(await createTestDatabase());
  }

  public get database(): TestDatabase['database'] {
    return this.testDatabase.database;
  }

  public async install(...packages: readonly PluginPackage[]): Promise<void> {
    await this.testDatabase.migrate(packages.map(pluginMigrations));
  }

  /** Runs the application's own migrations, recorded under its package name. */
  public async migrateApplication(): Promise<void> {
    await this.testDatabase.migrate([
      {
        packageName: APPLICATION_NAME,
        directory: fileURLToPath(
          new URL('../fixtures/application/migrations', import.meta.url),
        ),
      },
    ]);
  }

  public configure(key: string, value: unknown): void {
    this.config.set(key, value);
  }

  public service(
    options: Partial<FoundationServiceOptions> = {},
  ): DefaultFoundationService {
    return new DefaultFoundationService({
      container: this.container,
      config: {
        get: <T>(key: string) => this.config.get(key) as T | undefined,
      },
      rootDir: PACKAGE_ROOT,
      hasClient: true,
      // Every look collects anew, so a test sees what it just built.
      cacheTtlMs: 0,
      ...options,
    });
  }

  public async destroy(): Promise<void> {
    await this.testDatabase.destroy();
  }
}

export function capability(
  overview: FoundationOverview,
  key: FoundationCapabilityKey,
): FoundationCapability {
  const found = overview.capabilities.find((entry) => entry.key === key);
  if (!found) throw new Error(`The overview has no capability "${key}".`);
  return found;
}

export function metricValue(
  overview: FoundationOverview,
  key: FoundationCapabilityKey,
  metricKey: string,
): number | null | undefined {
  return capability(overview, key).metrics.find(
    (entry) => entry.key === metricKey,
  )?.value;
}
