import type { ServiceResolver } from '@nocobase/service-provider';
import { emptyDatabaseTaskContainer } from '../../task-container.js';
import {
  emptyDatabaseTaskConfig,
  type DatabaseTaskConfig,
} from '../../task-config.js';
import type { DatabaseConnection } from '../../database/connection.js';
import {
  createMigrationConnection,
  createTaskQuery,
  createTaskRepositoryAccessor,
} from '../../migration/internal/context.js';
import type { SeedContext, SeedConnection } from '../types.js';

export function createSeedContext(
  connection: DatabaseConnection,
  config: DatabaseTaskConfig = emptyDatabaseTaskConfig,
  container: ServiceResolver = emptyDatabaseTaskContainer,
): SeedContext {
  return {
    config,
    container,
    repository: createTaskRepositoryAccessor(connection),
    query: createTaskQuery(connection),
    connection: createSeedConnection(connection),
  };
}

export function createSeedConnection(
  connection: DatabaseConnection,
): SeedConnection {
  return createMigrationConnection(connection);
}
