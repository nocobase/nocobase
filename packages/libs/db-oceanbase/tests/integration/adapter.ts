import { createDatabaseManager } from '@nocobase/db';
import {
  createDatabaseIntegrationAdapter,
  dropPortableIntegrationObjects,
  type DatabaseIntegrationAdapter,
  type DatabaseIntegrationProfile,
} from '@nocobase/db-testkit';
import oceanbase from '../../src/index.js';

export const oceanbaseIntegrationProfile: DatabaseIntegrationProfile = {
  numeric: {
    nativeResults: false,
    integerResults: 'number',
    nativeAggregates: true,
    bigintAverage: 'fractional',
    exactProjection: 'castChar',
    bigintBinding: 'supported',
    bigintRange: 'full',
    storagePrecision: 'exact',
  },
  character: {
    charRead: 'trimmed',
    lengthUnit: 'characters',
    collation: true,
    characterSet: true,
  },
  temporal: {
    precisionProbeType: 'datetime(6)',
    logicalTypes: {
      day: 'date',
      time: 'time',
      local: 'datetime',
      instant: 'datetime',
    },
    inspectorDataTypes: {
      day: 'date',
      clock: 'time',
      instant: 'datetimeTz',
    },
    fixtureTypes: ['date', 'time(3)', 'datetime(3)', 'timestamp(6)'],
    sessionTimezone: 'setTimeZone',
    instantFilterInput: 'mysqlDateTime',
    isoLiteralFilters: true,
    instantPrimaryKey: true,
  },
  schema: {
    defaultSchema: 'public',
    declareSchema: true,
    supportsSchemas: false,
    uniqueConstraints: true,
    foreignKeyActions: { onDelete: 'restrict', onUpdate: 'cascade' },
    uniqueConstraintDropKeepsIndex: false,
    nativeTextType: 'text',
    textDefaults: 'unsupported',
    comments: 'complete',
    booleanStorage: 'integer',
    emptyStringIsNull: false,
    integerResolution: 'integer',
    scalarTypes: [
      'char(8)',
      'varchar(16)',
      'int unsigned',
      'float',
      'tinyint(1)',
    ],
    scalarInspection: {
      quantity: { dataType: 'integer', integerBits: 32, unsigned: true },
    },
  },
  json: {
    filters: 'supported',
    defaults: 'unsupported',
  },
} satisfies DatabaseIntegrationProfile;

export const oceanbaseIntegrationAdapter: DatabaseIntegrationAdapter =
  createDatabaseIntegrationAdapter({
    name: 'oceanbase',
    profile: oceanbaseIntegrationProfile,
    createDatabase: (prefix, metadataStore) =>
      createDatabaseManager({
        default: 'main',
        metadataStore,
        connections: {
          main: oceanbase({
            host: process.env.OCEANBASE_HOST ?? '127.0.0.1',
            port: Number(process.env.OCEANBASE_PORT ?? 12881),
            username: process.env.OCEANBASE_USER ?? 'root@test',
            password: process.env.OCEANBASE_PASSWORD ?? 'ObTest_123456',
            database:
              process.env.OCEANBASE_DATABASE ?? 'nocobase_collection_builder',
            naming: { tablePrefix: `${prefix}_` },
          }),
        },
      }),
    cleanup: async (context) => {
      await context.db.raw('set foreign_key_checks = 0');
      try {
        await dropPortableIntegrationObjects(context, [
          'orderItems',
          'dryRunItems',
          'viewSource',
          'viewRows',
          'keyless',
        ]);
      } finally {
        await context.db.raw('set foreign_key_checks = 1');
      }
    },
  });
