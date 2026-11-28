import { createDatabaseManager } from '@nocobase/db';
import {
  createDatabaseIntegrationAdapter,
  dropPortableIntegrationObjects,
  type DatabaseIntegrationAdapter,
  type DatabaseIntegrationProfile,
} from '@nocobase/db-testkit';
import mssql from '../../src/index.js';

export const mssqlIntegrationProfile: DatabaseIntegrationProfile = {
  coldTransactionNaming: true,
  numeric: {
    nativeResults: false,
    integerResults: 'number',
    nativeAggregates: false,
    bigintAverage: 'fractional',
    exactProjection: 'castVarchar',
    bigintBinding: 'unsupported',
    bigintRange: 'full',
    storagePrecision: 'exact',
  },
  character: {
    charRead: 'padded',
    lengthUnit: 'utf16CodeUnits',
    collation: true,
    characterSet: false,
  },
  temporal: {
    precisionProbeType: 'datetimeoffset(6)',
    logicalTypes: {
      day: 'date',
      time: 'time',
      local: 'datetime',
      instant: 'datetimeTz',
    },
    inspectorDataTypes: {
      day: 'date',
      clock: 'time',
      instant: 'datetimeTz',
    },
    fixtureTypes: ['date', 'time(3)', 'datetime2(3)', 'datetimeoffset(6)'],
    sessionTimezone: 'unsupported',
    instantFilterInput: 'iso',
    isoLiteralFilters: true,
    instantPrimaryKey: true,
  },
  schema: {
    defaultSchema: 'dbo',
    declareSchema: true,
    supportsSchemas: true,
    uniqueConstraints: false,
    foreignKeyActions: { onDelete: 'noAction', onUpdate: 'cascade' },
    uniqueConstraintDropKeepsIndex: false,
    nativeTextType: 'nvarchar(max)',
    comments: 'complete',
    booleanStorage: 'native',
    emptyStringIsNull: false,
    integerResolution: 'integer',
    scalarTypes: ['nchar(8)', 'nvarchar(16)', 'tinyint', 'real', 'bit'],
    scalarInspection: {
      quantity: { dataType: 'integer', integerBits: 8, unsigned: true },
    },
  },
  json: {
    filters: 'unsupported',
  },
} satisfies DatabaseIntegrationProfile;

export const mssqlIntegrationAdapter: DatabaseIntegrationAdapter =
  createDatabaseIntegrationAdapter({
    name: 'mssql',
    profile: mssqlIntegrationProfile,
    createDatabase: (prefix, metadataStore) =>
      createDatabaseManager({
        default: 'main',
        metadataStore,
        connections: {
          main: mssql({
            host: process.env.MSSQL_HOST ?? '127.0.0.1',
            port: Number(process.env.MSSQL_PORT ?? 11433),
            username: process.env.MSSQL_USER ?? 'sa',
            password: process.env.MSSQL_PASSWORD ?? 'NocoBase_Mssql_2026',
            database:
              process.env.MSSQL_DATABASE ?? 'nocobase_collection_builder',
            encrypt: false,
            trustServerCertificate: true,
            naming: { tablePrefix: `${prefix}_` },
          }),
        },
      }),
    cleanup: async (context) => {
      await dropPortableIntegrationObjects(context, [
        'orderItems',
        'dryRunItems',
        'viewSource',
        'viewRows',
        'keyless',
      ]);
    },
  });
