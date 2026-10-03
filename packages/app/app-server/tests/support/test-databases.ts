import {
  provisionTestDatabases,
  type ProvisionedTestDatabases,
} from '@nocobase/db-testing';
import { afterEach } from 'vitest';

import type { AppDatabaseConfig } from '../../src/database/index.js';

export type ProvisionTestDatabases = (
  connections?: readonly string[],
) => Promise<ProvisionedTestDatabases>;

/**
 * Provisions isolated databases on the dialect `NOCOBASE_TEST_DB_DIALECT`
 * selects, one per connection name, and drops every one of them after the
 * test that asked for them. Each call gets databases of its own, so a test
 * that builds several applications keeps them apart.
 *
 * Call it at the top level of a test file: it registers the `afterEach` that
 * drops the databases.
 */
export function useTestDatabases(): ProvisionTestDatabases {
  const provisioned: ProvisionedTestDatabases[] = [];
  afterEach(async () => {
    const failures: unknown[] = [];
    for (const databases of provisioned.splice(0)) {
      try {
        await databases.drop();
      } catch (error) {
        failures.push(error);
      }
    }
    if (failures.length > 0) {
      throw new AggregateError(failures, 'Failed to drop test databases.');
    }
  });
  return async (connections) => {
    const databases = await provisionTestDatabases(
      connections ? { connections } : {},
    );
    provisioned.push(databases);
    return databases;
  };
}

/**
 * The configuration as `config.yml` carries it: no `drivers` and no driver
 * attached to a connection, so the code under test has to load the official
 * driver of each connection's dialect itself. A provisioned connection
 * configuration carries its driver; this takes it away again.
 */
export function withoutDrivers(config: AppDatabaseConfig): AppDatabaseConfig {
  return {
    ...config,
    drivers: undefined,
    connections: Object.fromEntries(
      Object.entries(config.connections).map(([name, connection]) => {
        const { databaseDriver: _databaseDriver, ...rest } = connection;
        return [name, rest];
      }),
    ),
  };
}
