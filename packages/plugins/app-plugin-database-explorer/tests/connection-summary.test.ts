// db-test-portability: sqlite-only — summarises connection configurations that name SQLite; opens no database
import { describe, expect, it } from 'vitest';

import {
  describeConnection,
  describeConnections,
} from '../server/connection-summary.js';
import type { ConnectionSummary } from '../server/types.js';

const SECRETS = [
  'do-not-leak-password',
  'do-not-leak-user',
  'PEM-DO-NOT-LEAK',
  'do-not-leak-driver-option',
  '/var/lib/do-not-leak.sqlite',
  'do-not-leak-host',
  '/tmp/do-not-leak.sock',
];

/** Every key `describeConnection` is allowed to produce. */
const ALLOWED_KEYS: readonly (keyof ConnectionSummary)[] = [
  'name',
  'isDefault',
  'dialect',
  'driver',
  'schemaManagement',
  'databaseName',
  'schemas',
  'naming',
  'internalTables',
];

const credentials = {
  username: 'do-not-leak-user',
  password: 'do-not-leak-password',
  driverOptions: { password: 'do-not-leak-driver-option' },
  pool: { min: 1, max: 5 },
};

const configurations = {
  sqlite: {
    dialect: 'sqlite',
    filename: '/var/lib/do-not-leak.sqlite',
    ...credentials,
  },
  postgres: {
    dialect: 'postgres',
    host: 'do-not-leak-host',
    port: 5432,
    database: 'analytics',
    schema: ['public', 'reporting'],
    ssl: { key: 'PEM-DO-NOT-LEAK', ca: 'PEM-DO-NOT-LEAK' },
    ...credentials,
  },
  mysqlOverHost: {
    dialect: 'mysql',
    host: 'do-not-leak-host',
    port: 3306,
    database: 'shop',
    ssl: true,
    ...credentials,
  },
  mysqlOverSocket: {
    dialect: 'mysql',
    socketPath: '/tmp/do-not-leak.sock',
    database: 'shop',
    ...credentials,
  },
  oracle: {
    dialect: 'oracle',
    host: 'do-not-leak-host',
    port: 1521,
    serviceName: 'FREEPDB1',
    ...credentials,
  },
  mssql: {
    dialect: 'mssql',
    host: 'do-not-leak-host',
    port: 1433,
    database: 'erp',
    ...credentials,
  },
  // A dialect package this plugin has never seen, carrying its own secret.
  future: {
    dialect: 'futuredb',
    apiToken: 'do-not-leak-password',
    endpoint: 'do-not-leak-host',
    ...credentials,
  },
} as const;

// The configurations above are deliberately wider than the declared union so
// they can carry the fields a leak would expose.
const cases = Object.entries(configurations) as [
  string,
  Parameters<typeof describeConnection>[1],
][];

describe('describeConnection', () => {
  it.each(cases)(
    'never lets %s reveal a credential or a locator',
    (_name, config) => {
      const serialized = JSON.stringify(
        describeConnection('main', config, 'main'),
      );

      for (const secret of SECRETS) {
        expect(serialized).not.toContain(secret);
      }
    },
  );

  it.each(cases)('copies only allow-listed keys out of %s', (_name, config) => {
    const summary = describeConnection('main', config, 'main');

    expect(
      Object.keys(summary).filter(
        (key) => !ALLOWED_KEYS.includes(key as keyof ConnectionSummary),
      ),
    ).toEqual([]);
  });

  it('reports base fields only for a dialect it does not know', () => {
    expect(describeConnection('odd', configurations.future, 'main')).toEqual({
      name: 'odd',
      isDefault: false,
      dialect: 'futuredb',
      schemaManagement: 'managed',
    });
  });

  it('reports the logical database and schemas a viewer can act on', () => {
    expect(describeConnection('main', configurations.postgres, 'main')).toEqual(
      {
        name: 'main',
        isDefault: true,
        dialect: 'postgres',
        schemaManagement: 'managed',
        databaseName: 'analytics',
        schemas: ['public', 'reporting'],
      },
    );
  });

  it('reads an Oracle service name as the database it names', () => {
    expect(
      describeConnection('warehouse', configurations.oracle, 'main'),
    ).toMatchObject({ databaseName: 'FREEPDB1', isDefault: false });
  });

  it('keeps a declared external connection marked external', () => {
    expect(
      describeConnection(
        'crm',
        { ...configurations.postgres, schemaManagement: 'external' },
        'main',
      ),
    ).toMatchObject({ schemaManagement: 'external' });
  });

  it('carries naming options a viewer needs to read table names', () => {
    expect(
      describeConnection(
        'main',
        {
          ...configurations.postgres,
          naming: { underscored: true, tablePrefix: 'nb_' },
        },
        'main',
      ),
    ).toMatchObject({ naming: { underscored: true, tablePrefix: 'nb_' } });
  });
});

describe('describeConnections', () => {
  it('sorts by name and marks exactly one default', () => {
    const summaries = describeConnections(
      {
        main: configurations.postgres,
        analytics: configurations.mysqlOverHost,
        crm: configurations.sqlite,
      },
      'main',
    );

    expect(summaries.map((item) => item.name)).toEqual([
      'analytics',
      'crm',
      'main',
    ]);
    expect(
      summaries.filter((item) => item.isDefault).map((item) => item.name),
    ).toEqual(['main']);
  });
});
