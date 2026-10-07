import {
  ServiceProvider,
  type ServiceContainer,
} from '@nocobase/service-provider';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { refreshAppCollectionsArtifact } from './collections-artifact.js';
import { createAppDatabaseManager } from './manager.js';
import {
  executeAppDatabasePlan,
  type AppDatabaseTasksResult,
} from './tasks.js';
import {
  defaultConnectionName,
  planAppDatabaseTasks,
  type AppDatabaseTask,
} from './plan.js';
import { prepareAppDatabaseStorage } from './storage.js';
import { createAppSeeder } from './seeder.js';
import { createTaskServiceResolver } from './task-container.js';
import { snapshotDatabaseTaskConfig } from './task-config.js';
import { createSampleDataService } from '../sample-data/registry.js';
import { sampleDataToken } from '../sample-data/token.js';
import { loggingToken } from '../logging/token.js';
import type { Logger } from '@nocobase/logging';
import type { AppConfigAccessor, AppPaths } from '../config/index.js';
import type {
  AppDatabaseConfig,
  AppDatabaseTaskContributions,
} from './types.js';

export interface DatabaseProviderApplication {
  readonly config: AppConfigAccessor;
  readonly container: ServiceContainer;
  readonly paths: AppPaths;
  readonly databaseTaskContributions: AppDatabaseTaskContributions;
}

/**
 * Set by `nocobase dev` on the server process it starts, to that
 * application's root. Naming the root rather than switching the behavior on
 * matters for a Hub: applications it hosts in the same process see the same
 * environment, and their directories are deployed revisions a cache must not
 * be written into.
 */
export const COLLECTIONS_REFRESH_ENV = 'NOCOBASE_COLLECTIONS_REFRESH';

export class DatabaseProvider extends ServiceProvider<DatabaseProviderApplication> {
  public readonly name: string = '@nocobase/app-server/database';

  public override register(): void {
    // Registered even without a database, so a plugin can always register its samples; they then never run.
    if (!this.app.container.has(sampleDataToken)) {
      this.app.container.singleton(sampleDataToken, () =>
        createSampleDataService(),
      );
    }
    const config = this.getDatabaseConfig();
    if (config.default === 'none') {
      return;
    }

    this.app.container.singleton(databaseManagerToken, () => {
      const database = createAppDatabaseManager(config, this.app.paths);
      if (!database) {
        throw new Error('Database is not configured.');
      }

      return database;
    });
  }

  public override async boot(): Promise<void> {
    const { container } = this.app;
    if (!container.has(databaseManagerToken)) {
      return;
    }

    const config = this.getDatabaseConfig();
    const plan = planAppDatabaseTasks(config, ['migrations', 'seeds'], {
      paths: this.app.paths,
      contributions: this.app.databaseTaskContributions,
      autoRun: true,
    });
    // All SQLite connections must be usable by runtime services even without automatic tasks.
    await prepareAppDatabaseStorage(
      config,
      this.app.paths,
      Object.keys(config.connections),
    );
    const database = container.resolve(databaseManagerToken);
    const result = await executeAppDatabasePlan(database, config, plan, {
      runtimeConfig: this.app.config,
      container: this.app.container,
      paths: this.app.paths,
    });
    this.reportChecksumWarnings(result);
    this.prepareSampleData(config, plan, result, database);
    await this.refreshCollections(config, result, database);
  }

  /**
   * Tells the sample data service where samples are recorded — the default connection's seed history — and whether
   * this start installed that connection with `app.sampleData` set. Without a seeds run on the default connection,
   * nothing is prepared and no sample is built or recorded.
   */
  private prepareSampleData(
    config: AppDatabaseConfig,
    plan: readonly AppDatabaseTask[],
    result: AppDatabaseTasksResult,
    database: DatabaseManager,
  ): void {
    const { container } = this.app;
    if (!container.has(sampleDataToken)) return;
    const connection = defaultConnectionName(config);
    const task = plan.find(
      (entry) =>
        entry.kind === 'seeds' &&
        entry.connection === connection &&
        !entry.skipReason,
    );
    const seeded = result.results.find(
      (entry) =>
        entry.kind === 'seeds' &&
        entry.connection === connection &&
        entry.status === 'completed',
    );
    if (!task || !seeded) return;
    const seeder = createAppSeeder({
      runtimeConfig: snapshotDatabaseTaskConfig(this.app.config),
      container: createTaskServiceResolver(container),
      database,
      connection: task.connection,
      config: task.config,
      sources: task.config.sources,
    });
    container.resolve(sampleDataToken).prepare({
      ledger: {
        history: () => seeder.history(),
        record: (entry) => seeder.record(entry),
      },
      enabled:
        seeded.freshInstall === true &&
        this.app.config.get<unknown>('app.sampleData') === true,
    });
  }

  /**
   * Startup migrations make `database/<connection>/collections/` stale just
   * as `db apply` does, and under `nocobase dev` they are the usual cause. So
   * the development server refreshes the cache of every connection they
   * changed. Nothing else does: production never sets the variable.
   */
  private async refreshCollections(
    config: AppDatabaseConfig,
    result: AppDatabaseTasksResult,
    database: DatabaseManager,
  ): Promise<void> {
    const target = process.env[COLLECTIONS_REFRESH_ENV];
    if (!target || !sameDirectory(target, this.app.paths.root())) return;
    const refreshed = await refreshAppCollectionsArtifact(config, result, {
      paths: this.app.paths,
      database,
    });
    for (const entry of refreshed ?? []) {
      if (entry.status !== 'failed') continue;
      const message = `Could not refresh the Collection cache of "${entry.connection}": ${entry.error}. Run "nocobase collections generate --connection ${entry.connection}" to rebuild it.`;
      if (this.app.container.has(loggingToken)) {
        this.app.container
          .resolve(loggingToken)
          .getLogger('database')
          .warn({ connection: entry.connection }, message);
      } else {
        console.warn(message);
      }
    }
  }

  /**
   * Automatic startup tasks have no console to report to, so drift tolerated by
   * the `warn` policy is only visible if it reaches the application log.
   */
  private reportChecksumWarnings(result: AppDatabaseTasksResult): void {
    const { container } = this.app;
    if (!container.has(loggingToken)) return;
    let logger: Logger | undefined;
    for (const entry of result.results) {
      for (const warning of entry.warnings ?? []) {
        logger ??= container.resolve(loggingToken).getLogger('database');
        logger.warn(
          {
            connection: entry.connection,
            kind: entry.kind,
            package: warning.packageName,
            name: warning.name,
            recordedChecksum: warning.recordedChecksum,
            sourceChecksum: warning.sourceChecksum,
          },
          `Executed ${entry.kind === 'migrations' ? 'migration' : 'seed'} "${warning.name}" no longer matches its source. Run "nocobase db repair" when the edit left the schema identical, or "nocobase db redo" when it changed what ran.`,
        );
      }
    }
  }

  public override async shutdown(): Promise<void> {
    await this.app.container.resolveIfCreated(databaseManagerToken)?.destroy();
  }

  private getDatabaseConfig(): AppDatabaseConfig {
    return this.app.config.get<AppDatabaseConfig>('database')!;
  }
}

function sameDirectory(left: string, right: string): boolean {
  const resolve = (directory: string): string => {
    try {
      return realpathSync(directory);
    } catch {
      return path.resolve(directory);
    }
  };
  return resolve(left) === resolve(right);
}
