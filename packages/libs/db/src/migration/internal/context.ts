import type { ServiceResolver } from '@nocobase/service-provider';
import { emptyDatabaseTaskContainer } from '../../task-container.js';
import {
  emptyDatabaseTaskConfig,
  type DatabaseTaskConfig,
} from '../../task-config.js';
import type { DatabaseConnection } from '../../database/connection.js';
import type { MigrationContext, MigrationConnection } from '../types.js';
import { databaseTaskData } from '../../database/internal/task-data.js';
import { TASK_LOCK_SCOPE } from './lock.js';

export function createMigrationContext(
  connection: DatabaseConnection,
  config: DatabaseTaskConfig = emptyDatabaseTaskConfig,
  container: ServiceResolver = emptyDatabaseTaskContainer,
): MigrationContext {
  return {
    config,
    container,
    builder: connection.builder,
    query: createTaskQuery(connection),
    repository: createTaskRepositoryAccessor(connection),
    connection: createMigrationConnection(connection),
  };
}

/**
 * Collection-level access bound to the connection the task runs on. Shared by
 * migrations and seeds so both reach the transaction's connection rather than
 * the application's DatabaseManager, which their service container withholds
 * for exactly that reason.
 *
 * Writes made here emit no Repository mutation events: a task runs while an
 * application installs or upgrades, before the services listeners depend on
 * are up, and its effect must not depend on which listeners happen to be
 * registered.
 */
export function createTaskRepositoryAccessor(
  connection: DatabaseConnection,
): MigrationContext['repository'] {
  const task = databaseTaskData.get(connection);
  return task
    ? task.repository.bind(task)
    : connection.repository.bind(connection);
}

export function createTaskQuery(
  connection: DatabaseConnection,
): MigrationContext['query'] {
  return databaseTaskData.get(connection)?.query() ?? connection.query;
}

export function createMigrationConnection(
  connection: DatabaseConnection,
): MigrationConnection {
  return {
    name: connection.name,
    driver: connection.driver,
    dialect: connection.dialect,
    capabilities: connection.capabilities,
    client: connection.client.bind(connection),
    // Every wrapper made from one Database Connection shares its in-process lock claims.
    [TASK_LOCK_SCOPE]: connection,
  } as MigrationConnection;
}
