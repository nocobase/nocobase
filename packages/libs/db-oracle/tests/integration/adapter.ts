import { createDatabaseManager, rawRows } from '@nocobase/db';
import {
  createDatabaseIntegrationAdapter,
  dropPortableIntegrationObjects,
  type DatabaseIntegrationAdapter,
  type DatabaseIntegrationProfile,
} from '@nocobase/db-testkit';
import oracle from '../../src/index.js';

export const oracleIntegrationProfile: DatabaseIntegrationProfile = {
  numeric: {
    nativeResults: false,
    integerResults: 'string',
    nativeAggregates: false,
    bigintAverage: 'fractional',
    exactProjection: 'toChar',
    bigintBinding: 'supported',
    bigintRange: 'limited',
    storagePrecision: 'exact',
  },
  character: {
    charRead: 'padded',
    lengthUnit: 'bytes',
    collation: false,
    characterSet: false,
  },
  temporal: {
    precisionProbeType: 'timestamp(6) with time zone',
    logicalTypes: {
      day: 'datetime',
      time: 'string',
      local: 'datetime',
      instant: 'datetimeTz',
    },
    inspectorDataTypes: {
      day: 'datetime',
      clock: 'string',
      instant: 'datetimeTz',
    },
    fixtureTypes: [
      'DATE',
      'VARCHAR2(18)',
      'TIMESTAMP(3)',
      'TIMESTAMP(6) WITH TIME ZONE',
    ],
    sessionTimezone: 'alterSession',
    instantFilterInput: 'date',
    isoLiteralFilters: true,
    instantPrimaryKey: false,
  },
  schema: {
    defaultSchema: 'public',
    declareSchema: false,
    supportsSchemas: true,
    uniqueConstraints: true,
    foreignKeyActions: { onDelete: 'noAction', onUpdate: 'noAction' },
    uniqueConstraintDropKeepsIndex: true,
    nativeTextType: 'clob',
    textAlterations: 'unsupported',
    comments: 'complete',
    booleanStorage: 'decimal',
    emptyStringIsNull: true,
    integerResolution: 'decimal',
    scalarTypes: [
      'CHAR(8 CHAR)',
      'VARCHAR2(16 BYTE)',
      'NUMBER(10,0)',
      'BINARY_FLOAT',
      'NUMBER(1,0)',
    ],
    scalarInspection: {
      quantity: { dataType: 'decimal', precision: 10, scale: 0 },
      nativeTypes: { fixed: 'CHAR(8 CHAR)', label: 'VARCHAR2(16 BYTE)' },
    },
  },
  json: {
    filters: 'unsupported',
  },
} satisfies DatabaseIntegrationProfile;

export const oracleIntegrationAdapter: DatabaseIntegrationAdapter =
  createDatabaseIntegrationAdapter({
    name: 'oracle',
    profile: oracleIntegrationProfile,
    createDatabase: (prefix, metadataStore) =>
      createDatabaseManager({
        default: 'main',
        metadataStore,
        connections: {
          main: oracle({
            host: process.env.ORACLE_HOST ?? '127.0.0.1',
            port: Number(process.env.ORACLE_PORT ?? 11521),
            username: process.env.ORACLE_USER ?? 'nocobase',
            password: process.env.ORACLE_PASSWORD ?? 'nocobase',
            serviceName: process.env.ORACLE_SERVICE_NAME ?? 'FREEPDB1',
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
      const sequences = await context.db.raw(
        `select s.sequence_name as "name"
         from user_sequences s
         where not exists (
           select 1
           from user_tab_identity_cols i
           where i.sequence_name = s.sequence_name
         )
           and s.sequence_name like ?`,
        [`${context.prefix.toUpperCase()}_%`],
      );
      for (const row of rawRows<{ name: string }>(sequences))
        await context.db.raw(
          `drop sequence "${row.name.replaceAll('"', '""')}"`,
        );
    },
  });
