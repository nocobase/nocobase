import type { DatabaseConnection } from '../database/connection.js';
import { createMigrationConnection } from './internal/context.js';
import { withTaskLock, type TaskLockDescriptor } from './internal/lock.js';

/** Share the database task lease across admission, migration and activation. */
export function withDatabaseTaskLock<T>(
  connection: DatabaseConnection,
  options: TaskLockDescriptor,
  execute: () => Promise<T>,
): Promise<T> {
  return withTaskLock(createMigrationConnection(connection), options, execute);
}
